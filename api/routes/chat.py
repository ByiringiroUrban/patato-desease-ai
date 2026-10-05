from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import User, ChatSession, ChatMessage
from api.auth import get_current_user, get_optional_current_user
from api.schemas import ChatMessageCreate, ChatMessageResponse, ChatSessionResponse
from api.services.gemini_service import chat_with_agronomist_llm

router = APIRouter(tags=["AI Agronomist Chat"])

@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    msg_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    user_plan = current_user.plan if current_user else "free"
    
    # If authenticated, fetch session or create one
    session = None
    if current_user:
        if msg_in.session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == msg_in.session_id,
                ChatSession.user_id == current_user.id
            ).first()
        
        if not session:
            title = (msg_in.content[:35] + "...") if len(msg_in.content) > 35 else msg_in.content
            session = ChatSession(user_id=current_user.id, title=title)
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Save user message
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=msg_in.content
        )
        db.add(user_msg)
        db.commit()

        # Load recent context
        past_msgs = db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id
        ).order_by(ChatMessage.created_at.asc()).limit(15).all()
        
        message_history = [{"role": m.role, "content": m.content} for m in past_msgs]
    else:
        message_history = [{"role": "user", "content": msg_in.content}]

    # Call Gemini AI Agronomist
    ai_reply = chat_with_agronomist_llm(message_history, user_plan=user_plan)

    if current_user and session:
        bot_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=ai_reply
        )
        db.add(bot_msg)
        db.commit()
        db.refresh(bot_msg)
        return bot_msg
    else:
        # Unauthenticated temporary return
        from datetime import datetime, timezone
        return ChatMessageResponse(
            id=0,
            role="assistant",
            content=ai_reply,
            created_at=datetime.now(timezone.utc)
        )



@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).all()
    return sessions

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session
