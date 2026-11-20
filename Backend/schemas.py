from datetime import datetime

from pydantic import BaseModel, Field, EmailStr

class UserSignup(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    password: str = Field(min_length=6, max_length=100)


class RecruiterSignup(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    company: str = Field(min_length=2, max_length=150)
    password: str = Field(min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    location: str = Field(min_length=2, max_length=150)
    job_type: str = Field(min_length=2, max_length=50)
    salary: str | None = None
    description: str = Field(min_length=10)
    skills: str | None = None


class JobResponse(BaseModel):
    id: int
    recruiter_id: int | None
    title: str
    company: str
    location: str
    job_type: str
    salary: str | None
    description: str
    skills: str | None
    source: str
    status: str
    approval_status: str

    class Config:
        from_attributes = True

class AdminActionResponse(BaseModel):
    message: str

class AdminStatsResponse(BaseModel):
    total_users: int 
    total_recruiters: int 
    total_jobs: int 
    pending_approvals: int

class ApplicationCreate(BaseModel):
    job_id: int 
    resume: str | None = None 

class ApplicationResponse(BaseModel):
    id: int 
    user_id: int 
    job_id: int 
    status: str 
    resume: str | None 
    applied_at: datetime 

    class Config:
        from_attributes = True 

class ApplicationStatusUpdate(BaseModel):
    status: str

class ApplicantProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    location: str | None = None
    education: str | None = None
    experience: str | None = None
    skills: str | None = None
    bio: str | None = None

class UserProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr

    phone: str | None = Field(
        default=None,
        max_length=30
    )

    location: str | None = Field(
        default=None,
        max_length=150
    )

    education: str | None = Field(
        default=None,
        max_length=150
    )

    experience: str | None = Field(
        default=None,
        max_length=100
    )

    skills: str | None = Field(
        default=None
    )

    bio: str | None = Field(
        default=None
    )


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    status: str

    phone: str | None = None
    location: str | None = None
    education: str | None = None
    experience: str | None = None
    skills: str | None = None
    bio: str | None = None

    model_config = {
        "from_attributes": True
    }

class JobApplicantDetailsResponse(BaseModel):
    id: int
    user_id: int
    job_id: int 
    status: str 
    resume: str | None = None 
    applied_at: datetime | None = None 

    user_name: str 
    user_email: EmailStr 

    phone: str | None = None 
    location: str | None = None 
    education: str | None = None 
    experience: str | None = None 
    skills: str | None = None 
    bio: str | None = None 

    job_title: str 
    company: str