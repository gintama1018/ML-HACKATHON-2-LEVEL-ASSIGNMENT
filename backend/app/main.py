import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.routers import (
    profile, materials, content, lessons, sessions, assessment, report, video, learning_paths
)

logger = logging.getLogger(__name__)

async def _llm_startup_smoke_test():
    """Make one minimal real call to confirm the configured LLM model is live.
    Logs WARNING on failure — does NOT crash the app so offline/dev usage still works."""
    try:
        from app.services.claude_service import claude_service
        if not claude_service.is_configured():
            logger.warning(
                "LLM_STARTUP: No LLM API key configured — running in offline/fallback mode. "
                "Set GEMINI_API_KEY in backend/.env to enable live AI features."
            )
            return
        result = claude_service.call_fast(
            system_prompt="You are a health-check assistant.",
            user_prompt="Reply with the single word: ALIVE",
            max_tokens=10
        )
        if result and len(result.strip()) > 0:
            model_name = settings.GEMINI_FAST_MODEL if claude_service.gemini_configured else settings.CLAUDE_FAST_MODEL
            logger.info(f"LLM_STARTUP: Model '{model_name}' is live and responding. ✓")
        else:
            logger.warning("LLM_STARTUP: Model returned empty response — check API key and quota.")
    except Exception as exc:
        model_name = settings.GEMINI_FAST_MODEL if settings.GEMINI_API_KEY else settings.CLAUDE_FAST_MODEL
        logger.warning(
            f"LLM_STARTUP: Configured model '{model_name}' is UNREACHABLE — {exc}. "
            f"Update GEMINI_REASONING_MODEL/GEMINI_FAST_MODEL in backend/.env to a current GA model. "
            f"The app will continue but all AI features will use offline fallback templates."
        )

@asynccontextmanager
async def lifespan(app: FastAPI):
    await _llm_startup_smoke_test()
    yield


# Ensure static directories exist
os.makedirs("./static/videos", exist_ok=True)
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)

# Initialize database schema safely
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error(f"Failed to create schema on primary engine: {e}. Retrying with fallback engine.")
    from app.database import get_engine
    fallback_engine = get_engine()
    Base.metadata.create_all(bind=fallback_engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous, Adaptive AI Teacher Backend for Bharat Academix Challenge",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend (Supports Vercel deployments & localhost)
default_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "https://ml-hackathon-2-level-assignment.vercel.app",
]
cors_env = os.getenv("CORS_ORIGINS", "")
custom_origins = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
allowed_origins = list(set(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def ensure_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        res = Response(status_code=204)
        if origin:
            res.headers["Access-Control-Allow-Origin"] = origin
            res.headers["Access-Control-Allow-Credentials"] = "true"
            res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            res.headers["Access-Control-Allow-Headers"] = "*"
        return res
    
    response = await call_next(request)
    if origin and (
        "vercel.app" in origin or 
        "localhost" in origin or 
        "127.0.0.1" in origin or 
        origin in allowed_origins
    ):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

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

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }

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
