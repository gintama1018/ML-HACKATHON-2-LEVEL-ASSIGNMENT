import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AI Teacher — Bharat Academix"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # LLM Model Configuration (Claude & Gemini Dual Support)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")  # auto, claude, gemini
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_REASONING_MODEL: str = os.getenv("CLAUDE_REASONING_MODEL", "claude-sonnet-5")
    CLAUDE_FAST_MODEL: str = os.getenv("CLAUDE_FAST_MODEL", "claude-haiku-4-5-20251001")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_REASONING_MODEL: str = os.getenv("GEMINI_REASONING_MODEL", "gemini-2.5-pro")
    GEMINI_FAST_MODEL: str = os.getenv("GEMINI_FAST_MODEL", "gemini-2.5-flash")
    
    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'ai_teacher.db'}"
    CHROMA_PERSIST_DIRECTORY: str = str(DATA_DIR / "chroma_db")
    UPLOAD_DIRECTORY: str = str(DATA_DIR / "uploads")
    
    # Embedding Configuration
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Pydantic v2 config
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()

# Ensure directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
