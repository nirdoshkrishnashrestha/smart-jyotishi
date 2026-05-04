
import json
import sys

file_path = '/Users/nirdosh/Desktop/claude/nepali-jyotish-backend/api/profile.py'
with open(file_path, 'r') as f:
    content = f.read()

# Update get_birth_details
# Find the end of the details dict
old_birth_details = '"provided_rashi": details.provided_rashi'
new_birth_details = '"provided_rashi": details.provided_rashi,\n            "ad_date": details.ad_date.isoformat() if details.ad_date else None'
if old_birth_details in content:
    content = content.replace(old_birth_details, new_birth_details)

# Update get_dashboard_profile
old_func = '''@router.get("/dashboard")
async def get_dashboard_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == current_user.id).order_by(AstroProfile.id.desc()))
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="No astrological profile found for this user.")

    prof_dict = json.loads(profile.full_profile) if profile.full_profile else {}
    ai_warning = None
    meta = prof_dict.get("_meta") if isinstance(prof_dict, dict) else None
    if isinstance(meta, dict) and meta.get("ai_fallback"):
        ai_warning = meta.get("message_np")

    out: dict = {
        "status": "success",
        "profile": prof_dict,
        "planetary_data": profile.planetary_data,
        "source": "database",
    }
    if ai_warning:
        out["ai_warning"] = ai_warning
    return out'''

new_func = '''@router.get("/dashboard")
async def get_dashboard_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Fetch AstroProfile
    ap_result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == current_user.id).order_by(AstroProfile.id.desc()))
    profile = ap_result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="No astrological profile found for this user.")

    # Fetch BirthDetails to get ad_date
    bd_result = await db.execute(select(BirthDetails).where(BirthDetails.user_id == current_user.id))
    birth_details = bd_result.scalars().first()

    prof_dict = json.loads(profile.full_profile) if profile.full_profile else {}
    ai_warning = None
    meta = prof_dict.get("_meta") if isinstance(prof_dict, dict) else None
    if isinstance(meta, dict) and meta.get("ai_fallback"):
        ai_warning = meta.get("message_np")

    out: dict = {
        "status": "success",
        "profile": prof_dict,
        "planetary_data": profile.planetary_data,
        "source": "database",
        "ad_date": birth_details.ad_date.isoformat() if birth_details and birth_details.ad_date else None,
        "user_name": current_user.full_name
    }
    if ai_warning:
        out["ai_warning"] = ai_warning
    return out'''

if old_func in content:
    content = content.replace(old_func, new_func)

with open(file_path, 'w') as f:
    f.write(content)
print("Update successful")
