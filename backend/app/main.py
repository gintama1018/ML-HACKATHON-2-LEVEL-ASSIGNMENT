import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.routers import (
    profile, materials, content, lessons, sessions, assessment, report, video
)

# Ensure static directories exist
os.makedirs("./static/videos", exist_ok=True)
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous, Adaptive AI Teacher Backend for Bharat Academix Challenge",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static & Uploads directory
app.mount("/static", StaticFiles(directory="./static"), name="static")
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="uploads")

# Mount Routers
app.include_router(profile.router)
app.include_router(materials.router)
app.include_router(content.router)
app.include_router(lessons.router)
app.include_router(sessions.router)
app.include_router(assessment.router)
app.include_router(report.router)
app.include_router(video.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "claude_reasoning_model": settings.CLAUDE_REASONING_MODEL,
        "claude_fast_model": settings.CLAUDE_FAST_MODEL,
        "database": "connected",
        "video_engine": "ready"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )
