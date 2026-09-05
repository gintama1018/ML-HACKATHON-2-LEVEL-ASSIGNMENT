from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

import logging

logger = logging.getLogger(__name__)

# Normalize database URL for PostgreSQL / Supabase
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Detect unpopulated placeholder strings (e.g. [ref], [password], <password>, etc.)
placeholder_markers = ["[ref]", "[password]", "<password>", "db.[ref]", "your-project", "example.com"]
if any(marker in db_url for marker in placeholder_markers):
    logger.warning(
        f"DATABASE_URL contains placeholder markers ({db_url}). Falling back to local SQLite database."
    )
    db_url = f"sqlite:///{settings.DATA_DIR / 'ai_teacher.db'}"

is_sqlite = "sqlite" in db_url
connect_args = {"check_same_thread": False} if is_sqlite else {}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    # Validate connection immediately
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.error(f"Failed to connect to configured DATABASE_URL ({db_url}): {e}. Falling back to SQLite.")
    db_url = f"sqlite:///{settings.DATA_DIR / 'ai_teacher.db'}"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_engine():
    return engine

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
