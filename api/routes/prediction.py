from pathlib import Path

from typing import List
from fastapi import APIRouter, File, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session

from api.schemas import PredictionResponse, PredictionHistoryResponse
from src.inference.predict import predict_image
from api.database import get_db
from api.models import PredictionHistory, User
from api.auth import get_current_user


router = APIRouter(tags=["Prediction"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP images are supported.",
        )

    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image is too large.")

    temp_dir = Path("data/processed")
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = temp_dir / "_api_upload.jpg"

    try:
        temp_path.write_bytes(data)
        result = predict_image(str(temp_path))

        db_record = PredictionHistory(
            user_id=current_user.id,
            predicted_class=result["class"],
            confidence=result["confidence"],
            image_filename=file.filename
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        return PredictionResponse(
            class_name=result["class"],
            confidence=result["confidence"],
            probabilities=result["probabilities"],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        ) from exc
    finally:
        temp_path.unlink(missing_ok=True)

@router.get("/history", response_model=List[PredictionHistoryResponse])
def get_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id).order_by(PredictionHistory.created_at.desc()).offset(skip).limit(limit).all()
    return records
