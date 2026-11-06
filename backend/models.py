from datetime import datetime, timezone

from sqlalchemy import (Column, Integer, String, Float, DateTime,
                        ForeignKey, UniqueConstraint, CheckConstraint)

from backend.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    google_sub = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "consumer" or "shop"
    created_at = Column(DateTime, default=utcnow)


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    devices = Column(String, nullable=False)  # stored as "Phones,Tablets"
    warranty_days = Column(Integer, default=0)


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint("shop_id", "user_id"),
        CheckConstraint("stars BETWEEN 1 AND 5"),
    )

    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stars = Column(Integer, nullable=False)
    comment = Column(String)
    created_at = Column(DateTime, default=utcnow)