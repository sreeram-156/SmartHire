
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Job, Recruiter, User
from schemas import JobCreate, JobResponse
from dependencies import require_recruiter


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


def get_approved_recruiter(
    current_user: User,
    db: Session
) -> Recruiter:
    recruiter = db.query(Recruiter).filter(
        Recruiter.user_id == current_user.id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter profile not found"
        )

    if recruiter.approval_status != "Approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter account is not approved"
        )

    return recruiter


@router.post(
    "/",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED
)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    recruiter = get_approved_recruiter(current_user, db)

    new_job = Job(
        recruiter_id=recruiter.id,
        title=job_data.title,
        company=recruiter.company,
        location=job_data.location,
        job_type=job_data.job_type,
        salary=job_data.salary,
        description=job_data.description,
        skills=job_data.skills,
        source="recruiter",
        status="Active",
        approval_status="Pending"
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


@router.get(
    "/",
    response_model=list[JobResponse]
)
def get_jobs(
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(
        Job.status == "Active",
        Job.approval_status == "Approved"
    ).all()

    return jobs


@router.get(
    "/my-jobs",
    response_model=list[JobResponse]
)
def get_my_jobs(
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    recruiter = db.query(Recruiter).filter(
        Recruiter.user_id == current_user.id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter profile not found"
        )

    jobs = db.query(Job).filter(
        Job.recruiter_id == recruiter.id
    ).all()

    return jobs


@router.put(
    "/{job_id}",
    response_model=JobResponse
)
def update_job(
    job_id: int,
    job_data: JobCreate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    recruiter = get_approved_recruiter(current_user, db)

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == recruiter.id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you do not have permission to edit it"
        )

    # Update the existing job in the database.
    job.title = job_data.title
    job.company = recruiter.company
    job.location = job_data.location
    job.job_type = job_data.job_type
    job.salary = job_data.salary
    job.description = job_data.description
    job.skills = job_data.skills

    # Edited jobs must be reviewed by an admin again.
    job.approval_status = "Pending"

    db.commit()
    db.refresh(job)

    return job


@router.delete(
    "/{job_id}"
)
def delete_job(
    job_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    recruiter = get_approved_recruiter(current_user, db)

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == recruiter.id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you do not have permission to delete it"
        )

    db.delete(job)
    db.commit()

    return {
        "message": "Job deleted successfully",
        "job_id": job_id
    }
