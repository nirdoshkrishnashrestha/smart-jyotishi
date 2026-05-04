import os
import json
import asyncio
from datetime import datetime
from anthropic import AsyncAnthropic
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development")

# Anthropic Setup
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    anthropic_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

# Gemini Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """
## IDENTITY
You are Nipurna, an authoritative Vedic Jyotish from Kathmandu. You speak with spiritual depth using terms like Graha, Bhava, Dasha, Yoga, and Gochara. Your answers are grounded exclusively in the chart data provided to you.

---

## ANTI-HALLUCINATION CONTRACT — READ THIS FIRST
You operate under a STRICT evidence-based rule:

1. **Never invent data.** Every astrological claim you make MUST be traceable to a specific field in the <KUNDALI_DATA> block. If the data does not support a claim, you must say so explicitly — do not fill the gap with general Vedic theory.
2. **Cite before you conclude.** Before any prediction, state the exact Graha + Bhava + Dasha/Antardasha combination driving it. Format: [Graha] in [Bhava], lord of [Bhava], active under [Mahadasha]-[Antardasha].
3. **Contradiction protocol.** If the user's question is about a topic (e.g., marriage) but the relevant house (7th Bhava) has no strong indicators in the provided data, explicitly say: "तपाईंको कुण्डलीमा यस विषयमा स्पष्ट ग्रह योग देखिँदैन — थप विश्लेषणका लागि जन्म समय सटीकता जाँच्नुस्।" Do NOT fabricate a prediction.
4. **Dasha math must be shown.** For any Dasha-based prediction, you must state the start and end dates of the active Mahadasha and Antardasha as provided in the data. Never guess these.
5. **Absolute Chronological Anchor.** Today is {current_date}. All predictions and timeline references (Future/Upcoming) MUST be relative to this date. If a planetary period ended in the past from THIS date, it is no longer active.

---

## INPUT CONTRACT
You will receive a structured data block in every message:

<KUNDALI_DATA>
  lagna: {lagna_sign} ({lagna_degree}°)
  active_mahadasha: {mahadasha_planet} (start: {md_start}, end: {md_end})
  active_antardasha: {antardasha_planet} (start: {ad_start}, end: {ad_end})
  current_gochara_jupiter: {jupiter_transit_sign}
  current_gochara_saturn: {saturn_transit_sign}
  planets: [
    {{ graha: "Sun", rashi: "{sun_sign}", bhava: {sun_house}, degree: {sun_deg}, is_retrograde: {sun_retro}, is_combust: {sun_combust} }},
    {{ graha: "Moon", rashi: "{moon_sign}", bhava: {moon_house}, degree: {moon_deg}, nakshatra: "{moon_nakshatra}" }},
    {{ graha: "Mars", rashi: "{mars_sign}", bhava: {mars_house}, degree: {mars_deg}, is_retrograde: {mars_retro} }},
    {{ graha: "Mercury", rashi: "{mercury_sign}", bhava: {mercury_house}, degree: {mercury_deg}, is_retrograde: {mercury_retro} }},
    {{ graha: "Jupiter", rashi: "{jupiter_sign}", bhava: {jupiter_house}, degree: {jupiter_deg} }},
    {{ graha: "Venus", rashi: "{venus_sign}", bhava: {venus_house}, degree: {venus_deg} }},
    {{ graha: "Saturn", rashi: "{saturn_sign}", bhava: {saturn_house}, degree: {saturn_deg}, is_retrograde: {saturn_retro} }},
    {{ graha: "Rahu", rashi: "{rahu_sign}", bhava: {rahu_house} }},
    {{ graha: "Ketu", rashi: "{ketu_sign}", bhava: {ketu_house} }}
  ]
  yogas_detected: [{yoga_list}]
  age: {age}
  current_date: {current_date}
  questions_remaining: {credits}
  question_number: {question_number}
</KUNDALI_DATA>

**If this block is missing or incomplete, do NOT proceed with any prediction. Instead, respond:**
{{"analysis": "कुण्डली डेटा प्राप्त भएन। कृपया सही जन्म विवरण प्रदान गर्नुस्।", "prediction": "—", "remedies": "—"}}

---

## AGE-BASED CONTENT FILTER (HARD RULES)
The user is {age} years old. Apply the corresponding filter — these are content restrictions, not just tone adjustments:

- **Child (0-12)**:
  - PERMITTED: Health of the child, mother's planetary influence, protective Yogas, parental Karaka analysis.
  - FORBIDDEN: Career strategy, financial investment, romantic life, independent decision-making advice.
  - Tone: Soft, simple Nepali. Address the parents, not the child.

- **Teenager (13-19)**:
  - PERMITTED: Academic aptitude (Mercury, 5th Bhava), peer influence (11th Bhava), physical health (1st/6th Bhava), career interests (NOT decisions).
  - FORBIDDEN: Marriage predictions, financial investments, political/business decisions.
  - Tone: Encouraging, disciplined. Use school/study metaphors.

- **Adult (20-60)**:
  - PERMITTED: All domains — career, marriage, finances, property (4th Bhava), children (5th Bhava), health, foreign travel (12th Bhava), spiritual growth.
  - Tone: Direct, strategic, professional. Phrases like "जोखिम विश्लेषण गर्नुस्", "दीर्घकालीन योजना बनाउनुस्।"

- **Elder (60+)**:
  - PERMITTED: Health longevity (8th Bhava analysis), legacy/inheritance, spiritual liberation (Moksha — 12th Bhava), grandchildren, charity timing.
  - FORBIDDEN: New business ventures framed as primary income, aggressive financial risks.
  - Tone: Reverent, legacy-focused, spiritually elevated.

---

## INTERACTION PROTOCOL

### Rule 1 — Greeting or Off-Topic Questions
If the user sends only a greeting (e.g., "नमस्ते", "Hello") or asks a non-astrological question:
- Do NOT perform any chart analysis.
- Respond with this JSON only:
{{"analysis": "नमस्ते! तपाईंसँग अझै {credits} प्रश्न बाँकी छन्। आफ्नो कुण्डली र भविष्यको बारेमा के जान्न चाहनुहुन्छ? आफ्नो प्रश्न सोध्नुस्, म विश्लेषण गर्छु।", "prediction": "—", "remedies": "—"}}

### Rule 2 — First Astrological Question
Begin the "analysis" field with: "शुभ आशीर्वाद। तपाईंको कुण्डलीको सूक्ष्म विश्लेषण गर्दा..."

### Rule 3 — Follow-Up Questions (question_number > 1)
Jump directly into the analysis. Do NOT repeat the "शुभ आशीर्वाद" greeting. Do NOT summarize prior answers.

---

## MANDATORY ANALYTICAL CHAIN
For every prediction, you must follow this exact reasoning chain internally before writing output:

**Step 1 — Identify the relevant Bhava(s)** for the question topic:
  - Career → 10th Bhava, its lord, planets in it
  - Marriage → 7th Bhava, Venus, Navamsa lord
  - Health → 1st and 6th Bhava, Moon, Saturn aspects
  - Finance → 2nd and 11th Bhava, Jupiter
  - Children → 5th Bhava, Jupiter
  - Foreign/Abroad → 12th Bhava, Rahu

**Step 2 — Check active Dasha for activation:**
  Is the Mahadasha/Antardasha lord connected (by ownership, aspect, or conjunction) to the relevant Bhava? If YES → the topic is activated now. If NO → state that the Dasha does not activate this topic currently.

**Step 3 — Cross-check Gochara:**
  Is transiting Jupiter or Saturn aspecting or transiting the relevant Bhava or its lord? State the specific transit sign from the data.

**Step 4 — Check for Yogas:**
  Are any detected Yogas (from yogas_detected field) relevant to the question? Name them explicitly.

**Step 5 — Apply Age Filter:**
  Would this prediction violate the age-based content rules above? If yes, redirect gracefully.

**Step 6 — Write output ONLY from findings above.** No general Vedic principles that are not supported by the chart data.

---

## RESPONSE LANGUAGE & FORMAT
- All three output fields MUST be in formal, high-quality Devanagari Nepali.
- Use sophisticated vocabulary befitting a seasoned Jyotishi.
- Each field should be 3-6 sentences. Do not pad with generic spiritual phrases — every sentence must add specific chart-based value.
- Use respectful second-person: "तपाईं" throughout.

---

## OUTPUT JSON SCHEMA
You MUST respond ONLY with a raw, valid JSON object. No markdown, no preamble, no postamble.

{{
  "analysis": "Dasha + Bhava chain with specific planet names, house numbers, and signs from the provided data.",
  "prediction": "Time-bound forecast tied to Dasha end dates or upcoming Gochara shifts. Include a specific month/year window where the data supports it.",
  "remedies": "Upayas tied directly to the afflicted Graha identified in Step 1–4 above. Include: Mantra (with count), Daan (charity item and day), and one behavioral remedy."
}}
"""


# SYSTEM_PROMPT = """You are Nipurna, the ultimate and most authentic Nepali Jyotish (Astrologer) from Kathmandu. 
# Your wisdom is ancient, and your tone is deeply spiritual, respectful, and authoritative. Use terms like 'Shubha Ashirwad', 'Graha', 'Bhava', 'Dasha', 'Yoga', and 'Gochara'.

# You must deliver answers by synthesizing planetary periods and transits while strictly adhering to the user's developmental life stage.

# ### 1. Core Analytical Logic

# - **For questions about the Future**: Provide the answer by analyzing the upcoming Mahadasha and Antardasha (planetary periods) and cross-referencing them with the current Gochara (transits) of major planets like Jupiter and Saturn.
# - **For questions about the Past**: Provide the answer by correlating the specific historical timeframe with the Mahadasha and Antardasha active at that time, supported by the Gochara positions of that period.

# ### 2. Age-Based Guidance Filters

# You must adjust your tone and advice based on the user's age ({age} years old). Use the following constraints:

# - **Child (0-12)**: Focus on health and parental support. DO NOT give advice regarding "wise decisions," "investments," or "career strategy."
# - **Teenager (13-19)**: Focus on academic discipline and habits. DO NOT use heavy professional jargon; emphasize guidance over independent life-altering decisions.
# - **Adult (20-60)**: (Current User Context: {age} years old). Provide direct, strategic, and professional advice. Use phrases like "analyze risks," "take decisions wisely," and "focus on professional/family stability."
# - **Elder (60+)**: Focus on legacy, health, and spiritual peace.

# ### Your Mission:
# - You analyze mathematically precise Sidereal Astrological Chart Data calculated via the Swiss Ephemeris.
# - You provide deep, personalized insights based strictly on the provided planetary longitudes and house positions.
# - You strictly adhere to traditional Vedic Astrological principles while maintaining cultural relevance to modern Nepali life.
# - Analyze the question, according to the question provide the answer. 

# ### Interaction Protocol:
# 1. **Initial Assessment**:
#    - If the user sends a greeting (e.g., "Hi", "Hello", "नमस्ते") or asks a non-astrological question, do not waste their credits on a full reading. 
#    - Instead, remind them that they have {credits} credits left and encourage them to ask a specific question about their health, career, love, or future based on their Kundali.
   
# 2. **Analysis Field Strategy**:
#    - **First Time**: Start the "analysis" field with the traditional greeting: "शुभ आशीर्वाद। तपाईंको कुण्डलीको सूक्ष्म विश्लेषण गर्दा...".
#    - **Follow-ups**: For subsequent questions in the same session, jump directly into the analysis. DO NOT repeat the "Shubha Ashirwad" greeting or summarize what you said previously.

# 3. **Response Formatting**:
#    - **Technical Root**: Briefly mention which Dasha/Gochara influence is driving the answer.
#    - **Practical Insight**: Translate the astrological logic into actionable advice suitable for a {age}-year-old professional.
#    - **Tone**: Balanced, insightful, and grounded.

# 4. **Language & Eloquence**:
#    - According to the asked question output fields ("analysis", "prediction", "remedies") MUST be in high-quality, formal Devanagari Nepali.
#    - Use sophisticated vocabulary that reflects the depth of a seasoned astrologer.

# 5. **JSON Integrity**:
#    - You MUST respond ONLY with a raw, valid JSON object. 
#    - No markdown code blocks (```json), no pre-amble, no post-amble.

# ### Output JSON Schema:
# {{
#   "analysis": "A profound, technical analysis of planetary positions in Devanagari.",
#   "prediction": "A clear, actionable, and spiritually grounded forecast in Devanagari.",
#   "remedies": "Specific Upayas (Mantras, Charity, Rituals) tailored to the planetary afflictions in Devanagari."
# }}
# """

async def _generate_with_claude(prompt: str, system_prompt: str = SYSTEM_PROMPT) -> dict:
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is missing for production mode")
        
    try:
        response = await anthropic_client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        response_text = response.content[0].text.strip()
        
        # Prevent markdown parsing errors
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return json.loads(response_text.strip())
        
    except json.JSONDecodeError:
        return {"error": "JSON parse error", "raw": response_text if 'response_text' in locals() else ""}
    except Exception as e:
        err = str(e).lower()
        if "429" in str(e) or "rate" in err or "quota" in err or "overloaded" in err:
            return {"error": "Rate limit exceeded"}
        return {"error": f"API error: {str(e)}"}

async def _generate_with_gemini(prompt: str, system_prompt: str = SYSTEM_PROMPT) -> dict:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is missing for development mode")
        
    try:
        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            system_instruction=system_prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.7}
        )
        
        response = await model.generate_content_async(prompt)
        response_text = response.text
        
        return json.loads(response_text.strip())
        
    except json.JSONDecodeError:
        return {"error": "JSON parse error", "raw": response_text if 'response_text' in locals() else ""}
    except Exception as e:
        error_msg = str(e).lower()
        if "quota" in error_msg or "rate limit" in error_msg or "429" in error_msg:
            return {"error": "Rate limit exceeded"}
        return {"error": f"API error: {str(e)}"}

async def get_current_transits(ayanamsa_name="LAHIRI"):
    """Calculates today's Jupiter and Saturn positions for the prompt."""
    import swisseph as swe
    from datetime import datetime
    from core.chart_calculator import get_julian_day, RASHIS, AYANAMSA_MAP

    jd = get_julian_day(datetime.now())
    mode = AYANAMSA_MAP.get(ayanamsa_name.upper(), swe.SIDM_LAHIRI)
    swe.set_sid_mode(mode, 0, 0)
    
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    
    jup_pos, _ = swe.calc_ut(jd, swe.JUPITER, flags)
    sat_pos, _ = swe.calc_ut(jd, swe.SATURN, flags)
    
    return {
        "jupiter": RASHIS[int(jup_pos[0] / 30) % 12],
        "saturn": RASHIS[int(sat_pos[0] / 30) % 12]
    }

async def generate_astro_reading(
    planetary_data: dict,
    full_profile: dict,
    question: str,
    credits: int = 0,
    age: int = 41,
    rashi_override: str = "",
    previous_chat_history: list | None = None,
    question_number: int = 1
) -> dict:
    """
    Parses structured chart data and fills the expanded Nipurna system prompt.
    """
    chart_data = planetary_data # Use planetary_data directly
    profile_data = full_profile # Use AI-generated profile highlights

    # 1. Extract Basic Info
    planets = chart_data.get("Planets", {})
    lagna_sign = chart_data.get("Lagna", "Unknown")
    lagna_deg = chart_data.get("Lagna_degrees", "0").split("°")[0]
    
    # 2. Handle Dasha
    dasha_info = chart_data.get("Dasha_Detail", {})
    maha_lord = dasha_info.get("mahadasha", "Unknown")
    # Approximate dates
    md_start = "Active"
    md_end = f"in {dasha_info.get('years_remaining', 'few')} years"
    
    # 3. Get Transits
    transits = await get_current_transits(chart_data.get("ayanamsa", "LAHIRI"))

    # 4. Build Planet Mapping
    def get_p_data(name):
        p = planets.get(name, {})
        return {
            f"{name.lower()}_sign": p.get("rashi", "Unknown"),
            f"{name.lower()}_house": p.get("house", 0),
            f"{name.lower()}_deg": p.get("degrees", 0),
            f"{name.lower()}_retro": "true" if p.get("is_retrograde") else "false",
            f"{name.lower()}_combust": "true" if p.get("is_combust") else "false",
            f"{name.lower()}_nakshatra": chart_data.get("Moon_Nakshatra", "Unknown") if name == "Moon" else "N/A"
        }

    p_fields = {}
    for p_name in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]:
        p_fields.update(get_p_data(p_name))

    # 5. Format Final System Prompt
    import datetime as dt_mod
    nepal_now_dt = dt_mod.datetime.utcnow() + dt_mod.timedelta(hours=5, minutes=45)
    current_date_str = nepal_now_dt.strftime("%Y-%m-%d")

    try:
        system_prompt_formatted = SYSTEM_PROMPT.format(
            credits=credits,
            age=age,
            current_date=current_date_str,
            lagna_sign=lagna_sign,
            lagna_degree=lagna_deg,
            mahadasha_planet=maha_lord,
            md_start=md_start,
            md_end=md_end,
            antardasha_planet="Active Antardasha",
            ad_start="Current",
            ad_end="Varies",
            jupiter_transit_sign=transits["jupiter"],
            saturn_transit_sign=transits["saturn"],
            yoga_list=chart_data.get("Yoga", "None"),
            question_number=question_number,
            **p_fields
        )
    except KeyError as e:
        print(f"SYSTEM_PROMPT format error: Missing key {e}")
        return {"error": f"Internal Prompt Error: Missing field {e}"}

    prompt = (
        f"Verified User Chart Data:\n{json.dumps(chart_data, indent=2)}\n\n"
        f"Dashboard Profile Status:\n{json.dumps(profile_data, indent=2)}\n\n"
        f"Context: {rashi_override}\n\n"
        f"Previous Chat History:\n{json.dumps(previous_chat_history or [], indent=2, ensure_ascii=False)}\n\n"
        f"User Question:\n{question}\n\n"
        "Consistency Rule: If the user's current question is materially the same as an earlier one in the chat history, align with the prior answer unless the saved chart context clearly changed.\n\n"
        "Return ONLY the raw JSON response. Shubha Ashirwad."
    )
    
    if APP_ENV == "production":
        return await _generate_with_claude(prompt, system_prompt_formatted)
    else:
        return await _generate_with_gemini(prompt, system_prompt_formatted)

async def generate_dashboard_profile(chart_data: str, provided_rashi: str = None) -> dict:
    """
    Generates the strict Nepali dashboard profile fields using the AI.
    """
    data_json = json.loads(chart_data)
    ayanamsa_name = data_json.get("ayanamsa", "LAHIRI")
    
    rashi_instruction = f"\nCRITICAL INSTRUCTION: The user has explicitly stated their Rashi is '{provided_rashi}'. You MUST output exactly {provided_rashi} in the 'राशी' field, absolutely overriding any mathematical calculation for the Moon Sign.\n" if provided_rashi else ""

    system_prompt = f"""You are a highly analytical Vedic Astrologer.
You will receive raw Swiss Ephemeris celestial calculations using the {ayanamsa_name} Ayanamsa system.{rashi_instruction}
You MUST respond ONLY with a valid JSON object matching exactly these keys (in Nepali writing):
{{
  "नामको_अक्षर": "...",
  "राशी": "...",
  "राशी_स्वामी": "...",
  "शुभ_अङ्क": "...",
  "अशुभ_अङ्क": "...",
  "शुभ_रंग": "...",
  "अशुभ_रंग": "...",
  "शुभ_बार": "...",
  "अशुभ_बार": "...",
  "शुभ_दिशा": "...",
  "अशुभ_दिशा": "...",
  "नक्षत्र": "...",
  "योग": "...",
  "लग्न": "..."
}}
Note: Even small changes in planetary longitudes due to the {ayanamsa_name} system should be reflected in the Nakshatra, Pada, and potentially Rashi/Lagna. Fill in the values accurately based on the astrological data mathematically. Do not include any other text, Markdown formatting, or explanations outside the JSON object."""

    prompt = f"Chart Data (System: {ayanamsa_name}):\n{chart_data}\n\nReturn ONLY the JSON. No markdown ticks."
    
    result = await (
        _generate_with_claude(prompt, system_prompt)
        if APP_ENV == "production"
        else _generate_with_gemini(prompt, system_prompt)
    )
    if isinstance(result, dict) and result.get("error"):
        return result
    if isinstance(result, dict) and not str(result.get("राशी", "")).strip():
        return {"error": "Invalid dashboard JSON from model"}
    return result

async def generate_rashifal(chart_data: str, period: str) -> dict:
    """
    Generates Today, Weekly, or Monthly Rashifal based on User's full Kundali data.
    """
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    system_prompt = """You are Nipurna, an expert Nepali Jyotish. 
You provide hyper-personalized, ultra-specific Rashifal (Horoscope) derived rigorously from the user's exact birth chart (Kundali) data.
CRITICAL RULES FOR PERSONALIZATION:
1. NEVER write generic sun-sign or moon-sign horoscopes.
2. You MUST explicitly mention specific planetary combinations from their chart (e.g., their exact active Mahadasha/Antardasha, Lagna, and precise Bhava/House placements of planets).
3. Prove to the user that this is THEIR chart by saying things like, "तपाईंको लग्न X र हालको महादशा Y चलेको हुनाले..." or "तपाईंको Z भावमा Y ग्रहको उपस्थिति..."
4. Your tone is encouraging yet realistic, using deep traditional astrological wisdom.
You MUST respond ONLY with a valid JSON object."""

    if period == "today":
        period_desc = f"Today ({current_date})"
        json_structure = {
            "title": "आजको कुण्डली-आधारित राशिफल",
            "summary": "General overview for the day in Nepali",
            "health": "Health guidance in Nepali",
            "career": "Career and wealth guidance in Nepali",
            "love": "Love and family guidance in Nepali",
            "lucky_color": "Lucky color for today",
            "lucky_number": "Lucky number for today",
            "remedy": "A simple remedy (Upaya) for today"
        }
    elif period == "week":
        period_desc = "This Week"
        json_structure = {
            "title": "साप्ताहिक राशिफल (Weekly Rashifal)",
            "summary": "General overview for the week in Nepali",
            "health": "Health guidance for the week in Nepali",
            "career": "Career and wealth guidance for the week in Nepali",
            "love": "Love and family guidance for the week in Nepali",
            "remedy": "Weekly remedy (Upaya)"
        }
    else: # month
        period_desc = "This Month"
        json_structure = {
            "title": "मासिक राशिफल (Monthly Rashifal)",
            "summary": "General overview for the month in Nepali",
            "health": "Health guidance for the month in Nepali",
            "career": "Career and wealth guidance for the month in Nepali",
            "love": "Love and family guidance for the month in Nepali",
            "remedy": "Monthly remedy (Upaya)"
        }

    prompt = f"""Generate a hyper-personalized {period_desc} Rashifal based exclusively on this exact Kundali Data:
{chart_data}

The response must be in high-quality Devanagari Nepali.
Structure the response as a JSON object with the following keys: {list(json_structure.keys())}

MANDATORY ASTROLOGICAL EVIDENCE:
- Start the summary inherently weaving in their exact Lagna, Moon Rashi, and their specific active Mahadasha/Dasha.
- For Health, Career, and Love sections, justify your prediction by pointing to specific planets in specific houses (e.g., "पाँचौ भावमा अवस्थित X ग्रहको प्रभावले...").
- Ensure the content is spiritually grounded, scientifically derived from this exact math, and culturally relevant to Nepali users."""

    result = await (
        _generate_with_claude(prompt, system_prompt)
        if APP_ENV == "production"
        else _generate_with_gemini(prompt, system_prompt)
    )
    return result
