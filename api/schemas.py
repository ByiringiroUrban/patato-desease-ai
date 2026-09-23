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


# ── Admin Schemas ────────────────────────────────────────────────────────────

class AdminStatsResponse(BaseModel):
    total_users: int
    total_predictions: int
    healthy_count: int
    early_blight_count: int
    late_blight_count: int
    average_confidence: float

class AdminUserResponse(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool
    created_at: datetime
    prediction_count: int

    model_config = {"from_attributes": True}

class AdminPredictionResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    predicted_class: str
    confidence: float
    image_filename: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
