import sys
from datetime import datetime
import nepali_datetime

# Add backend path to allow imports
sys.path.append('/Users/nirdosh/Desktop/nepali-jyotish-backend')

from core.chart_calculator import get_full_chart

# --- Input Data ---
# User: Chaitra 16, 2034, 12:23 PM, Kathmandu
bs_date = nepali_datetime.date(2034, 12, 16)
ad_date_obj = bs_date.to_datetime_date()
birth_datetime = datetime(ad_date_obj.year, ad_date_obj.month, ad_date_obj.day, 12, 23, 0)

lat = 27.7172
lon = 85.3240

# --- Run Calculation ---
chart = get_full_chart(birth_datetime, lat, lon)

# --- Print Report ---
print("--- NEPALI JYOTISH VALIDATION REPORT ---")
print(f"Birth Date (AD): {birth_datetime.strftime('%Y-%m-%d %H:%M')}")
print("\n--- PANCHANG ---")
print(f"Lagna: {chart['Lagna']}")
print(f"Moon Rashi: {chart['Moon_Rashi']}")
print(f"Moon Nakshatra: {chart['Moon_Nakshatra']} (Pada {chart['Nakshatra_Pada']})")
print(f"First Letter: {chart['First_Letter']}")
print(f"Tithi: {chart['Tithi']}")
print(f"Yoga: {chart['Yoga']}")
print(f"Karana: {chart['Karana']}")
print(f"Dasha: {chart['Current_Dasha']}")

print("\n--- PLANETARY POSITIONS (Graha) ---")
for planet, data in chart['Planets'].items():
    print(f"{planet:<10} | Rashi: {data['rashi']:<10} | House: {data['house']:<2}")

print("\n--- VALIDATION COMPLETE ---")
