"""
Deterministic Nepali-key profile when the LLM is unavailable or returns an error.
Keeps dashboard cards populated from Swiss Ephemeris chart data.
"""
import json
from typing import Any, Optional

# Vedic sign lords (Moon sign / Rashi swami)
RASHI_TO_LORD_NP = {
    "Mesh": "मङ्गल (Mars)",
    "Vrishabha": "शुक्र (Venus)",
    "Mithun": "बुध (Mercury)",
    "Karka": "चन्द्र (Moon)",
    "Simha": "सूर्य (Sun)",
    "Kanya": "बुध (Mercury)",
    "Tula": "शुक्र (Venus)",
    "Vrishchik": "मङ्गल (Mars)",
    "Dhanu": "बृहस्पति (Jupiter)",
    "Makar": "शनि (Saturn)",
    "Kumbha": "शनि (Saturn)",
    "Meen": "बृहस्पति (Jupiter)",
}


def _moon_rashi(chart_data: dict) -> str:
    return chart_data["Planets"]["Moon"]["rashi"]


def _lord_for_rashi(rashi_en: str) -> str:
    return RASHI_TO_LORD_NP.get(rashi_en, "—")


def is_valid_ai_profile(profile: Any) -> bool:
    """False if LLM returned an error payload or missing core fields."""
    if not isinstance(profile, dict):
        return False
    if profile.get("error"):
        return False
    if not str(profile.get("राशी", "")).strip():
        return False
    return True


def build_fallback_profile(
    chart_data: dict,
    provided_rashi: Optional[str],
    *,
    reason: str = "unknown",
) -> dict:
    moon_r = _moon_rashi(chart_data)
    rashi_display = (provided_rashi or "").strip() or moon_r
    msg = (
        "AI सेवा अस्थायी रूपमा उपलब्ध छैन (दर सीमा वा त्रुटि)। "
        "तारा-गणना अनुसारको आधारभूत विवरण मात्र देखाइएको छ। पूरा शुभाशुभ विवरणका लागि पछि प्रयास गर्नुहोस्।"
    )
    if reason == "rate_limit":
        msg = (
            "AI API को दर सीमा (rate limit) पुगेको हुन सक्छ। "
            "तारा-गणना अनुसारको आधारभूत विवरण मात्र देखाइएको छ। केही समयपछि जन्म विवरण पुन: सुरक्षित गर्नुहोस्।"
        )

    placeholder = "—"

    out = {
        "राशी": rashi_display,
        "राशी_स्वामी": _lord_for_rashi(moon_r),
        "लग्न": chart_data.get("Lagna", placeholder),
        "नक्षत्र": chart_data.get("Moon_Nakshatra", placeholder),
        "योग": chart_data.get("Current_Dasha", placeholder),
        "शुभ_अङ्क": placeholder,
        "अशुभ_अङ्क": placeholder,
        "शुभ_रंग": placeholder,
        "अशुभ_रंग": placeholder,
        "शुभ_बार": placeholder,
        "अशुभ_बार": placeholder,
        "शुभ_दिशा": placeholder,
        "अशुभ_दिशा": placeholder,
        "वर्ण": chart_data.get("Varna", placeholder),
        "वश्य": chart_data.get("Vashya", placeholder),
        "योनी": chart_data.get("Yoni", placeholder),
        "गण": chart_data.get("Gana", placeholder),
        "नाडी": chart_data.get("Nadi", placeholder),
        "_meta": {
            "ai_fallback": True,
            "reason": reason,
            "message_np": msg,
        },
    }
    return out


def parse_stored_profile(full_profile: Optional[str]) -> dict:
    if not full_profile:
        return {}
    try:
        return json.loads(full_profile)
    except json.JSONDecodeError:
        return {}
