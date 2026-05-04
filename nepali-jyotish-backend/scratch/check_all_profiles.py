
import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from database.connection import get_db, AsyncSessionLocal as async_session
from database.schemas import User, AstroProfile, BirthDetails
import json

async def check_all_profiles(email):
    async with async_session() as session:
        # Find user by email
        result = await session.execute(
            select(User)
            .where(User.email == email)
        )
        user = result.scalars().first()
        
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"User: {user.full_name} (ID: {user.id})")
        
        # Fetch ALL AstroProfiles for this user
        res_p = await session.execute(
            select(AstroProfile)
            .where(AstroProfile.user_id == user.id)
            .order_by(AstroProfile.id.desc())
        )
        profiles = res_p.scalars().all()
        
        print(f"\nFound {len(profiles)} astro profiles.")
        for i, p in enumerate(profiles):
            print(f"\n--- Profile {i+1} (ID: {p.id}, Generated: {p.generated_at}) ---")
            print(f"Rashi: {p.rashi}, Lagna: {p.lagna}, Nakshatra: {p.nakshatra}")
            if p.full_profile:
                try:
                    fp = json.loads(p.full_profile)
                    print(f"Full Profile Letter: {fp.get('नामको_अक्षर')}")
                except:
                    print("Full Profile is not valid JSON")
            if p.planetary_data:
                print(f"Planetary Letter: {p.planetary_data.get('First_Letter')}")
                print(f"Planetary Rashi: {p.planetary_data.get('Moon_Rashi')}")
                print(f"Planetary Nakshatra: {p.planetary_data.get('Moon_Nakshatra')}")

if __name__ == "__main__":
    email = "test12345@gmail.com"
    asyncio.run(check_all_profiles(email))
