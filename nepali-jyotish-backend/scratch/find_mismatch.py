
import asyncio
from sqlalchemy.future import select
from database.connection import AsyncSessionLocal as async_session
from database.schemas import User, AstroProfile
import json

async def find_mismatch_profile():
    async with async_session() as session:
        # Search for profiles containing "लो" or "भरणी" or "वृश्चिक" in full_profile or columns
        result = await session.execute(
            select(AstroProfile, User)
            .join(User)
            .where(
                (AstroProfile.nakshatra.ilike("%भरणी%")) |
                (AstroProfile.lagna.ilike("%वृश्चिक%")) |
                (AstroProfile.full_profile.ilike("%लो%"))
            )
        )
        matches = result.all()
        
        print(f"Found {len(matches)} matching profiles.")
        for p, u in matches:
            print(f"\n--- User: {u.full_name} ({u.email}) ---")
            print(f"Profile ID: {p.id}")
            print(f"Rashi: {p.rashi}, Lagna: {p.lagna}, Nakshatra: {p.nakshatra}")
            if p.full_profile:
                try:
                    fp = json.loads(p.full_profile)
                    print(f"Letter in JSON: {fp.get('नामको_अक्षर')}")
                except:
                    pass

if __name__ == "__main__":
    asyncio.run(find_mismatch_profile())
