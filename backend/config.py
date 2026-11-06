from dotenv import load_dotenv
load_dotenv()

import os


def require_env(name: str) -> str:
    """Read a required environment variable, or stop with a clear message."""
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing environment variable {name}. "
            f"Set it before starting the server (see the setup notes)."
        )
    return value


GOOGLE_CLIENT_ID = require_env("GOOGLE_CLIENT_ID")
JWT_SECRET = require_env("JWT_SECRET")

# Comma-separated list of frontend addresses allowed to call this API.
# In Codespaces, add your forwarded frontend URL here.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500"
    ).split(",")
    if origin.strip()
]

# Nominatim's usage policy requires a way to contact you.
NOMINATIM_CONTACT = os.environ.get("NOMINATIM_CONTACT", "your-email@example.com")