import json
import jwt
import httpx

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
    Header
)

from fastapi.middleware.cors import CORSMiddleware

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from backend.auth import (
    create_token,
    get_current_user,
    require_role
)

from backend.config import (
    ALLOWED_ORIGINS,
    GOOGLE_CLIENT_ID,
    NOMINATIM_CONTACT,
    ALLOW_LOCAL_PREVIEW,
    JWT_SECRET
)

from backend.database import engine, Base, SessionLocal, get_db

from backend.models import (
    Shop,
    User,
    Rating,
    DiagnosticAssessment
)

from backend.schemas import (
    ShopCreate,
    ShopOut,
    GoogleLogin,
    TokenOut,
    UserOut,
    RatingCreate,
    DiagnosticRequest,
    DiagnosticResponse
)

from backend.diagnostics import build_diagnostic

# =========================================
# DATABASE INITIALISATION AND DEMO LISTING
# =========================================

DEMO_SHOP_NAME = "UnGlitch Demo Repair Shop - TEST LISTING"


def initialise_database() -> None:
    """Create tables, apply the one required nullable-owner migration, and seed once."""
    Base.metadata.create_all(bind=engine)

    # Older deployments may have created shops.owner_id as NOT NULL.
    # The clearly labelled demo listing has no real owner, so allow NULL.
    if engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE shops ALTER COLUMN owner_id DROP NOT NULL")
            )

    db = SessionLocal()
    try:
        existing = db.query(Shop).filter(Shop.name == DEMO_SHOP_NAME).first()
        if existing is None:
            db.add(Shop(
                owner_id=None,
                name=DEMO_SHOP_NAME,
                address="Fort, Mumbai, Maharashtra, India (fictional test location)",
                lat=18.9322,
                lng=72.8336,
                devices="Phones,Tablets,Laptops",
                warranty_days=30,
            ))
            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


initialise_database()

app = FastAPI(title="UnGlitch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-UnGlitch-Preview-Role"
    ],
)


# ---------- helpers ----------

def geocode(address: str):
    """Turn a typed address into (lat, lng) using OpenStreetMap's Nominatim."""
    try:
        response = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": f"UnGlitch/0.1 ({NOMINATIM_CONTACT})"},
            timeout=10,
        )
        response.raise_for_status()
        results = response.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(
            status_code=503,
            detail="Address lookup is unavailable right now. Try again shortly.",
        )
    if not results:
        return None
    return float(results[0]["lat"]), float(results[0]["lon"])


def rating_stats(db: Session, shop_id: int | None = None) -> dict:
    """Return {shop_id: (average, count)} calculated in one grouped query."""
    query = (db.query(Rating.shop_id, func.avg(Rating.stars), func.count(Rating.id))
               .group_by(Rating.shop_id))
    if shop_id is not None:
        query = query.filter(Rating.shop_id == shop_id)
    return {sid: (round(float(avg), 1), count) for sid, avg, count in query.all()}


def to_out(shop: Shop, avg=None, count=0) -> ShopOut:
    """Convert a database row into the shape the API returns."""
    return ShopOut(
        id=shop.id,
        name=shop.name,
        address=shop.address,
        lat=shop.lat,
        lng=shop.lng,
        devices=shop.devices.split(","),
        warranty_days=shop.warranty_days,
        average_rating=avg,
        rating_count=count,
    )


# ---------- general ----------

@app.get("/health")
def health():
    # Make the deployment health check verify the database too, not just FastAPI.
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database connection is unavailable")
    return {"status": "ok", "database": "connected"}

# =========================================
# ACCESS CONTROL FOR DIAGNOSTIC FEATURES
# =========================================

def require_consumer_access(
    request: Request,
    authorization: str | None = Header(default=None),
    preview_role: str | None = Header(
        default=None,
        alias="X-UnGlitch-Preview-Role"
    ),
    db: Session = Depends(get_db)
):

    origin = request.headers.get("origin")

    # Permit simulated consumer accounts only during
    # explicitly enabled local development.

    if (
        ALLOW_LOCAL_PREVIEW
        and preview_role == "consumer"
        and origin in ALLOWED_ORIGINS
    ):

        return None

    # All other requests require a real JWT.

    if not authorization or not authorization.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail="Consumer authentication required."
        )

    token = authorization.split(" ", 1)[1]

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        user_id = int(payload["sub"])

    except (jwt.PyJWTError, KeyError, ValueError, TypeError):

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )

    user = db.get(User, user_id)

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="User account not found."
        )

    if user.role != "consumer":

        raise HTTPException(
            status_code=403,
            detail="This feature is only available to consumer accounts."
        )

    return user

# ---------- authentication ----------

@app.post("/auth/google", response_model=TokenOut)
def google_login(data: GoogleLogin, db: Session = Depends(get_db)):
    try:
        info = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Google sign-in could not be verified")

    if not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Your Google email is not verified")

    user = db.query(User).filter(User.google_sub == info["sub"]).first()

    if user is None:
        if data.role is None:
            raise HTTPException(status_code=400, detail="Choose an account type first")
        user = User(
            google_sub=info["sub"],
            email=info["email"],
            name=info.get("name", info["email"]),
            role=data.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif data.role is not None and data.role != user.role:
        raise HTTPException(
            status_code=409,
            detail=f"This Google account is already a {user.role} account",
        )

    return TokenOut(access_token=create_token(user), user=UserOut.model_validate(user))


@app.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# ---------- shops ----------

@app.post("/shops", response_model=ShopOut, status_code=201)
def create_shop(data: ShopCreate,
                user: User = Depends(require_role("shop")),
                db: Session = Depends(get_db)):
    if db.query(Shop).filter(Shop.owner_id == user.id).first():
        raise HTTPException(status_code=409, detail="You already have a shop listing")

    coords = geocode(data.address)
    if coords is None:
        raise HTTPException(
            status_code=422,
            detail="We couldn't find that address. Check it and try again.",
        )

    shop = Shop(
        owner_id=user.id,
        name=data.name,
        address=data.address,
        lat=coords[0],
        lng=coords[1],
        devices=",".join(sorted(set(data.devices))),
        warranty_days=data.warranty_days,
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return to_out(shop)


@app.get("/shops", response_model=list[ShopOut])
def list_shops(db: Session = Depends(get_db)):
    stats = rating_stats(db)
    return [to_out(s, *stats.get(s.id, (None, 0))) for s in db.query(Shop).all()]


@app.get("/shops/me", response_model=ShopOut)
def my_shop(user: User = Depends(require_role("shop")), db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.owner_id == user.id).first()
    if shop is None:
        raise HTTPException(status_code=404, detail="No shop listing yet")
    return to_out(shop, *rating_stats(db, shop.id).get(shop.id, (None, 0)))


# ---------- ratings ----------

@app.put("/shops/{shop_id}/rating")
def rate_shop(shop_id: int, data: RatingCreate,
              user: User = Depends(require_role("consumer")),
              db: Session = Depends(get_db)):
    if db.get(Shop, shop_id) is None:
        raise HTTPException(status_code=404, detail="Shop not found")

    rating = db.query(Rating).filter(Rating.shop_id == shop_id,
                                     Rating.user_id == user.id).first()
    if rating:
        rating.stars, rating.comment = data.stars, data.comment
    else:
        db.add(Rating(shop_id=shop_id, user_id=user.id,
                      stars=data.stars, comment=data.comment))
    db.commit()

    avg, count = rating_stats(db, shop_id)[shop_id]
    return {"average_rating": avg, "rating_count": count}

# =========================================
# DEVICE DIAGNOSTICS
# =========================================

@app.post(
    "/diagnostics/assess",
    response_model=DiagnosticResponse
)
def assess_device(
    data: DiagnosticRequest,
    user: User | None = Depends(require_consumer_access),
    db: Session = Depends(get_db)
):

    result = build_diagnostic(data)

    # Save assessments for authenticated users.
    # Simulated preview assessments are not stored.

    if user is not None:

        record = DiagnosticAssessment(

            user_id=user.id,

            device_type=data.device_type,

            model=data.model,

            device_age=data.device_age,

            issue_type=data.issue_type,

            symptoms=data.symptoms,

            result_json=json.dumps(result)

        )

        db.add(record)
        db.commit()

    return result