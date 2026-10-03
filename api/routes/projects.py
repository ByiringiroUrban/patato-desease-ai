from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from api.database import get_db
from api.models import User, Project, PredictionHistory
from api.auth import get_current_user
from api.schemas import ProjectCreate, ProjectResponse, PredictionHistoryResponse

router = APIRouter(tags=["Projects"])

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()
    results = []
    for p in projects:
        scan_count = db.query(func.count(PredictionHistory.id)).filter(PredictionHistory.project_id == p.id).scalar()
        results.append(
            ProjectResponse(
                id=p.id,
                user_id=p.user_id,
                name=p.name,
                description=p.description,
                location=p.location,
                created_at=p.created_at,
                scan_count=scan_count or 0
            )
        )
    return results

@router.post("/", response_model=ProjectResponse)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check limit for free users (max 2 projects)
    if current_user.plan == "free":
        existing_count = db.query(func.count(Project.id)).filter(Project.user_id == current_user.id).scalar()
        if existing_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free tier is limited to 2 field projects. Upgrade to Pro for unlimited plots."
            )

    new_project = Project(
        user_id=current_user.id,
        name=project_in.name,
        description=project_in.description,
        location=project_in.location
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return ProjectResponse(
        id=new_project.id,
        user_id=new_project.user_id,
        name=new_project.name,
        description=new_project.description,
        location=new_project.location,
        created_at=new_project.created_at,
        scan_count=0
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_detail(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    scan_count = db.query(func.count(PredictionHistory.id)).filter(PredictionHistory.project_id == project.id).scalar()
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        name=project.name,
        description=project.description,
        location=project.location,
        created_at=project.created_at,
        scan_count=scan_count or 0
    )

@router.get("/{project_id}/scans", response_model=List[PredictionHistoryResponse])
def get_project_scans(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    scans = db.query(PredictionHistory).filter(
        PredictionHistory.project_id == project_id,
        PredictionHistory.user_id == current_user.id
    ).order_by(PredictionHistory.created_at.desc()).all()
    return scans

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Unlink scans or let delete
    db.query(PredictionHistory).filter(PredictionHistory.project_id == project_id).update({"project_id": None})
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully", "id": project_id}
