import asyncio
import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from dotenv import load_dotenv

# Use absolute path to backend .env
backend_env = "/Users/nirdosh/Desktop/nepali-jyotish-backend/.env"
load_dotenv(backend_env)

DATABASE_URL = os.getenv("DATABASE_URL")

# Import models
import sys
sys.path.append("/Users/nirdosh/Desktop/nepali-jyotish-backend")
from database.schemas import AstroProfile, User

async def check_db():
    if not DATABASE_URL:
        print("DATABASE_URL not found")
        return
    
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(AstroProfile).order_by(AstroProfile.id.desc()).limit(5))
        profiles = result.scalars().all()
        
        if not profiles:
            print("No profiles found in database.")
            return
            
        for p in profiles:
            print(f"--- Profile ID: {p.id}, User ID: {p.user_id} ---")
            print(f"Rashi: {p.rashi}, Lagna: {p.lagna}, Nakshatra: {p.nakshatra}")
            print(f"Full Profile: {p.full_profile}")
            print("-" * 40)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
