import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, File, HTTPException, UploadFile, Depends, Form, Response
from sqlalchemy.orm import Session

from api.schemas import PredictionResponse, PredictionHistoryResponse
from src.inference.predict import predict_image
from api.database import get_db
from api.models import PredictionHistory, User, Project
from api.auth import get_current_user, get_optional_current_user
from api.services.gemini_service import analyze_leaf_multimodal
from api.services.report_service import generate_diagnostic_pdf

router = APIRouter(tags=["Prediction"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 12 * 1024 * 1024  # 12 MB
UPLOAD_DIR = Path("uploads/leaves")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP images are supported.",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image is too large. Maximum size is 12MB.")

    # Quota check for free users
    if current_user and current_user.plan == "free":
        # Check if scans need daily reset
        today = datetime.utcnow().date()
        last_date = current_user.last_scan_date.date() if current_user.last_scan_date else None
        if last_date != today:
            current_user.daily_scans_count = 0
            current_user.last_scan_date = datetime.utcnow()
        
        if current_user.daily_scans_count >= 10:
            raise HTTPException(
                status_code=429,
                detail="Daily scan limit reached (10/10 scans used). Please upgrade to Pro for unlimited scans."
            )
        current_user.daily_scans_count += 1
        current_user.last_scan_date = datetime.utcnow()
        db.commit()

    # Generate permanent unique filename
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    unique_filename = f"leaf_{uuid.uuid4().hex[:12]}{file_ext}"
    saved_file_path = UPLOAD_DIR / unique_filename
    saved_file_path.write_bytes(data)

    try:
        # 1. Run local PyTorch CNN Vision Classifier
        result = predict_image(str(saved_file_path))
        
        # 2. Run Gemini Multimodal AI Pathologist Reasoning
        gemini_result = analyze_leaf_multimodal(
            image_path=str(saved_file_path),
            cnn_prediction=result["class"],
            cnn_confidence=result["confidence"],
            user_prompt=notes
        )

        image_url = f"/uploads/leaves/{unique_filename}"
        ai_analysis_text = gemini_result.get("analysis_markdown", "")
        severity = gemini_result.get("severity_estimate", "Moderate")

        db_record_id = None
        if current_user:
            # Check project validity if provided
            valid_project_id = None
            if project_id:
                proj = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
                if proj:
                    valid_project_id = proj.id

            db_record = PredictionHistory(
                user_id=current_user.id,
                project_id=valid_project_id,
                predicted_class=result["class"],
                confidence=result["confidence"],
                image_filename=file.filename,
                image_url=image_url,
                ai_analysis=ai_analysis_text
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)
            db_record_id = db_record.id

        return PredictionResponse(
            id=db_record_id,
            class_name=result["class"],
            confidence=result["confidence"],
            probabilities=result["probabilities"],
            image_url=image_url,
            ai_analysis=ai_analysis_text,
            severity=severity
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        ) from exc


@router.get("/history", response_model=List[PredictionHistoryResponse])
def get_history(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == current_user.id)
        .order_by(PredictionHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


@router.get("/{history_id}/pdf")
def export_prediction_pdf(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download a branded agronomic field inspection certificate."""
    record = db.query(PredictionHistory).filter(
        PredictionHistory.id == history_id,
        PredictionHistory.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found")

    project_name = "General Field Scout"
    if record.project_id:
        proj = db.query(Project).filter(Project.id == record.project_id).first()
        if proj:
            project_name = proj.name

    pdf_bytes = generate_diagnostic_pdf(
        prediction_data={
            "id": record.id,
            "predicted_class": record.predicted_class,
            "confidence": record.confidence,
            "ai_analysis": record.ai_analysis
        },
        user_email=current_user.email,
        project_name=project_name
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=potato_diagnosis_report_{history_id}.pdf"}
    )


@router.delete("/history/{history_id}")
def delete_history_item(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(PredictionHistory).filter(
        PredictionHistory.id == history_id, 
        PredictionHistory.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
        
    db.delete(record)
    db.commit()
    return {"message": "Task history item deleted", "id": history_id}

