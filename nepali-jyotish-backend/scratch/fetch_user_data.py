
import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from database.connection import get_db, AsyncSessionLocal as async_session
from database.schemas import User, AstroProfile, BirthDetails
import json

async def get_user_data(email):
    async with async_session() as session:
        # Find user by email
        result = await session.execute(
            select(User)
            .where(User.email == email)
            .options(
                selectinload(User.astro_profile),
                selectinload(User.birth_details)
            )
        )
        user = result.scalars().first()
        
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"User Found: {user.full_name} ({user.email})")
        
        if user.birth_details:
            print("\n--- Birth Details ---")
            bd = user.birth_details
            print(f"BS Date: {bd.bs_year}-{bd.bs_month}-{bd.bs_day}")
            print(f"Birth Time: {bd.birth_hour}:{bd.birth_minute}")
            print(f"Place: {bd.place_of_birth} ({bd.latitude}, {bd.longitude})")
            print(f"Ayanamsa: {bd.ayanamsa}")
            print(f"AD Date: {bd.ad_date}")
        else:
            print("\nNo Birth Details found.")

        if user.astro_profile:
            print("\n--- Astro Profile Summary ---")
            p = user.astro_profile
            print(f"Rashi: {p.rashi}")
            print(f"Lagna: {p.lagna}")
            print(f"Nakshatra: {p.nakshatra}")
            
            print("\n--- Full Profile (AI Generated) ---")
            print(p.full_profile)
            
            print("\n--- Planetary Data (Kundali Details) ---")
            if p.planetary_data:
                print(json.dumps(p.planetary_data, indent=2, ensure_ascii=False))
            else:
                print("No planetary data found.")
        else:
            print("\nNo Astro Profile found.")

if __name__ == "__main__":
    email = "test12345@gmail.com"
    asyncio.run(get_user_data(email))
