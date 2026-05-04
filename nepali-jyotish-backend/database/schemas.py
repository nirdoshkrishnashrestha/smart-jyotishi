from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_verified = Column(Boolean, default=False)
    question_credits = Column(Integer, default=0)

    birth_details = relationship("BirthDetails", back_populates="user", uselist=False)
    astro_profile = relationship("AstroProfile", back_populates="user", uselist=False)
    chat_history = relationship("ChatHistory", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    rashifal_cache = relationship("RashifalCache", back_populates="user", uselist=False)



class BirthDetails(Base):
    __tablename__ = "birth_details"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bs_year = Column(Integer)
    bs_month = Column(Integer)
    bs_day = Column(Integer)
    birth_hour = Column(Integer)
    birth_minute = Column(Integer)
    place_of_birth = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    provided_rashi = Column(String, nullable=True)
    ayanamsa = Column(String, default="LAHIRI")
    ad_date = Column(DateTime)
    
    user = relationship("User", back_populates="birth_details")


class AstroProfile(Base):
    __tablename__ = "astro_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    rashi = Column(String)
    lagna = Column(String)
    nakshatra = Column(String)
    planetary_data = Column(JSON)
    dasha_data = Column(JSON)
    full_profile = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="astro_profile")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question = Column(Text)
    answer = Column(Text)
    tokens_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    gateway = Column(String)
    status = Column(String)
    credits_added = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")


class RashifalCache(Base):
    __tablename__ = "rashifal_cache"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    today_data = Column(JSON, nullable=True)
    today_generated_at = Column(DateTime, nullable=True)
    
    week_data = Column(JSON, nullable=True)
    week_generated_at = Column(DateTime, nullable=True)
    
    month_data = Column(JSON, nullable=True)
    month_generated_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="rashifal_cache")

