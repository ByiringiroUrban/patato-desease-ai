from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from api.database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    predicted_class = Column(String, index=True)
    confidence = Column(Float)
    image_filename = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
