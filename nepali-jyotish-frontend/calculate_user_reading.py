import sys
from datetime import datetime
import nepali_datetime
import json

# Add backend path
sys.path.append('/Users/nirdosh/Desktop/nepali-jyotish-backend')

from core.chart_calculator import get_full_chart

# --- Input Data ---
# Baishak 02, 2042 BS, 02:00 AM, Bharatpur
# 2042-01-02 BS
bs_date = nepali_datetime.date(2042, 1, 2)
ad_date_obj = bs_date.to_datetime_date()
# AD Date should be 1985-04-14 (since Baishak 1 is usually April 13/14)
birth_datetime = datetime(ad_date_obj.year, ad_date_obj.month, ad_date_obj.day, 2, 0, 0)

# Bharatpur, Chitwan: Lat 27.6833, Lon 84.4333
lat = 27.6833
lon = 84.4333

# --- Run Calculation ---
chart = get_full_chart(birth_datetime, lat, lon)

# --- Print Report ---
print("--- CALCULATED CHART FOR USER ---")
print(json.dumps(chart, indent=2, ensure_ascii=False))
