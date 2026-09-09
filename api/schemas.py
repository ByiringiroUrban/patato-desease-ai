from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class PredictionResponse(BaseModel):
    class_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: dict[str, float]

class PredictionHistoryResponse(BaseModel):
    id: int
    user_id: int
    predicted_class: str
    confidence: float
    image_filename: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
