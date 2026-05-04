from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class BirthDetailsInput(BaseModel):
    bs_year: int
    bs_month: int
    bs_day: int
    birth_hour: int
    birth_minute: int
    place_of_birth: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    provided_rashi: Optional[str] = None
    ayanamsa: Optional[str] = "LAHIRI" # Default to Lahiri

class QuestionInput(BaseModel):
    question: str

class PaymentInput(BaseModel):
    amount: float
    gateway: str
