import os
from pathlib import Path
from dotenv import load_dotenv

# Local development may use backend/.env. Hosting providers supply environment
# variables directly; they take precedence over this file.
ENV_FILE = Path(__file__).resolve().with_name(".env")
load_dotenv(dotenv_path=ENV_FILE)


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(
            f"Missing environment variable {name}. Set it in the hosting provider."
        )
    return value


GOOGLE_CLIENT_ID = require_env("GOOGLE_CLIENT_ID")
JWT_SECRET = require_env("JWT_SECRET")

ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "https://mainrep.github.io,http://127.0.0.1:5501,http://localhost:5501",
    ).split(",")
    if origin.strip()
]

ALLOW_LOCAL_PREVIEW = os.environ.get("ALLOW_LOCAL_PREVIEW", "false").lower() == "true"
NOMINATIM_CONTACT = os.environ.get("NOMINATIM_CONTACT", "your-email@example.com")
