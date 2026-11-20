
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Recruiter, Job
from schemas import (
    UserResponse,
    JobResponse,
    AdminActionResponse,
    AdminStatsResponse
)
from dependencies import require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get(
    "/stats",
    response_model=AdminStatsResponse
)
def get_admin_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).filter(
        User.role == "user"
    ).count()

    total_recruiters = db.query(Recruiter).count()
    total_jobs = db.query(Job).count()

    pending_recruiters = db.query(Recruiter).filter(
        Recruiter.approval_status == "Pending"
    ).count()

    pending_jobs = db.query(Job).filter(
        Job.approval_status == "Pending"
    ).count()

    return {
        "total_users": total_users,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "pending_approvals": pending_recruiters + pending_jobs
    }


@router.get(
    "/users",
    response_model=list[UserResponse]
)
def get_users(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(
        User.role == "user"
    ).all()


@router.get("/recruiters")
def get_recruiters(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    recruiters = db.query(Recruiter).all()

    result = []

    for recruiter in recruiters:
        result.append({
            "id": recruiter.id,
            "user_id": recruiter.user_id,
            "name": recruiter.user.name,
            "email": recruiter.user.email,
            "company": recruiter.company,
            "approval_status": recruiter.approval_status,
            "status": recruiter.user.status,
            "created_at": recruiter.created_at
        })

    return result


@router.get(
    "/jobs",
    response_model=list[JobResponse]
)
def get_all_jobs(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(Job).all()


@router.put(
    "/recruiters/{recruiter_id}/approve",
    response_model=AdminActionResponse
)
def approve_recruiter(
    recruiter_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    recruiter = db.query(Recruiter).filter(
        Recruiter.id == recruiter_id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter not found"
        )

    recruiter.approval_status = "Approved"
    db.commit()

    return {"message": "Recruiter approved successfully"}


@router.put(
    "/recruiters/{recruiter_id}/reject",
    response_model=AdminActionResponse
)
def reject_recruiter(
    recruiter_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    recruiter = db.query(Recruiter).filter(
        Recruiter.id == recruiter_id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter not found"
        )

    recruiter.approval_status = "Rejected"
    db.commit()

    return {"message": "Recruiter rejected successfully"}


# NEW: Activate a recruiter's account
@router.put(
    "/recruiters/{recruiter_id}/activate",
    response_model=AdminActionResponse
)
def activate_recruiter(
    recruiter_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    recruiter = db.query(Recruiter).filter(
        Recruiter.id == recruiter_id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter not found"
        )

    user = recruiter.user

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter's user account not found"
        )

    user.status = "Active"
    db.commit()

    return {"message": "Recruiter activated successfully"}


# NEW: Deactivate a recruiter's account
@router.put(
    "/recruiters/{recruiter_id}/deactivate",
    response_model=AdminActionResponse
)
def deactivate_recruiter(
    recruiter_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    recruiter = db.query(Recruiter).filter(
        Recruiter.id == recruiter_id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter not found"
        )

    user = recruiter.user

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter's user account not found"
        )

    user.status = "Inactive"
    db.commit()

    return {"message": "Recruiter deactivated successfully"}


@router.put(
    "/jobs/{job_id}/approve",
    response_model=AdminActionResponse
)
def approve_job(
    job_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job.approval_status = "Approved"
    job.status = "Active"
    db.commit()

    return {"message": "Job approved successfully"}


@router.put(
    "/jobs/{job_id}/reject",
    response_model=AdminActionResponse
)
def reject_job(
    job_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job.approval_status = "Rejected"
    db.commit()

    return {"message": "Job rejected successfully"}


@router.put(
    "/users/{user_id}/activate",
    response_model=AdminActionResponse
)
def activate_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id,
        User.role == "user"
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.status = "Active"
    db.commit()

    return {"message": "User activated successfully"}


@router.put(
    "/users/{user_id}/deactivate",
    response_model=AdminActionResponse
)
def deactivate_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id,
        User.role == "user"
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.status = "Inactive"
    db.commit()

    return {"message": "User deactivated successfully"}


@router.put(
    "/jobs/{job_id}/activate",
    response_model=AdminActionResponse
)
def activate_job(
    job_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job.status = "Active"
    db.commit()

    return {"message": "Job activated successfully"}


@router.put(
    "/jobs/{job_id}/deactivate",
    response_model=AdminActionResponse
)
def deactivate_job(
    job_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job.status = "Inactive"
    db.commit()

    return {"message": "Job deactivated successfully"}


@router.delete(
    "/users/{user_id}",
    response_model=AdminActionResponse
)
def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id,
        User.role == "user"
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.delete(
    "/recruiters/{recruiter_id}",
    response_model=AdminActionResponse
)
def delete_recruiter(
    recruiter_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    recruiter = db.query(Recruiter).filter(
        Recruiter.id == recruiter_id
    ).first()

    if recruiter is None:
        raise HTTPException(
            status_code=404,
            detail="Recruiter not found"
        )

    user = recruiter.user

    db.delete(recruiter)

    if user:
        db.delete(user)

    db.commit()

    return {"message": "Recruiter deleted successfully"}


@router.delete(
    "/jobs/{job_id}",
    response_model=AdminActionResponse
)
def delete_job(
    job_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}
