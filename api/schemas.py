from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    class_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: dict[str, float]

from datetime import datetime
from typing import Optional

class PredictionHistoryResponse(BaseModel):
    id: int
    predicted_class: str
    confidence: float
    image_filename: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

