import json
import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from database.connection import get_db
from database.schemas import User, AstroProfile, BirthDetails, ChatHistory
from api.auth import get_current_user
from core.claude_service import generate_astro_reading

router = APIRouter()

CHAT_LIMIT = 3
CHAT_WINDOW_HOURS = 24
CHAT_HISTORY_CONTEXT_LIMIT = 12
NEPAL_TZ = timezone(timedelta(hours=5, minutes=45))

class QuestionInput(BaseModel):
    question: str


def normalize_question(question: str) -> str:
    return re.sub(r"\s+", " ", (question or "")).strip().casefold()


def get_nepal_now() -> datetime:
    return datetime.now(NEPAL_TZ).replace(tzinfo=None)


def as_nepal_iso(dt: datetime | None) -> str | None:
    if not dt:
        return None
    return dt.replace(tzinfo=NEPAL_TZ).isoformat()


def parse_saved_answer(answer_text: str) -> dict:
    if not answer_text:
        return {"analysis": "", "prediction": "", "remedies": ""}

    try:
        parsed = json.loads(answer_text)
        if isinstance(parsed, dict):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass

    return {"analysis": str(answer_text), "prediction": "", "remedies": ""}


def serialize_chat_entry(chat: ChatHistory) -> dict:
    return {
        "id": chat.id,
        "question": chat.question,
        "answer": parse_saved_answer(chat.answer),
        "created_at": as_nepal_iso(chat.created_at),
    }


async def get_chat_limit_status(user_id: int, db: AsyncSession):
    window_start = get_nepal_now() - timedelta(hours=CHAT_WINDOW_HOURS)
    history_result = await db.execute(
        select(ChatHistory)
        .where(
            ChatHistory.user_id == user_id,
            ChatHistory.created_at >= window_start
        )
        .order_by(ChatHistory.created_at.asc())
    )
    recent_questions = history_result.scalars().all()
    questions_used = len(recent_questions)
    remaining_questions = max(0, CHAT_LIMIT - questions_used)
    locked_until = None

    if questions_used >= CHAT_LIMIT:
        locked_until = recent_questions[0].created_at + timedelta(hours=CHAT_WINDOW_HOURS)

    return {
        "questions_used": questions_used,
        "remaining_questions": remaining_questions,
        "is_locked": questions_used >= CHAT_LIMIT,
        "locked_until": as_nepal_iso(locked_until),
    }


async def get_user_chat_history(user_id: int, db: AsyncSession):
    history_result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.asc(), ChatHistory.id.asc())
    )
    return history_result.scalars().all()


@router.get("/status")
async def get_user_chat_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    limit_status = await get_chat_limit_status(current_user.id, db)
    return {
        "status": "success",
        **limit_status
    }


@router.get("/history")
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    history = await get_user_chat_history(current_user.id, db)
    
    grouped_dict = {}
    for chat in history:
        serialized = serialize_chat_entry(chat)
        # Extract just the YYYY-MM-DD from the ISO format
        date_str = serialized["created_at"][:10] if serialized["created_at"] else "Unknown Date"
        if date_str not in grouped_dict:
            grouped_dict[date_str] = []
        grouped_dict[date_str].append(serialized)
        
    # Convert to a list of dictionaries for easier frontend mapping
    grouped_history = [{"date": k, "chats": v} for k, v in grouped_dict.items()]
    
    # Sort by date descending (newest groups first)
    grouped_history.sort(key=lambda x: x["date"], reverse=True)

    return {
        "status": "success",
        "history": grouped_history
    }


@router.post("/ask")
async def ask_jyotishi(
    payload: QuestionInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    limit_status = await get_chat_limit_status(current_user.id, db)
    if limit_status["is_locked"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You have reached your 3-question limit for the last 24 hours. Please try again later.",
            headers={"Retry-After": str(CHAT_WINDOW_HOURS * 60 * 60)}
        )

    prior_chats = await get_user_chat_history(current_user.id, db)
    normalized_question = normalize_question(payload.question)
    matching_chat = next(
        (chat for chat in reversed(prior_chats) if normalize_question(chat.question) == normalized_question),
        None
    )

    # Fetch AstroProfile
    result = await db.execute(select(AstroProfile).where(AstroProfile.user_id == current_user.id))
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You must generate your cosmic profile in the Birth Details page first before asking questions."
        )

    # Fetch BirthDetails to check for manual Rashi
    bd_result = await db.execute(select(BirthDetails).where(BirthDetails.user_id == current_user.id))
    birth_details = bd_result.scalars().first()

    # Create the context string for the AI combining planetary details and their profile output
    rashi_override = f"User explicitly stated their Rashi is '{birth_details.provided_rashi}'. Use this for all references instead of Ephemeris. " if birth_details and getattr(birth_details, 'provided_rashi', None) else ""

    # Calculate Age
    age_display = "41 Years"  # Default fallback
    if birth_details and birth_details.ad_date:
        from datetime import datetime, timedelta
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

    if matching_chat:
        ai_response = parse_saved_answer(matching_chat.answer)
        reused_answer = True
    else:
        recent_history = [
            serialize_chat_entry(chat)
            for chat in prior_chats[-CHAT_HISTORY_CONTEXT_LIMIT:]
        ]

        # Call AI with structured data
        ai_response = await generate_astro_reading(
            planetary_data=profile.planetary_data,
            full_profile=json.loads(profile.full_profile) if profile.full_profile else {},
            question=payload.question,
            credits=limit_status["remaining_questions"],
            age=age_display,
            rashi_override=rashi_override,
            previous_chat_history=recent_history,
            question_number=len(prior_chats) + 1
        )
        reused_answer = False

        if "error" in ai_response:
            error_msg = ai_response["error"]
            if "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI सेवाको दर सीमा (rate limit) पुगेको छ। कृपया १ मिनेटपछि पुनः प्रयास गर्नुहोस्।"
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )

    new_chat = ChatHistory(
        user_id=current_user.id,
        question=payload.question,
        answer=json.dumps(ai_response, ensure_ascii=False),
        tokens_used=0,
        created_at=get_nepal_now()
    )
    db.add(new_chat)
    await db.commit()

    updated_limit_status = await get_chat_limit_status(current_user.id, db)

    # Return the clean JSON pieces containing analysis, prediction, remedies
    return {
        "status": "success",
        "answer": ai_response,
        "reused_answer": reused_answer,
        **updated_limit_status
    }
