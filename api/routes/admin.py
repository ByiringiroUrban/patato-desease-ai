from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from api.database import get_db
from api.models import User, PredictionHistory
from api.auth import get_current_admin_user
from api.schemas import (
    AdminStatsResponse,
    AdminUserResponse,
    AdminPredictionResponse,
)

router = APIRouter(tags=["Admin"])


# ── Helper ────────────────────────────────────────────────────────────────────

def _class_matches(name: str, keyword: str) -> bool:
    return keyword.lower() in (name or "").lower()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Return aggregated system statistics."""
    total_users = db.query(func.count(User.id)).scalar()
    predictions = db.query(PredictionHistory).all()

    total_predictions = len(predictions)
    healthy_count = sum(1 for p in predictions if _class_matches(p.predicted_class, "healthy"))
    early_blight_count = sum(1 for p in predictions if _class_matches(p.predicted_class, "early"))
    late_blight_count = sum(1 for p in predictions if _class_matches(p.predicted_class, "late"))
    avg_confidence = (
        sum(p.confidence for p in predictions) / total_predictions
        if total_predictions > 0
        else 0.0
    )

    return AdminStatsResponse(
        total_users=total_users,
        total_predictions=total_predictions,
        healthy_count=healthy_count,
        early_blight_count=early_blight_count,
        late_blight_count=late_blight_count,
        average_confidence=round(avg_confidence, 4),
    )


@router.get("/users", response_model=List[AdminUserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Return a paginated list of all registered users with their prediction counts."""
    users = db.query(User).offset(skip).limit(limit).all()
    result = []
    for u in users:
        count = db.query(func.count(PredictionHistory.id)).filter(
            PredictionHistory.user_id == u.id
        ).scalar()
        result.append(
            AdminUserResponse(
                id=u.id,
                email=u.email,
                is_admin=u.is_admin,
                created_at=u.created_at,
                prediction_count=count,
            )
        )
    return result


@router.get("/predictions", response_model=List[AdminPredictionResponse])
def get_all_predictions(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Return all prediction records across all users."""
    records = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for r in records:
        user = db.query(User).filter(User.id == r.user_id).first()
        result.append(
            AdminPredictionResponse(
                id=r.id,
                user_id=r.user_id,
                user_email=user.email if user else "unknown",
                predicted_class=r.predicted_class,
                confidence=r.confidence,
                image_filename=r.image_filename,
                created_at=r.created_at,
            )
        )
    return result


@router.patch("/users/{user_id}/toggle-admin")
def toggle_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Promote or demote a user's admin status."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own admin status.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Permanently delete a user and all their predictions."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account from here.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.query(PredictionHistory).filter(PredictionHistory.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} and their predictions deleted.", "id": user_id}


@router.delete("/predictions/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Delete any prediction record."""
    record = db.query(PredictionHistory).filter(PredictionHistory.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    db.delete(record)
    db.commit()
    return {"message": "Prediction deleted.", "id": prediction_id}
