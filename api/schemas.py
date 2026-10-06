from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

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
    plan: Optional[str] = "free"
    subscription_status: Optional[str] = "active"
    daily_scans_count: Optional[int] = 0
    profile_image: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    class_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: dict[str, float]
    image_url: Optional[str] = None
    ai_analysis: Optional[str] = None
    severity: Optional[str] = None

class PredictionHistoryResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int] = None
    predicted_class: str
    confidence: float
    image_filename: Optional[str] = None
    image_url: Optional[str] = None
    ai_analysis: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

# ── Projects Schemas ─────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    scan_count: Optional[int] = 0

    model_config = {"from_attributes": True}

# ── Chat & AI Agronomist Schemas ─────────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    content: str
    session_id: Optional[int] = None

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    image_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[ChatMessageResponse] = []

    model_config = {"from_attributes": True}

# ── Stripe & Payment Schemas ─────────────────────────────────────────────────

class CheckoutSessionRequest(BaseModel):
    plan_id: str  # "pro" | "enterprise"
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str
    is_mock: bool = False

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
    plan: Optional[str] = "free"
    subscription_status: Optional[str] = "active"
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
    image_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

