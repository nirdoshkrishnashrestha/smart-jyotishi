from datetime import datetime, timedelta

DASHA_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_DURATIONS = [7, 20, 6, 10, 7, 18, 16, 19, 17]

def calculate_vimshottari_dasha(moon_lon: float, birth_date: datetime):
    # Total degrees in a Nakshatra
    nak_degrees = 360 / 27  # 13.3333 degrees
    
    # Current Nakshatra index (0 to 26)
    nak_index = int(moon_lon / nak_degrees) % 27
    
    # Progress within the current Nakshatra (0.0 to 1.0)
    nak_progress = (moon_lon % nak_degrees) / nak_degrees
    
    # Starting dasha lord index (0 to 8)
    start_lord_index = nak_index % 9
    
    # Duration of the starting dasha in years
    start_lord_duration = DASHA_DURATIONS[start_lord_index]
    
    # Remaining duration of the starting dasha at birth
    remaining_at_birth_years = start_lord_duration * (1 - nak_progress)
    
    # Current date
    now = datetime.utcnow()
    
    # Years elapsed since birth
    elapsed_years = (now - birth_date).days / 365.25
    
    # Find current dasha
    current_elapsed = 0
    
    # First dasha (remaining from birth)
    if elapsed_years < remaining_at_birth_years:
        return f"{DASHA_LORDS[start_lord_index]} Mahadasha"
    
    current_elapsed = remaining_at_birth_years
    current_lord_index = (start_lord_index + 1) % 9
    
    while True:
        lord_duration = DASHA_DURATIONS[current_lord_index]
        if elapsed_years < (current_elapsed + lord_duration):
            return f"{DASHA_LORDS[current_lord_index]} Mahadasha"
        
        current_elapsed += lord_duration
        current_lord_index = (current_lord_index + 1) % 9

# Test with user's data: Sawan 1, 2054 BS -> July 16, 1997
# Moon was at 218.46 deg in Vrishchik (Anuradha Nakshatra)
test_moon_lon = 218.46
test_birth_date = datetime(1997, 7, 16)

current_dasha = calculate_vimshottari_dasha(test_moon_lon, test_birth_date)
print(f"Current Dasha for birth on 1997-07-16 with Moon at 218.46: {current_dasha}")
