from datetime import timedelta, datetime, timezone
import random
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from api.database import get_db
from api.models import User
from api.schemas import UserCreate, UserResponse, Token, ForgotPasswordRequest, ResetPasswordRequest
from api.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
    send_reset_email,
    upload_profile_image,
    SECRET_KEY,
    ALGORITHM
)

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=400, detail="Incorrect email or password"
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile, including is_admin status."""
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return {"message": "If an account with this email exists, an OTP has been sent."}
    
    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    send_reset_email(req.email, otp)
    
    return {"message": "If an account with this email exists, an OTP has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if not user.reset_otp or user.reset_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if user.reset_otp_expiry and user.reset_otp_expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None
    db.commit()
    
    return {"message": "Password has been reset successfully"}

@router.post("/profile-image", response_model=UserResponse)
def update_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    contents = file.file.read()
    
    url = upload_profile_image(contents, public_id=f"user_{current_user.id}_profile")
    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
        
    current_user.profile_image = url
    db.commit()
    db.refresh(current_user)
    
    return current_user
