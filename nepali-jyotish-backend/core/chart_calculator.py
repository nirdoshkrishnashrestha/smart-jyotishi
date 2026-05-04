import swisseph as swe
from datetime import datetime, timedelta

# ─────────────────────────────────────────────────────
# EPHEMERIS PATH — Download from astro.com/swisseph
# swe.set_ephe_path('/path/to/ephe')
# ─────────────────────────────────────────────────────

RASHIS = [
    "Mesh", "Vrishabha", "Mithun", "Karka",
    "Simha", "Kanya", "Tula", "Vrischika",
    "Dhanu", "Makar", "Kumbha", "Meen"
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
    "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
    "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
    "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
    "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

NAKSHATRA_SYLLABLES = [
    ["चु", "चे", "चो", "ला"], ["लि", "लु", "ले", "लो"],
    ["अ", "इ", "उ", "ए"],    ["ओ", "वा", "वि", "वु"],
    ["वे", "वो", "का", "कि"], ["कु", "घ", "ङ", "छ"],
    ["के", "को", "हा", "हि"], ["हु", "हे", "हो", "डा"],
    ["डि", "डु", "डे", "डो"], ["मा", "मि", "मु", "मे"],
    ["मो", "टा", "टि", "टु"], ["टे", "टो", "पा", "पि"],
    ["पु", "ष", "ण", "ठ"],   ["पे", "पो", "रा", "रि"],
    ["रु", "रे", "रो", "ता"], ["ति", "तु", "ते", "तो"],
    ["ना", "नि", "नु", "ने"], ["नो", "या", "यि", "यु"],
    ["ये", "यो", "भा", "भी"], ["भू", "धा", "फा", "ढा"],
    ["भे", "भो", "जा", "जी"], ["खी", "खू", "खे", "खो"],
    ["गा", "गी", "गू", "गे"], ["गो", "सा", "सी", "सू"],
    ["से", "सो", "दा", "दी"], ["दू", "थ", "झ", "ञ"],
    ["दे", "दो", "चा", "ची"]
]

YOGAS = [
    "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Sobhana",
    "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi",
    "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
    "Variyan", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
    "Shukla", "Brahma", "Indra", "Vaidhriti"
]

# ── Correct Karana names in cycle order ──────────────
# Fixed karanas: Shakuni, Chatushpada, Naga, Kintughna
# Movable karanas cycle: Bava, Balava, Kaulava, Taitila, Garija, Vanija, Visti

MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Garija", "Vanija", "Visti"]
FIXED_KARANAS   = ["Shakuni", "Chatushpada", "Naga", "Kintughna"]

YONIS = ['Ashwa', 'Gaja', 'Mesha', 'Sarpa', 'Sarpa', 'Shvan', 'Marjara', 'Mesha', 'Marjara', 'Mushaka', 'Mushaka', 'Gau', 'Mahisha', 'Vyaghra', 'Mahisha', 'Vyaghra', 'Mriga', 'Mriga', 'Shvan', 'Vanara', 'Nakula', 'Vanara', 'Simha', 'Ashwa', 'Simha', 'Gau', 'Gaja']
GANAS = ['Deva', 'Manushya', 'Rakshasa', 'Manushya', 'Deva', 'Manushya', 'Deva', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya', 'Deva']
NADIS = ['Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi', 'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi', 'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi', 'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi', 'Aadi', 'Madhya', 'Antya']

def get_varna(rashi_idx: int) -> str:
    return ["Kshatriya", "Vaishya", "Shudra", "Brahmin"][rashi_idx % 4]

def get_vashya(rashi_idx: int, degrees: int) -> str:
    if rashi_idx in [0, 1]: return "Chatushpada"
    if rashi_idx in [2, 5, 6, 10]: return "Dwipada"
    if rashi_idx in [3, 11]: return "Jalachara"
    if rashi_idx == 4: return "Vanchara"
    if rashi_idx == 7: return "Keeta"
    if rashi_idx == 8: return "Dwipada" if degrees < 15 else "Chatushpada"
    if rashi_idx == 9: return "Chatushpada" if degrees < 15 else "Jalachara"
    return ""

def get_navamsha_rashi_idx(longitude: float) -> int:
    longitude = longitude % 360
    rashi_idx = int(longitude / 30) % 12
    deg_in_rashi = longitude % 30
    element = rashi_idx % 4
    start_sign = [0, 9, 6, 3][element]
    nav_in_sign = int(deg_in_rashi / (30 / 9))
    return (start_sign + nav_in_sign) % 12

AYANAMSA_MAP = {
    "LAHIRI":      swe.SIDM_LAHIRI,
    "RAMAN":       swe.SIDM_RAMAN,
    "SS_REVATI":   swe.SIDM_SS_REVATI,
    "SS_CITRA":    swe.SIDM_SS_CITRA,
    "YUKTESHWAR":  swe.SIDM_YUKTESHWAR,
    "KP":          swe.SIDM_KRISHNAMURTI,
}

AYANAMSA_DESCRIPTIONS = {
    "LAHIRI":     "Lahiri / Chitrapaksha — Modern Nepali Patro (Drik Siddhanta)",
    "RAMAN":      "B.V. Raman — South Indian school (~1°40' less than Lahiri)",
    "SS_REVATI":  "Surya Siddhanta / Revati — Traditional pandit tables",
    "SS_CITRA":   "Surya Siddhanta / Chitra — Classical Chitra-based",
    "YUKTESHWAR": "Sri Yukteshwar — Yogic/Kriya tradition",
    "KP":         "Krishnamurti Paddhati — KP astrology system",
}

# ─────────────────────────────────────────────────────
# TIMEZONE
# ─────────────────────────────────────────────────────

def get_nepal_offset(dt: datetime) -> timedelta:
    """Nepal changed timezone in 1986: before=UTC+5:40, after=UTC+5:45"""
    if dt >= datetime(1986, 1, 1):
        return timedelta(hours=5, minutes=45)
    else:
        return timedelta(hours=5, minutes=40)

# ─────────────────────────────────────────────────────
# JULIAN DAY
# ─────────────────────────────────────────────────────

def get_julian_day(ad_date: datetime) -> float:
    offset  = get_nepal_offset(ad_date)
    utc     = ad_date - offset
    decimal_hour = utc.hour + utc.minute / 60.0 + utc.second / 3600.0
    return swe.julday(utc.year, utc.month, utc.day, decimal_hour)

# ─────────────────────────────────────────────────────
# LAGNA — BUG FIX: correct minutes extraction
# ─────────────────────────────────────────────────────

def get_lagna(jd: float, lat: float, lon: float) -> tuple:
    """
    Calculate tropical ascendant first, then manually subtract ayanamsa.
    Do NOT use FLG_SIDEREAL with swe.houses() — unreliable across versions.
    Returns (sidereal_asc_degrees, ayanamsa_value)
    """
    cusps, ascmc = swe.houses(jd, lat, lon, b'W')   # Whole Sign (Vedic standard)
    tropical_asc  = ascmc[0]
    ayanamsa_val  = swe.get_ayanamsa_ut(jd)
    sidereal_asc  = (tropical_asc - ayanamsa_val) % 360

    # Correct degrees/minutes extraction
    deg_in_sign = sidereal_asc % 30
    degrees     = int(deg_in_sign)
    minutes     = int((deg_in_sign - degrees) * 60)        # BUG FIX: was (deg%30)%1 which is same but unclear
    seconds     = int(((deg_in_sign - degrees) * 60 - minutes) * 60)

    display = f"{degrees}°{minutes}'{seconds}\""
    return sidereal_asc, ayanamsa_val, display

# ─────────────────────────────────────────────────────
# PLANET INFO
# ─────────────────────────────────────────────────────

def get_planet_info(longitude: float, velocity: float, asc_idx: int, sun_longitude: float = None) -> dict:
    longitude    = longitude % 360
    rashi_idx    = int(longitude / 30) % 12
    deg_in_rashi = longitude % 30
    degrees      = int(deg_in_rashi)
    minutes      = int((deg_in_rashi - degrees) * 60)
    seconds      = int(((deg_in_rashi - degrees) * 60 - minutes) * 60)
    house        = (rashi_idx - asc_idx + 12) % 12 + 1
    is_retro     = velocity < 0

    is_combust = False
    if sun_longitude is not None:
        diff = abs(longitude - sun_longitude)
        if diff > 180:
            diff = 360 - diff
        is_combust = diff < 8

    return {
        "longitude":     round(longitude, 4),
        "velocity":      round(velocity, 4),
        "rashi":         RASHIS[rashi_idx],
        "rashi_idx":     rashi_idx,
        "navamsha_rashi": RASHIS[get_navamsha_rashi_idx(longitude)],
        "house":         house,
        "degrees":       degrees,
        "minutes":       minutes,
        "seconds":       seconds,
        "is_retrograde": is_retro,
        "is_combust":    is_combust,
        "display":       f"{RASHIS[rashi_idx]} {degrees}°{minutes}'{seconds}\""
    }

# ─────────────────────────────────────────────────────
# KARANA — BUG FIX: correct fixed/movable mapping
# ─────────────────────────────────────────────────────

def get_karana(tithi_diff: float) -> str:
    """
    There are 60 karanas in a lunar month:
    #1       → Kintughna      (fixed, Shukla Pratipada 1st half)
    #2-57    → 8 cycles of 7 movable karanas (Bava…Visti)
    #58      → Shakuni        (fixed)
    #59      → Chatushpada    (fixed)
    #60      → Naga           (fixed)

    BUG FIX from original:
      - Original used karana_num starting at 1 with wrong fixed-karana indices
      - This version uses 0-based karana_num (0–59) for clean modulo math
    """
    # 0-based karana index (0 to 59)
    karana_num = int(tithi_diff / 6) % 60

    if karana_num == 0:
        return FIXED_KARANAS[3]           # Kintughna — very first half of month
    elif 1 <= karana_num <= 56:
        return MOVABLE_KARANAS[(karana_num - 1) % 7]
    elif karana_num == 57:
        return FIXED_KARANAS[0]           # Shakuni
    elif karana_num == 58:
        return FIXED_KARANAS[1]           # Chatushpada
    else:                                 # 59
        return FIXED_KARANAS[2]           # Naga

# ─────────────────────────────────────────────────────
# VIMSHOTTARI DASHA — BUG FIX: boundary condition + no naive/aware mixing
# ─────────────────────────────────────────────────────

def calculate_vimshottari_dasha(moon_lon: float, birth_date: datetime) -> dict:
    """
    BUG FIX:
    - Removed unused 'accumulated_prev' variable
    - Fixed boundary: loop now correctly handles all 9 dasha periods
    - Both birth_date and now() are naive — consistent, no tz mixing
    """
    lords = ["Ketu", "Venus", "Sun", "Moon", "Mars",
             "Rahu", "Jupiter", "Saturn", "Mercury"]
    durs  = [7, 20, 6, 10, 7, 18, 16, 19, 17]   # Vimshottari years
    TOTAL = sum(durs)                              # = 120 years

    NAK_SIZE  = 360 / 27
    nak_idx   = int(moon_lon / NAK_SIZE) % 27
    progress  = (moon_lon % NAK_SIZE) / NAK_SIZE  # fraction elapsed in current nakshatra

    # Which dasha lord owns this nakshatra (9 lords repeat over 27 nakshatras)
    start_idx = nak_idx % 9

    # Years remaining in the birth dasha
    remaining_first = durs[start_idx] * (1 - progress)

    # Elapsed years since birth (both naive datetimes)
    now           = datetime.now()
    elapsed_years = (now - birth_date).days / 365.25

    # Accumulate dashas until we find the current one
    accumulated = remaining_first
    idx         = start_idx

    maha_lord  = lords[idx]
    years_left = remaining_first - elapsed_years

    if elapsed_years >= accumulated:
        # Move past the first (partial) dasha
        for _ in range(9):                        # max 9 full periods = 120 yrs
            idx         = (idx + 1) % 9
            accumulated += durs[idx]
            years_left  = accumulated - elapsed_years
            if elapsed_years < accumulated:
                maha_lord = lords[idx]
                break
        else:
            # Person is older than 120 years — cycle repeats
            elapsed_mod = elapsed_years % TOTAL
            accumulated = remaining_first
            idx         = start_idx
            if elapsed_mod >= accumulated:
                for _ in range(9):
                    idx         = (idx + 1) % 9
                    accumulated += durs[idx]
                    if elapsed_mod < accumulated:
                        maha_lord  = lords[idx]
                        years_left = accumulated - elapsed_mod
                        break

    return {
        "mahadasha":       maha_lord,
        "years_remaining": round(max(years_left, 0), 2),
        "display":         f"{maha_lord} Mahadasha ({round(max(years_left, 0), 1)} yrs remaining)"
    }

# ─────────────────────────────────────────────────────
# MAIN CHART FUNCTION
# ─────────────────────────────────────────────────────

def get_full_chart(
    ad_date: datetime,
    lat: float,
    lon: float,
    ayanamsa: str = "LAHIRI"
) -> dict:
    """
    Full Nepali Vedic Kundali.

    Args:
        ad_date:  Birth datetime (Nepal local time, naive datetime)
        lat:      Latitude  (e.g. 27.7172 for Kathmandu)
        lon:      Longitude (e.g. 85.3240 for Kathmandu)
        ayanamsa: LAHIRI | RAMAN | SS_REVATI | SS_CITRA | YUKTESHWAR | KP
    """
    # ── Ayanamsa ──────────────────────────────────────
    mode = AYANAMSA_MAP.get(ayanamsa.upper(), swe.SIDM_LAHIRI)
    swe.set_sid_mode(mode, 0, 0)

    # ── Julian Day ────────────────────────────────────
    jd = get_julian_day(ad_date)

    # ── Ayanamsa value ────────────────────────────────
    ayan_val = swe.get_ayanamsa_ut(jd)

    # ── Lagna ─────────────────────────────────────────
    sidereal_asc, _, lagna_display = get_lagna(jd, lat, lon)
    asc_idx = int(sidereal_asc / 30) % 12

    # ── Planet Positions ──────────────────────────────
    PLANET_IDS = {
        "Sun":     swe.SUN,
        "Moon":    swe.MOON,
        "Mars":    swe.MARS,
        "Mercury": swe.MERCURY,
        "Jupiter": swe.JUPITER,
        "Venus":   swe.VENUS,
        "Saturn":  swe.SATURN,
        "Rahu":    swe.MEAN_NODE,
    }

    # FLG_SIDEREAL applied correctly to calc_ut (NOT to houses)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    raw_positions = {}
    for name, pid in PLANET_IDS.items():
        pos, _ = swe.calc_ut(jd, pid, flags)
        raw_positions[name] = pos

    sun_lon = raw_positions["Sun"][0] % 360

    planets = {}
    for name, pos in raw_positions.items():
        sun_ref = None if name == "Sun" else sun_lon
        planets[name] = get_planet_info(pos[0], pos[3], asc_idx, sun_ref)

    # Ketu = Rahu + 180°
    ketu_lon = (planets["Rahu"]["longitude"] + 180) % 360
    planets["Ketu"] = get_planet_info(ketu_lon, planets["Rahu"]["velocity"], asc_idx, sun_lon)

    # ── Panchang ──────────────────────────────────────
    sun_lon  = planets["Sun"]["longitude"]
    moon_lon = planets["Moon"]["longitude"]

    # Nakshatra & Pada
    NAK_SIZE = 360 / 27
    nak_idx  = int(moon_lon / NAK_SIZE) % 27
    pada_idx = int((moon_lon % NAK_SIZE) / (NAK_SIZE / 4)) % 4   # 0-based

    # Tithi & Paksha
    tithi_diff = (moon_lon - sun_lon + 360) % 360
    tithi_num  = int(tithi_diff / 12) + 1     # 1–30

    if tithi_num <= 15:
        paksha    = "Shukla"
        tithi_out = tithi_num
    else:
        paksha    = "Krishna"
        tithi_out = tithi_num - 15

    # Yoga
    yog_idx = int(((sun_lon + moon_lon) % 360) / (360 / 27)) % 27

    # Karana — BUG FIX: correct function call
    karana_name = get_karana(tithi_diff)

    # Dasha
    dasha = calculate_vimshottari_dasha(moon_lon, ad_date)

    # ── Result ────────────────────────────────────────
    return {
        "ayanamsa":       ayanamsa.upper(),
        "ayanamsa_desc":  AYANAMSA_DESCRIPTIONS.get(ayanamsa.upper(), ""),
        "ayanamsa_value": round(ayan_val, 6),
        "julian_day":     round(jd, 6),

        "Lagna":          RASHIS[asc_idx],
        "Lagna_idx":      asc_idx,
        "Lagna_degrees":  lagna_display,       # BUG FIX: was wrong minutes formula
        "Lagna_Navamsha": RASHIS[get_navamsha_rashi_idx(sidereal_asc)],

        "Moon_Rashi":     planets["Moon"]["rashi"],
        "Moon_Nakshatra": NAKSHATRAS[nak_idx],
        "Nakshatra_Pada": pada_idx + 1,        # 1-based for display
        "First_Letter":   NAKSHATRA_SYLLABLES[nak_idx][pada_idx],

        "Varna":          get_varna(planets["Moon"]["rashi_idx"]),
        "Vashya":         get_vashya(planets["Moon"]["rashi_idx"], planets["Moon"]["degrees"]),
        "Yoni":           YONIS[nak_idx],
        "Gana":           GANAS[nak_idx],
        "Nadi":           NADIS[nak_idx],

        "Paksha":         paksha,
        "Tithi":          tithi_out,
        "Yoga":           YOGAS[yog_idx],
        "Karana":         karana_name,          # BUG FIX: correct karana

        "Current_Dasha":  dasha["display"],
        "Dasha_Detail":   dasha,

        "Planets":        planets,
    }

# ─────────────────────────────────────────────────────
# COMPARE AYANAMSAS
# ─────────────────────────────────────────────────────

def compare_ayanamsas(ad_date: datetime, lat: float, lon: float) -> None:
    print(f"\n{'='*65}")
    print(f"  AYANAMSA COMPARISON — {ad_date.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Location: {lat}°N, {lon}°E")
    print(f"{'='*65}")
    print(f"{'Ayanamsa':<14} {'Value':>10}  {'Lagna':<14} {'Moon Rashi':<14} {'Nakshatra'}")
    print(f"{'-'*65}")

    for key in ["LAHIRI", "RAMAN", "SS_REVATI", "SS_CITRA"]:
        chart = get_full_chart(ad_date, lat, lon, ayanamsa=key)
        print(
            f"{key:<14} "
            f"{chart['ayanamsa_value']:>9.4f}°  "
            f"{chart['Lagna']:<14} "
            f"{chart['Moon_Rashi']:<14} "
            f"{chart['Moon_Nakshatra']}"
        )

    print(f"{'='*65}\n")
    # BUG FIX: swe.close() moved here only — was closing mid-session before
    swe.close()

# ─────────────────────────────────────────────────────
# EXAMPLE USAGE
# ─────────────────────────────────────────────────────

if __name__ == "__main__":
    birth = datetime(1990, 6, 15, 10, 30, 0)
    lat   = 27.7172   # Kathmandu
    lon   = 85.3240

    chart = get_full_chart(birth, lat, lon, ayanamsa="LAHIRI")

    print(f"\nAyanamsa : {chart['ayanamsa_desc']}")
    print(f"Value    : {chart['ayanamsa_value']}°")
    print(f"Lagna    : {chart['Lagna']} ({chart['Lagna_degrees']}) [Navamsha: {chart['Lagna_Navamsha']}]")
    print(f"Moon     : {chart['Moon_Rashi']} — {chart['Moon_Nakshatra']} Pada {chart['Nakshatra_Pada']}")
    print(f"Letter   : {chart['First_Letter']}")
    print(f"Avakhada : Varna: {chart['Varna']}, Vashya: {chart['Vashya']}, Yoni: {chart['Yoni']}, Gana: {chart['Gana']}, Nadi: {chart['Nadi']}")
    print(f"Tithi    : {chart['Paksha']} {chart['Tithi']}")
    print(f"Yoga     : {chart['Yoga']}")
    print(f"Karana   : {chart['Karana']}")
    print(f"Dasha    : {chart['Current_Dasha']}")
    print(f"\nPlanets:")
    for p, d in chart["Planets"].items():
        retro = " (R)" if d["is_retrograde"] else ""
        combust = " (C)" if d["is_combust"] else ""
        print(f"  {p:<10} → {d['display']:<28} House {d['house']}, Navamsha {d['navamsha_rashi']}{retro}{combust}")

    print()
    compare_ayanamsas(birth, lat, lon)
