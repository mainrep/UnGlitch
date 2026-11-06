from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Only these device types are accepted. This also guarantees no device name
# contains a comma, which would break how we store the list in one column.
DeviceType = Literal["Phones", "Tablets", "Laptops"]


class ShopCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=200)
    devices: list[DeviceType] = Field(min_length=1)
    warranty_days: int = Field(ge=0, le=730)


class ShopOut(BaseModel):
    id: int
    name: str
    address: str
    lat: float
    lng: float
    devices: list[str]
    warranty_days: int
    average_rating: float | None = None
    rating_count: int = 0


class GoogleLogin(BaseModel):
    credential: str
    role: Literal["consumer", "shop"] | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    user: UserOut


class RatingCreate(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)