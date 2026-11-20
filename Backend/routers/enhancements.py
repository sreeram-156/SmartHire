from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_user,
    require_recruiter,
    require_user,
)
from models import Application, Job, Recruiter, User

from schemas import UserProfileUpdate, UserProfileResponse, JobApplicantDetailsResponse


router = APIRouter()

print("LOADED ENHANCEMENTS FROM:")
print(Path(__file__).resolve())

UPLOAD_DIR = Path("uploads") / "resumes"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
}

MAX_RESUME_SIZE = 10 * 1024 * 1024


class RecruiterProfileUpdate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    company: str = Field(
        min_length=2,
        max_length=150
    )


def recruiter_response(recruiter: Recruiter):
    user = recruiter.user

    return {
        "id": recruiter.id,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "company": recruiter.company,
        "role": user.role,
        "status": user.status,
        "approval_status": recruiter.approval_status,
    }


@router.get("/recruiters/me")
def get_my_recruiter_profile(
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    recruiter = (
        db.query(Recruiter)
        .filter(
            Recruiter.user_id == current_user.id
        )
        .first()
    )

    if not recruiter:
        raise HTTPException(
            status_code=404,
            detail="Recruiter profile not found."
        )

    return recruiter_response(recruiter)


@router.put("/recruiters/me")
def update_my_recruiter_profile(
    payload: RecruiterProfileUpdate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    recruiter = (
        db.query(Recruiter)
        .filter(
            Recruiter.user_id == current_user.id
        )
        .first()
    )

    if not recruiter:
        raise HTTPException(
            status_code=404,
            detail="Recruiter profile not found."
        )

    normalized_email = payload.email.lower().strip()

    duplicate_user = (
        db.query(User)
        .filter(
            User.email == normalized_email,
            User.id != current_user.id
        )
        .first()
    )

    if duplicate_user:
        raise HTTPException(
            status_code=400,
            detail="Another account already uses this email."
        )

    current_user.name = payload.name.strip()
    current_user.email = normalized_email

    recruiter.company = payload.company.strip()

    db.commit()

    db.refresh(current_user)
    db.refresh(recruiter)

    return recruiter_response(recruiter)

@router.get("/users/me/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(require_user)
):
    return current_user


@router.put("/users/me/profile", response_model=UserProfileResponse)
def update_user_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    normalized_email = payload.email.lower().strip()

    # Prevent another account from using the same email
    existing_user = (
        db.query(User)
        .filter(
            User.email == normalized_email,
            User.id != current_user.id
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Another account already uses this email."
        )

    current_user.name = payload.name.strip()
    current_user.email = normalized_email

    current_user.phone = (
        payload.phone.strip()
        if payload.phone
        else None
    )

    current_user.location = (
        payload.location.strip()
        if payload.location
        else None
    )

    current_user.education = (
        payload.education.strip()
        if payload.education
        else None
    )

    current_user.experience = (
        payload.experience.strip()
        if payload.experience
        else None
    )

    current_user.skills = (
        payload.skills.strip()
        if payload.skills
        else None
    )

    current_user.bio = (
        payload.bio.strip()
        if payload.bio
        else None
    )

    db.commit()
    db.refresh(current_user)

    return current_user

def validate_resume(filename: str):
    extension = Path(filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Resume must be a PDF, DOC, or DOCX file."
        )

    return extension


@router.post("/applications/upload")
async def upload_application(
    job_id: int = Form(...),
    resume: UploadFile = File(...),
    cover_letter: str | None = Form(default=None),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    if job.status != "Active":
        raise HTTPException(
            status_code=400,
            detail="This job is not active."
        )

    if job.approval_status != "Approved":
        raise HTTPException(
            status_code=400,
            detail="This job has not been approved."
        )

    existing_application = (
        db.query(Application)
        .filter(
            Application.user_id == current_user.id,
            Application.job_id == job_id
        )
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job."
        )

    validate_resume(
        resume.filename or ""
    )

    contents = await resume.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The selected resume is empty."
        )

    if len(contents) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Resume size must not exceed 10 MB."
        )

    safe_filename = Path(
        resume.filename
    ).name

    stored_filename = (
        f"{uuid4().hex}_{safe_filename}"
    )

    stored_path = (
        UPLOAD_DIR / stored_filename
    )

    stored_path.write_bytes(contents)

    application = Application(
        user_id=current_user.id,
        job_id=job_id,
        status="Applied",
        resume=str(
            stored_path
        ).replace("\\", "/")
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "id": application.id,
        "user_id": application.user_id,
        "job_id": application.job_id,
        "status": application.status,
        "resume": application.resume,
        "applied_at": application.applied_at,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "job_title": job.title,
        "company": job.company,
        "cover_letter_received": bool(
            cover_letter and cover_letter.strip()
        ),
    }


@router.get("/applications/job/{job_id}/details", response_model = list[JobApplicantDetailsResponse])
def get_job_applicant_details(
    job_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    print("NEW APPLICANT DETAILS ROUTE RUNNING")
    recruiter = (
        db.query(Recruiter)
        .filter(
            Recruiter.user_id == current_user.id
        )
        .first()
    )

    if not recruiter:
        raise HTTPException(
            status_code=404,
            detail="Recruiter profile not found."
        )

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    if job.recruiter_id != recruiter.id:
        raise HTTPException(
            status_code=403,
            detail="You can only view applicants for your own jobs."
        )

    rows = (
        db.query(Application, User)
        .join(
            User,
            User.id == Application.user_id
        )
        .filter(
            Application.job_id == job_id
        )
        .order_by(
            Application.applied_at.desc()
        )
        .all()
    )

    return [
        {
            "id": application.id,
            "user_id": application.user_id,
            "job_id": application.job_id,
            "status": application.status,
            "resume": application.resume,
            "applied_at": application.applied_at,

            #Applicant basic information
            "user_name": applicant.name,
            "user_email": applicant.email,

            #Applicant Profile Information
            "phone": applicant.phone,
            "location": applicant.location,
            "education": applicant.education,
            "experience": applicant.experience,
            "skills": applicant.skills,
            "bio": applicant.bio,

            #Job Information
            "job_title": job.title,
            "company": job.company,
        }
        for application, applicant in rows
    ]


@router.get(
    "/applications/resume/{application_id}"
)
def get_application_resume(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found."
        )

    job = (
        db.query(Job)
        .filter(
            Job.id == application.job_id
        )
        .first()
    )

    recruiter = None

    if current_user.role == "recruiter":
        recruiter = (
            db.query(Recruiter)
            .filter(
                Recruiter.user_id == current_user.id
            )
            .first()
        )

    is_applicant = (
        current_user.id ==
        application.user_id
    )

    is_job_recruiter = (
        recruiter is not None
        and job is not None
        and job.recruiter_id == recruiter.id
    )

    if not is_applicant and not is_job_recruiter:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to access this resume."
        )

    if not application.resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found."
        )

    path = Path(application.resume)

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Resume file is missing from the server."
        )

    extension = path.suffix.lower()

    media_types = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": (
            "application/vnd.openxmlformats-"
            "officedocument.wordprocessingml.document"
        ),
    }

    return FileResponse(
        path=str(path),
        filename=path.name,
        media_type=media_types.get(
            extension,
            "application/octet-stream"
        )
    )