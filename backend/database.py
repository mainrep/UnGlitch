import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


def _get_database_url() -> str:
    """Use Neon/PostgreSQL in hosting; retain SQLite for local development."""
    url = (os.environ.get("DATABASE_URL") or "").strip()

    if not url:
        # Render must never silently fall back to its temporary local filesystem.
        if os.environ.get("RENDER", "").lower() == "true" or os.environ.get("RENDER_SERVICE_ID"):
            raise RuntimeError(
                "DATABASE_URL is missing. Set it in Render to the Neon pooled connection string."
            )
        return "sqlite:///./unglitch.db"

    # SQLAlchemy's default postgresql:// driver is psycopg2. This project installs
    # psycopg v3, so select that driver explicitly for Neon connection strings.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    elif url.startswith("postgresql+psycopg2://"):
        url = "postgresql+psycopg://" + url[len("postgresql+psycopg2://"):]

    return url


DATABASE_URL = _get_database_url()
_is_sqlite = DATABASE_URL.startswith("sqlite:")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=not _is_sqlite,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)

Base = declarative_base()


def get_db():
    """Open a database session for one request and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
