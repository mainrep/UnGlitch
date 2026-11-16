import os
from pathlib import Path
from dotenv import load_dotenv

# Locate the .env file in the same folder as config.py
ENV_FILE = Path(__file__).resolve().with_name(".env")
load_dotenv(dotenv_path=ENV_FILE)


def require_env(name: str) -> str:
    """Read a required environment variable, or stop with a clear message."""
    value = os.environ.get(name)

    if not value:
        raise RuntimeError(
            f"Missing environment variable {name}. "
            f"Set it before starting the server."
        )

    return value


GOOGLE_CLIENT_ID = require_env("GOOGLE_CLIENT_ID")
JWT_SECRET = require_env("JWT_SECRET")


# Comma-separated list of frontend addresses allowed to call this API.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5500,http://127.0.0.1:5500"
    ).split(",")
    if origin.strip()
]


# Local simulated accounts are only for development and testing.
ALLOW_LOCAL_PREVIEW = (
    os.environ.get("ALLOW_LOCAL_PREVIEW", "false").lower() == "true"
)


# Nominatim's usage policy requires a contact identifier.
NOMINATIM_CONTACT = os.environ.get(
    "NOMINATIM_CONTACT",
    "your-email@example.com"
)