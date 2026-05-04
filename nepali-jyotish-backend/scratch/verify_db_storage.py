
import asyncio
import json
from sqlalchemy.future import select
from database.connection import AsyncSessionLocal
from database.schemas import User, BirthDetails, AstroProfile
from core.chart_calculator import get_full_chart
import datetime

async def test_kundali_storage():
    async with AsyncSessionLocal() as db:
        # 1. Find a test user
        result = await db.execute(select(User).limit(1))
        user = result.scalars().first()
        
        if not user:
            print("No user found to test with.")
            return

        print(f"Testing for user: {user.email} (ID: {user.id})")

        # 2. Simulate inserting birth details (like in api/profile.py)
        # Using Kathmandu coordinates
        test_details = {
            "bs_year": 2047,
            "bs_month": 3,
            "bs_day": 1,
            "birth_hour": 10,
            "birth_minute": 30,
            "latitude": 27.7172,
            "longitude": 85.3240,
            "ayanamsa": "LAHIRI"
        }

        # Calculate chart
        from datetime import datetime
        # 2047-03-01 BS is approx 1990-06-15 AD
        dt_ad = datetime(1990, 6, 15, 10, 30)
        chart_data = get_full_chart(dt_ad, test_details['latitude'], test_details['longitude'], test_details['ayanamsa'])
        
        # Check if record exists
        bd_result = await db.execute(select(BirthDetails).where(BirthDetails.user_id == user.id))
        bd = bd_result.scalars().first()
        
        if bd:
            print("Updating existing BirthDetails...")
            bd.bs_year = test_details['bs_year']
            bd.bs_month = test_details['bs_month']
            bd.bs_day = test_details['bs_day']
            bd.ad_date = dt_ad
        else:
            print("Creating new BirthDetails...")
            bd = BirthDetails(user_id=user.id, **test_details, ad_date=dt_ad)
            db.add(bd)

        # Check AstroProfile
        ap_result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == user.id))
        ap = ap_result.scalars().first()
        
        profile_json = {"राशी": chart_data["Moon_Rashi"], "लग्न": chart_data["Lagna"]}
        
        if ap:
            print("Updating existing AstroProfile...")
            ap.planetary_data = chart_data
            ap.full_profile = json.dumps(profile_json)
        else:
            print("Creating new AstroProfile...")
            ap = AstroProfile(
                user_id=user.id,
                rashi=chart_data["Moon_Rashi"],
                lagna=chart_data["Lagna"],
                planetary_data=chart_data,
                full_profile=json.dumps(profile_json)
            )
            db.add(ap)
        
        await db.commit()
        print("Data committed to database.")
        
        # Refresh to avoid MissingGreenlet when accessing attributes after commit
        await db.refresh(user)

        # 3. Verify retrieval (like in dashboard endpoint)
        result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == user.id).order_by(AstroProfile.id.desc()))
        stored_ap = result.scalars().first()
        
        if stored_ap:
            print("\nVerification successful!")
            print(f"Stored Rashi: {stored_ap.rashi}")
            print(f"Planetary Data Present: {'Yes' if stored_ap.planetary_data else 'No'}")
            if stored_ap.planetary_data:
                print(f"Number of planets stored: {len(stored_ap.planetary_data.get('Planets', {}))}")
        else:
            print("\nVerification FAILED: No AstroProfile found after commit.")

if __name__ == "__main__":
    asyncio.run(test_kundali_storage())
