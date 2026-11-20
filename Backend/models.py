from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    role = Column(String(20), nullable=False, default="user")
    status = Column(String(20), nullable=False, default="Active")

    phone = Column(String(30), nullable=True)
    location = Column(String(150), nullable=True)
    education = Column(String(150), nullable=True)
    experience = Column(String(100), nullable=True)
    skills = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())

    recruiter_profile = relationship(
        "Recruiter",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company = Column(String(150), nullable=False)
    approval_status = Column(String(20), nullable=False, default="Pending")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship(
        "User",
        back_populates="recruiter_profile"
    )

    jobs = relationship(
        "Job",
        back_populates="recruiter",
        cascade="all, delete-orphan"
    )


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    location = Column(String(150), nullable=False)
    job_type = Column(String(50), nullable=False)
    salary = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    skills = Column(Text, nullable=True)

    source = Column(String(20), nullable=False, default="system")
    status = Column(String(20), nullable=False, default="Active")
    approval_status = Column(String(20), nullable=False, default="Approved")

    created_at = Column(DateTime, server_default=func.now())

    recruiter = relationship(
        "Recruiter",
        back_populates="jobs"
    )

    applications = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False
    )

    status = Column(String(30), nullable=False, default="Applied")
    resume = Column(String(500), nullable=True)
    applied_at = Column(DateTime, server_default=func.now())

    user = relationship(
        "User",
        back_populates="applications"
    )

    job = relationship(
        "Job",
        back_populates="applications"
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "job_id",
            name="uq_user_job_application"
        ),
    )