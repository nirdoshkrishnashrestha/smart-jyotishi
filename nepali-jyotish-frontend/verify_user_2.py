import swisseph as swe
from datetime import datetime, timedelta
import nepali_datetime

# Settings
swe.set_sid_mode(swe.SIDM_LAHIRI)

def get_julian_day(ad_date: datetime):
    # Nepal is UTC+5:45
    utc_date = ad_date - timedelta(hours=5, minutes=45)
    hour = utc_date.hour + (utc_date.minute / 60.0) + (utc_date.second / 3600.0)
    jd = swe.julday(utc_date.year, utc_date.month, utc_date.day, hour)
    return jd

def get_rashi_from_longitude(lon: float):
    RASHIS = ["Mesh", "Vrishabha", "Mithun", "Karka", "Simha", "Kanya", 
              "Tula", "Vrischika", "Dhanu", "Makar", "Kumbha", "Meen"]
    index = int(lon / 30) % 12
    return RASHIS[index], index + 1

# Inputs: Chaitra 16, 2034 BS
np_date = nepali_datetime.date(2034, 12, 16)
ad_date_base = np_date.to_datetime_date()
# Birth Time: 12:23:00
ad_date = datetime(ad_date_base.year, ad_date_base.month, ad_date_base.day, 12, 23, 0)

jd = get_julian_day(ad_date)

# Calculate Lagna (Ascendant)
# Using Whole Sign (W) system
cusps, ascmc = swe.houses_ex(jd, 27.7172, 85.3240, b'W', flags=swe.FLG_SIDEREAL)
asc_lon = ascmc[0]
asc_rashi, asc_sign_num = get_rashi_from_longitude(asc_lon)

# Calculate Moon
pos, ret = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)
moon_lon = pos[0]
moon_rashi, moon_sign_num = get_rashi_from_longitude(moon_lon)

print(f"BS Date: 2034-12-16")
print(f"AD Date: {ad_date}")
print(f"Lagna: {asc_rashi} ({asc_lon:.2f} deg)")
print(f"Moon: {moon_rashi} ({moon_lon:.2f} deg)")
