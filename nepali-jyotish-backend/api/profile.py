import json
import asyncio
import datetime as dt_module
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import nepali_datetime

from database.connection import get_db
from database.schemas import User, BirthDetails, AstroProfile, RashifalCache
from core.models import BirthDetailsInput
from api.auth import get_current_user
from core.chart_calculator import get_full_chart, AYANAMSA_MAP
from core.claude_service import generate_dashboard_profile, generate_rashifal
from core.astro_profile_fallback import (
    build_fallback_profile,
    is_valid_ai_profile,
    parse_stored_profile,
)

router = APIRouter(prefix="/api/profile", tags=["profile"])

DEFAULT_LAT = 27.7172
DEFAULT_LNG = 85.3240


def _effective_coords(lat: float | None, lng: float | None) -> tuple[float, float]:
    return (
        lat if lat is not None else DEFAULT_LAT,
        lng if lng is not None else DEFAULT_LNG,
    )


def _same_effective_birth(details: BirthDetailsInput, row: BirthDetails | None) -> bool:
    if row is None:
        return False
    clat, clng = _effective_coords(details.latitude, details.longitude)
    rlat, rlng = _effective_coords(row.latitude, row.longitude)
    return (
        details.bs_year == row.bs_year
        and details.bs_month == row.bs_month
        and details.bs_day == row.bs_day
        and details.birth_hour == row.birth_hour
        and details.birth_minute == row.birth_minute
        and abs(clat - rlat) < 1e-4
        and abs(clng - rlng) < 1e-4
        and (details.provided_rashi or "") == (row.provided_rashi or "")
        and (details.ayanamsa or "LAHIRI") == (row.ayanamsa or "LAHIRI")
    )


@router.get("/birth-details")
async def get_birth_details(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BirthDetails).where(BirthDetails.user_id == current_user.id))
    details = result.scalars().first()
    if not details:
        return {"status": "not_found"}
    return {
        "status": "success",
        "details": {
            "bs_year": details.bs_year,
            "bs_month": details.bs_month,
            "bs_day": details.bs_day,
            "birth_hour": details.birth_hour,
            "birth_minute": details.birth_minute,
            "place_of_birth": details.place_of_birth,
            "latitude": details.latitude,
            "longitude": details.longitude,
            "provided_rashi": details.provided_rashi,
            "ayanamsa": details.ayanamsa or "LAHIRI"
        }
    }

@router.get("/ayanamsas")
async def get_ayanamsas():
    """Returns available Ayanamsa options for the frontend dropdown."""
    return {
        "status": "success",
        "options": [
            {"value": "LAHIRI", "label": "Lahiri (Traditional)"},
            {"value": "RAMAN", "label": "Raman (Popular)"},
            {"value": "SS_REVATI", "label": "Surya Siddhanta (Revati)"},
            {"value": "SS_CITRA", "label": "Surya Siddhanta (Citra)"}
        ]
    }

@router.post("/birth-details", status_code=status.HTTP_201_CREATED)
async def submit_birth_details(details: BirthDetailsInput, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        nd = nepali_datetime.date(details.bs_year, details.bs_month, details.bs_day)
        ad_date = nd.to_datetime_date()
        dt_ad = dt_module.datetime(ad_date.year, ad_date.month, ad_date.day, details.birth_hour, details.birth_minute)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Nepali Date provided: {str(e)}")

    calc_lat, calc_lng = _effective_coords(details.latitude, details.longitude)

    print(f"DEBUG: Calculating for {current_user.email} using {details.ayanamsa or 'LAHIRI'}")
    try:
        chart_data = get_full_chart(
            ad_date=dt_ad,
            lat=calc_lat,
            lon=calc_lng,
            ayanamsa=details.ayanamsa or "LAHIRI"
        )
        print(f"DEBUG: Moon Longitude: {chart_data['Planets']['Moon']['longitude']}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Astronomical calculation failed: {str(e)}")

    moon_rashi = chart_data["Planets"]["Moon"]["rashi"]

    bd_result = await db.execute(select(BirthDetails).where(BirthDetails.user_id == current_user.id))
    db_birth_details = bd_result.scalars().first()
    ap_result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == current_user.id))
    db_astro_profile = ap_result.scalars().first()

    skip_ai = False
    if db_birth_details and _same_effective_birth(details, db_birth_details) and db_astro_profile and db_astro_profile.full_profile:
        cached = parse_stored_profile(db_astro_profile.full_profile)
        if is_valid_ai_profile(cached):
            skip_ai = True
            print(f"DEBUG: Using cached profile for user {current_user.id}")
    else:
        print(f"DEBUG: Recalculating profile for user {current_user.id} with Ayanamsa: {details.ayanamsa or 'LAHIRI'}")

    ai_warning: str | None = None
    used_fallback = False

    if skip_ai:
        profile_json = parse_stored_profile(db_astro_profile.full_profile)
        if profile_json.get("_meta", {}).get("ai_fallback"):
            ai_warning = profile_json["_meta"].get("message_np")
    else:
        # ── CLEAR CACHE ON EDIT ────────────────────────────
        # If birth details changed, clear existing Rashifal cache
        cache_result = await db.execute(select(RashifalCache).where(RashifalCache.user_id == current_user.id))
        cache = cache_result.scalars().first()
        if cache:
            cache.today_data = None
            cache.today_generated_at = None
            cache.week_data = None
            cache.week_generated_at = None
            cache.month_data = None
            cache.month_generated_at = None
            print(f"DEBUG: Cleared Rashifal cache for user {current_user.id} due to birth detail edit")
        
        # Recalculate AI profile
        ai_result = await generate_dashboard_profile(json.dumps(chart_data, indent=2), provided_rashi=details.provided_rashi)
        if isinstance(ai_result, dict) and ai_result.get("error"):
            err_text = str(ai_result.get("error", "")).lower()
            reason = "rate_limit" if "rate limit" in err_text else "api_error"
            profile_json = build_fallback_profile(chart_data, details.provided_rashi, reason=reason)
            ai_warning = profile_json["_meta"]["message_np"]
            used_fallback = True
        else:
            profile_json = ai_result
            profile_json.pop("_meta", None)

    if "First_Letter" in chart_data:
        profile_json["नामको_अक्षर"] = chart_data["First_Letter"]
        
    # Inject deterministic Avakhada details directly from chart_data
    profile_json["वर्ण"] = chart_data.get("Varna", "N/A")
    profile_json["वश्य"] = chart_data.get("Vashya", "N/A")
    profile_json["योनी"] = chart_data.get("Yoni", "N/A")
    profile_json["गण"] = chart_data.get("Gana", "N/A")
    profile_json["नाडी"] = chart_data.get("Nadi", "N/A")


    if db_birth_details:
        db_birth_details.bs_year = details.bs_year
        db_birth_details.bs_month = details.bs_month
        db_birth_details.bs_day = details.bs_day
        db_birth_details.birth_hour = details.birth_hour
        db_birth_details.birth_minute = details.birth_minute
        db_birth_details.place_of_birth = details.place_of_birth
        db_birth_details.latitude = details.latitude
        db_birth_details.longitude = details.longitude
        db_birth_details.provided_rashi = details.provided_rashi
        db_birth_details.ayanamsa = details.ayanamsa or "LAHIRI"
        db_birth_details.ad_date = dt_ad
    else:
        db_birth_details = BirthDetails(
            user_id=current_user.id,
            bs_year=details.bs_year,
            bs_month=details.bs_month,
            bs_day=details.bs_day,
            birth_hour=details.birth_hour,
            birth_minute=details.birth_minute,
            place_of_birth=details.place_of_birth,
            latitude=details.latitude,
            longitude=details.longitude,
            provided_rashi=details.provided_rashi,
            ayanamsa=details.ayanamsa or "LAHIRI",
            ad_date=dt_ad
        )
        db.add(db_birth_details)

    rashi_val = profile_json.get("राशी") or moon_rashi
    # Add system name to Rashi for visual confirmation
    sys_name = (details.ayanamsa or "LAHIRI").title()
    if sys_name not in str(rashi_val):
        rashi_val = f"{rashi_val} ({sys_name})"
    
    # Calculate Age using Nepal Time (UTC+5:45)
    now_utc = dt_module.datetime.utcnow()
    nepal_now = (now_utc + dt_module.timedelta(hours=5, minutes=45)).date() # Work with dates
    birth_date = dt_ad.date()
    
    age_years = nepal_now.year - birth_date.year - ((nepal_now.month, nepal_now.day) < (birth_date.month, birth_date.day))
    try:
        last_birthday = birth_date.replace(year=nepal_now.year if (nepal_now.month, nepal_now.day) >= (birth_date.month, birth_date.day) else nepal_now.year - 1)
    except ValueError: # Handle Feb 29
        last_birthday = birth_date.replace(year=nepal_now.year if (nepal_now.month, nepal_now.day) >= (birth_date.month, birth_date.day) else nepal_now.year - 1, day=28)
    
    age_days = (nepal_now - last_birthday).days
    age_display = f"{age_years} Years, {age_days} Days"

    # Update profile_json so it shows on the dashboard
    profile_json["राशी"] = rashi_val
    profile_json["उमेर (Age)"] = age_display
    profile_json["जन्म मिति (AD)"] = dt_ad.strftime("%Y-%m-%d")
    profile_json["गणना_विधि (Calculation)"] = sys_name
    
    lagna_val = profile_json.get("लग्न") or chart_data.get("Lagna", "Unknown")
    nak_val = profile_json.get("नक्षत्र") or chart_data.get("Moon_Nakshatra", "Unknown")

    if db_astro_profile:
        db_astro_profile.rashi = rashi_val
        db_astro_profile.lagna = lagna_val
        db_astro_profile.nakshatra = nak_val
        db_astro_profile.planetary_data = chart_data
        db_astro_profile.full_profile = json.dumps(profile_json, ensure_ascii=False)
        db_astro_profile.generated_at = dt_module.datetime.utcnow()
    else:
        db_astro_profile = AstroProfile(
            user_id=current_user.id,
            rashi=rashi_val,
            lagna=lagna_val,
            nakshatra=nak_val,
            planetary_data=chart_data,
            full_profile=json.dumps(profile_json, ensure_ascii=False)
        )
        db.add(db_astro_profile)

    current_user.is_verified = True
    await db.commit()

    response_body: dict = {"status": "success", "profile": profile_json}
    if skip_ai:
        response_body["source"] = "database"
    else:
        response_body["source"] = "ai"
    if used_fallback:
        response_body["ai_fallback"] = True
    if ai_warning:
        response_body["ai_warning"] = ai_warning
    return response_body

def _get_sunday(dt: dt_module.datetime) -> dt_module.datetime:

    """Returns the preceding Sunday for a given dt_module.datetime."""
    # weekday(): Monday is 0, Sunday is 6.
    # To get Sunday: if Monday(0)->-1, if Sunday(6)->0
    offset = (dt.weekday() + 1) % 7
    sunday = dt - timedelta(days=offset)
    return sunday.replace(hour=0, minute=0, second=0, microsecond=0)

def _is_today_expired(generated_at: dt_module.datetime | None) -> bool:
    if not generated_at: return True
    return dt_module.datetime.utcnow().date() != generated_at.date()

def _is_week_expired(generated_at: dt_module.datetime | None) -> bool:
    if not generated_at: return True
    now = dt_module.datetime.utcnow()
    return _get_sunday(now).date() != _get_sunday(generated_at).date()

def _is_month_expired(generated_at: dt_module.datetime | None) -> bool:
    if not generated_at: return True
    now = dt_module.datetime.utcnow()
    return now.year != generated_at.year or now.month != generated_at.month

@router.get("/rashifal")
async def get_user_rashifal(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    print(f"DEBUG: Rashifal request for user {current_user.email}")
    result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == current_user.id).order_by(AstroProfile.id.desc()))
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="कुण्डली विवरण फेला परेन। कृपया पहिले आफ्नो जन्म विवरण भर्नुहोस्।")

    if not profile.rashi or not profile.planetary_data:
        raise HTTPException(status_code=400, detail="तपाईंको कुण्डली विवरण अपूर्ण छ। कृपया जन्म विवरण फेरि भर्नुहोस्।")

    # Check for existing cache
    cache_result = await db.execute(select(RashifalCache).where(RashifalCache.user_id == current_user.id))
    cache = cache_result.scalars().first()
    
    if not cache:
        cache = RashifalCache(user_id=current_user.id)
        db.add(cache)

    now = dt_module.datetime.utcnow()
    chart_data_str = json.dumps(profile.planetary_data, ensure_ascii=False)
    
    # Check each period independently
    needs_today = _is_today_expired(cache.today_generated_at)
    needs_week = _is_week_expired(cache.week_generated_at)
    needs_month = _is_month_expired(cache.month_generated_at)

    rashi_name = profile.rashi.split(" (")[0].strip()
    
    updates_made = False
    try:
        # Prepare generation tasks only for what is expired
        tasks = []
        task_map = {}
        
        if needs_today:
            tasks.append(generate_rashifal(chart_data_str, "today"))
            task_map[len(tasks)-1] = "today"
        if needs_week:
            tasks.append(generate_rashifal(chart_data_str, "week"))
            task_map[len(tasks)-1] = "week"
        if needs_month:
            tasks.append(generate_rashifal(chart_data_str, "month"))
            task_map[len(tasks)-1] = "month"

        if tasks:
            print(f"DEBUG: Generating expired Rashifal periods for {current_user.email}: {list(task_map.values())}")
            results = await asyncio.gather(*tasks)
            for idx, data in enumerate(results):
                period = task_map[idx]
                if period == "today":
                    cache.today_data = data
                    cache.today_generated_at = now
                elif period == "week":
                    cache.week_data = data
                    cache.week_generated_at = now
                elif period == "month":
                    cache.month_data = data
                    cache.month_generated_at = now
            updates_made = True

        if updates_made:
            await db.commit()
            
        return {
            "status": "success",
            "rashi": rashi_name,
            "today": cache.today_data,
            "week": cache.week_data,
            "month": cache.month_data,
            "cached": not updates_made
        }
    except Exception as e:
        print(f"Error managing rashifal cache: {str(e)}")
        raise HTTPException(status_code=500, detail="राशिफल तयार गर्दा समस्या आयो।")

    except Exception as e:
        print(f"Error generating rashifal: {str(e)}")
        raise HTTPException(status_code=500, detail="राशिफल तयार गर्दा समस्या आयो।")

@router.get("/dashboard")
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

    # Fetch BirthDetails for exact age and date
    bd_result = await db.execute(select(BirthDetails).where(BirthDetails.user_id == current_user.id))
    birth_details = bd_result.scalars().first()
    
    # --- Self Healing Avakhada Chakra Data for legacy records ---
    needs_update = False
    if profile.planetary_data and "Varna" not in profile.planetary_data:
        if birth_details and birth_details.ad_date:
            try:
                calc_lat = birth_details.latitude if birth_details.latitude else DEFAULT_LAT
                calc_lng = birth_details.longitude if birth_details.longitude else DEFAULT_LNG
                new_chart = get_full_chart(
                    ad_date=birth_details.ad_date,
                    lat=calc_lat,
                    lon=calc_lng,
                    ayanamsa=birth_details.ayanamsa or "LAHIRI"
                )
                profile.planetary_data = new_chart
                needs_update = True
            except Exception as e:
                print(f"Failed to backfill chart data: {e}")

    if profile.planetary_data and "Varna" in profile.planetary_data:
        p_data = profile.planetary_data
        updates = {
            "वर्ण": p_data.get("Varna", "N/A"),
            "वश्य": p_data.get("Vashya", "N/A"),
            "योनी": p_data.get("Yoni", "N/A"),
            "गण": p_data.get("Gana", "N/A"),
            "नाडी": p_data.get("Nadi", "N/A"),
        }
        for k, v in updates.items():
            if k not in prof_dict or prof_dict.get(k) in [None, "N/A"]:
                prof_dict[k] = v
                needs_update = True

    if needs_update:
        profile.full_profile = json.dumps(prof_dict, ensure_ascii=False)
        await db.commit()
    # -------------------------------------------------------------
    
    ad_date_str = None
    age = None
    if birth_details and birth_details.ad_date:
        from datetime import datetime, timedelta
        ad_date_str = birth_details.ad_date.strftime("%Y-%m-%d")
        now_utc = datetime.utcnow()
        nepal_now = (now_utc + timedelta(hours=5, minutes=45)).date()
        birth_date = birth_details.ad_date.date()
        
        age_years = nepal_now.year - birth_date.year - ((nepal_now.month, nepal_now.day) < (birth_date.month, birth_date.day))
        try:
            last_birthday = birth_date.replace(year=nepal_now.year if (nepal_now.month, nepal_now.day) >= (birth_date.month, birth_date.day) else nepal_now.year - 1)
        except ValueError:
            last_birthday = birth_date.replace(year=nepal_now.year if (nepal_now.month, nepal_now.day) >= (birth_date.month, birth_date.day) else nepal_now.year - 1, day=28)
        
        age_days = (nepal_now - last_birthday).days
        age_display = f"{age_years} Years, {age_days} Days"

    out: dict = {
        "status": "success",
        "profile": prof_dict,
        "planetary_data": profile.planetary_data,
        "ad_date": ad_date_str,
        "age": age_display,
        "source": "database",
    }
    if ai_warning:
        out["ai_warning"] = ai_warning
    return out

@router.put("/update-profile")
async def update_custom_profile(profile_data: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Allows manual updates to textual profile fields from the dashboard."""
    result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == current_user.id).order_by(AstroProfile.id.desc()))
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found to update.")

    # Update the JSON text blob
    profile.full_profile = json.dumps(profile_data, ensure_ascii=False)
    # Also sync top-level fields if they are in the update
    if "राशी" in profile_data: profile.rashi = profile_data["राशी"]
    if "लग्न" in profile_data: profile.lagna = profile_data["लग्न"]
    if "नक्षत्र" in profile_data: profile.nakshatra = profile_data["नक्षत्र"]
    
    profile.generated_at = dt_module.datetime.utcnow()
    
    await db.commit()
    return {"status": "success", "profile": profile_data}
