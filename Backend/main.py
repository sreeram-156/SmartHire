from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models

from routers.auth import router as auth_router
from routers.jobs import router as jobs_router
from routers.admin import router as admin_router
from routers.applications import router as applications_router

from routers.enhancements import router as enhancements_router


app = FastAPI(
    title="SmartHire API",
    description="Backend API for SmartHire",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(admin_router)
app.include_router(enhancements_router)
app.include_router(applications_router)

@app.get("/")
def root():
    return {
        "message": "SmartHire API is running"
    }

