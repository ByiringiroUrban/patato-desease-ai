from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from api.schemas import PredictionResponse
from src.inference.predict import predict_image


router = APIRouter(tags=["Prediction"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
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
