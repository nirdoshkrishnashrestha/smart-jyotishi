from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import json

from core.models import QuestionInput
from database.schemas import User, BirthDetails, ChatHistory
from database.connection import get_db
from api.auth import get_current_user
from core.claude_service import generate_astro_reading
from core.chart_calculator import get_full_chart
from core.bs_converter import convert_bs_to_ad
import datetime

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.post("/ask")
async def ask_question(
    question_data: QuestionInput, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Authentic user and credit check
    if current_user.question_credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient question credits. Please top up your account."
        )
        
    # Get user's birth details
    result = await db.execute(
        select(BirthDetails).where(BirthDetails.user_id == current_user.id)
    )
    birth_details = result.scalars().first()
    
    if not birth_details:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Birth details not found. Please complete your astrological profile first."
        )
        
    # Generate mathematical chart with swiss ephemeris
    ad_date_midnight = convert_bs_to_ad(birth_details.bs_year, birth_details.bs_month, birth_details.bs_day)
    ad_datetime = datetime.datetime.combine(ad_date_midnight.date(), datetime.time(birth_details.birth_hour, birth_details.birth_minute))
    
    chart_data = get_full_chart(ad_datetime, birth_details.latitude, birth_details.longitude)
    
    # Format rigorously for the LLM
    chart_str = (
        f"Lagna: {chart_data['Lagna']}\n"
        f"Moon: {chart_data['Planets']['Moon']['rashi']} Rashi, {chart_data['Moon_Nakshatra']} Nakshatra\n"
        f"Current Dasha: {chart_data['Current_Dasha']}\n"
        "Planetary Positions (North Indian Whole Sign):\n"
    )
    for p, d in chart_data['Planets'].items():
        chart_str += f"{p}: {d['rashi']} (House {d['house']}, {d['longitude']} deg)\n"

    # Call the AI Jyotish service
    reading_json = await generate_astro_reading(chart_str, question_data.question)
    
    # Update credits (Deduct 1)
    current_user.question_credits -= 1
    
    # Save the history
    new_chat = ChatHistory(
        user_id=current_user.id,
        question=question_data.question,
        answer=json.dumps(reading_json),
        tokens_used=0  # Abstracted for now
    )
    db.add(new_chat)
    await db.commit()
    
    return reading_json
