import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.routers import (
    profile, materials, content, lessons, sessions, assessment, report, video, learning_paths
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
app.include_router(learning_paths.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "llm_provider": settings.LLM_PROVIDER,
        "database": "connected",
        "video_engine": "ready"
    }

@app.get("/system/status")
def system_status():
    has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    has_claude = bool(settings.ANTHROPIC_API_KEY)
    is_live = has_gemini or has_claude
    active_provider = "Google Gemini 1.5 Pro" if has_gemini else ("Anthropic Claude 3.7" if has_claude else "Resilient Air-Gap Mode")
    return {
        "is_live_ai": is_live,
        "active_provider": active_provider,
        "has_gemini": has_gemini,
        "has_claude": has_claude,
        "gemini_model": settings.GEMINI_REASONING_MODEL,
        "claude_model": settings.CLAUDE_REASONING_MODEL,
        "rag_embeddings": "SentenceTransformers MiniLM-L6-v2 (with offline fallback)",
        "video_engine": "FFmpeg 720p H.264 / Viseme Muxer"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )
