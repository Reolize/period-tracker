"""
Chatbot API for Period Tracker
Context-Aware AI Assistant for menstrual health
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.user import User
from app.models.user_setup import UserSetup
from app.models.daily_log import DailyLog
from app.models.cycle import Cycle
from app.services.llm_service import LLMService, ChatMessage


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    response: str
    context_summary: dict


@router.post("/", response_model=ChatResponse)
def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Context-aware chat endpoint that extracts user data and generates AI response
    """
    try:
        # Extract user context
        context = extract_user_context(db, current_user.id)
        
        # Prepare conversation history
        history = request.conversation_history or []
        
        # Generate AI response
        ai_response = LLMService.generate_response(
            user_message=request.message,
            user_context=context,
            conversation_history=history
        )
        
        return ChatResponse(
            response=ai_response,
            context_summary={
                "cycle_day": context.get("cycle_day"),
                "pcos_mode": context.get("pcos_mode"),
                "recent_symptoms": context.get("recent_symptoms", [])[:3]
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")


def extract_user_context(db: Session, user_id: int) -> dict:
    """
    Extract relevant user context for the AI chatbot
    Includes: cycle info, recent symptoms, PCOS status, pronouns
    """
    context = {
        "user_id": user_id,
        "cycle_day": None,
        "pcos_mode": False,
        "pronouns": None,
        "recent_symptoms": [],
        "recent_moods": [],
        "current_cycle_start": None,
        "avg_cycle_length": None,
        "has_active_period": False,
    }
    
    # Get user setup (PCOS mode, pronouns, cycle preferences)
    user_setup = (
        db.query(UserSetup)
        .filter(UserSetup.user_id == user_id)
        .first()
    )
    
    if user_setup:
        context["pronouns"] = user_setup.pronouns
        context["pcos_mode"] = user_setup.has_pcos_or_irregular == "true"
        context["avg_cycle_length"] = user_setup.avg_cycle_length_days or 28
    
    # Get current cycle information
    current_cycle = (
        db.query(Cycle)
        .filter(Cycle.user_id == user_id)
        .order_by(Cycle.start_date.desc())
        .first()
    )
    
    if current_cycle:
        context["current_cycle_start"] = current_cycle.start_date
        
        # Calculate cycle day
        today = date.today()
        start_date = current_cycle.start_date
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        cycle_day = (today - start_date).days + 1
        context["cycle_day"] = max(1, cycle_day)
        
        # Check if currently on period
        if current_cycle.end_date:
            end_date = current_cycle.end_date
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            context["has_active_period"] = start_date <= today <= end_date
        else:
            # Ongoing period (no end date)
            context["has_active_period"] = True
    
    # Get recent daily logs (last 7 days)
    seven_days_ago = date.today() - timedelta(days=7)
    recent_logs = (
        db.query(DailyLog)
        .filter(DailyLog.user_id == user_id)
        .filter(DailyLog.log_date >= seven_days_ago)
        .order_by(DailyLog.log_date.desc())
        .all()
    )
    
    # Extract recent symptoms and moods
    all_symptoms = []
    all_moods = []
    recent_bleeding = None
    
    for log in recent_logs:
        if log.physical_symptoms:
            all_symptoms.extend(log.physical_symptoms)
        if log.moods:
            all_moods.extend(log.moods)
        if recent_bleeding is None and log.bleeding_flow and log.bleeding_flow != "none":
            recent_bleeding = log.bleeding_flow
    
    # Get unique symptoms/moods with frequency
    from collections import Counter
    
    symptom_counts = Counter(all_symptoms)
    mood_counts = Counter(all_moods)
    
    context["recent_symptoms"] = [
        {"symptom": s, "count": c} 
        for s, c in symptom_counts.most_common(5)
    ]
    context["recent_moods"] = [
        {"mood": m, "count": c} 
        for m, c in mood_counts.most_common(3)
    ]
    context["recent_bleeding"] = recent_bleeding
    
    return context
