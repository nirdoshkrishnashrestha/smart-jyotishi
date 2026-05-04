import swisseph as swe
from datetime import datetime, timedelta

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
              "Tula", "Vrishchik", "Dhanu", "Makar", "Kumbha", "Meen"]
    index = int(lon / 30) % 12
    return RASHIS[index], index + 1

# Inputs
year, month, day = 1997, 7, 16 # 2054-04-01 BS is roughly 1997-07-16 AD
hour, minute = 10, 56
lat, lon = 28.2333, 83.9844 # Pokhara

ad_date = datetime(year, month, day, hour, minute)
jd = get_julian_day(ad_date)

# Calculate Lagna (Ascendant)
# Using Whole Sign (W) system as used in the backend
cusps, ascmc = swe.houses_ex(jd, lat, lon, b'W', flags=swe.FLG_SIDEREAL)
asc_lon = ascmc[0]
asc_rashi, asc_sign_num = get_rashi_from_longitude(asc_lon)

# Calculate Moon
pos, ret = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)
moon_lon = pos[0]
moon_rashi, moon_sign_num = get_rashi_from_longitude(moon_lon)

# Calculate Sun
pos_sun, ret_sun = swe.calc_ut(jd, swe.SUN, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)
sun_lon = pos_sun[0]
sun_rashi, sun_sign_num = get_rashi_from_longitude(sun_lon)

print(f"AD Date: {ad_date}")
print(f"Lagna: {asc_rashi} ({asc_lon:.2f} deg)")
print(f"Moon: {moon_rashi} ({moon_lon:.2f} deg)")
print(f"Sun: {sun_rashi} ({sun_lon:.2f} deg)")
