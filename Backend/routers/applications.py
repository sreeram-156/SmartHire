from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Application, Job, Recruiter, User
from schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate
)
from dependencies import require_user, require_recruiter


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


@router.post(
    "/",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED
)
def apply_for_job(
    application_data: ApplicationCreate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == application_data.job_id,
        Job.status == "Active",
        Job.approval_status == "Approved"
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found or job is not available"
        )

    existing_application = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == application_data.job_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    application = Application(
        user_id=current_user.id,
        job_id=application_data.job_id,
        status="Applied",
        resume=application_data.resume
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@router.get(
    "/my-applications",
    response_model=list[ApplicationResponse]
)
def get_my_applications(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    applications = db.query(Application).filter(
        Application.user_id == current_user.id
    ).all()

    return applications


@router.get(
    "/job/{job_id}",
    response_model=list[ApplicationResponse]
)
def get_job_applications(
    job_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    recruiter = db.query(Recruiter).filter(
        Recruiter.user_id == current_user.id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter profile not found"
        )

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == recruiter.id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found or you do not own this job"
        )

    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).all()

    return applications


@router.put(
    "/{application_id}/status",
    response_model=ApplicationResponse
)
def update_application_status(
    application_id: int,
    status_data: ApplicationStatusUpdate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    allowed_statuses = {
        "Applied",
        "Reviewing",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected"
    }

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    recruiter = db.query(Recruiter).filter(
        Recruiter.user_id == current_user.id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter profile not found"
        )

    application = db.query(Application).join(Job).filter(
        Application.id == application_id,
        Job.recruiter_id == recruiter.id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found or you do not own this application"
        )

    application.status = status_data.status

    db.commit()
    db.refresh(application)

    return application