"""
Local AI integration endpoints for Replio hybrid deployment.
Routes call audio and text through OpenClaw/llama.cpp.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session
from typing import Optional
import logging

from app.core.config import settings
from app.core.database import get_session
from app.models.user import User
from app.auth import get_current_user
from app.services.local_ai_service import LocalAIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

# Initialize local AI service (if enabled)
local_ai: Optional[LocalAIService] = None
if settings.LOCAL_AI_ENABLED:
    local_ai = LocalAIService(
        openclaw_url=settings.OPENCLAW_URL,
        llama_cpp_url=settings.LLAMA_CPP_URL,
        api_key=settings.LOCAL_AI_API_KEY,
    )
    logger.info("✓ Local AI service initialized (OpenClaw + llama.cpp fallback)")
else:
    logger.info("⊘ Local AI service disabled. Set LOCAL_AI_ENABLED=true to enable.")


@router.get("/health")
async def health_check():
    """Check health of local AI services."""
    if not local_ai:
        return {"status": "disabled"}

    health = await local_ai.health_check()
    return {
        "status": "ok" if any(health.values()) else "degraded",
        "services": health,
    }


@router.post("/transcribe")
async def transcribe_call_audio(
    file: UploadFile = File(...),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe call audio using local AI (OpenClaw primary, llama.cpp fallback).
    Used for: Converting voice to text for call analysis.
    """
    if not local_ai:
        raise HTTPException(status_code=503, detail="Local AI service not configured")

    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        # Read audio file
        audio_data = await file.read()

        # Transcribe via local AI
        result = await local_ai.transcribe_call(audio_data)

        logger.info(f"Transcribed call audio for {company_id}")
        return {
            "success": True,
            "transcription": result.get("text", ""),
            "confidence": result.get("confidence", 0.0),
        }
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")


@router.post("/call-analysis")
async def analyze_call(
    transcript: str = Query(...),
    call_type: str = Query(..., description="inbound|outbound|scheduled"),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze call transcript for routing, sentiment, scheduling decisions.
    Returns: intent, sentiment, recommended action, confidence.
    """
    if not local_ai:
        raise HTTPException(status_code=503, detail="Local AI service not configured")

    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        analysis = await local_ai.analyze_call(transcript, call_type)

        logger.info(f"Analyzed call ({call_type}) for {company_id}: {analysis.get('intent')}")
        return {
            "success": True,
            "analysis": analysis,
        }
    except Exception as e:
        logger.error(f"Call analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Call analysis failed")


@router.post("/generate-response")
async def generate_ai_response(
    prompt: str = Query(...),
    context: Optional[str] = Query(None),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI response for:
    - Call greeting/routing prompts
    - Appointment scheduling replies
    - Customer guidance
    - Escalation handling
    """
    if not local_ai:
        raise HTTPException(status_code=503, detail="Local AI service not configured")

    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        response = await local_ai.generate_response(prompt, context)

        logger.info(f"Generated AI response for {company_id}")
        return {
            "success": True,
            "response": response,
        }
    except Exception as e:
        logger.error(f"Response generation failed: {e}")
        raise HTTPException(status_code=500, detail="Response generation failed")


@router.post("/schedule-appointment")
async def schedule_with_ai(
    call_transcript: str = Query(...),
    customer_name: str = Query(...),
    preferred_times: Optional[str] = Query(None),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Use AI to parse call transcript and suggest appointment times.
    AI extracts: service needed, preferred date/time, customer preferences.
    """
    if not local_ai:
        raise HTTPException(status_code=503, detail="Local AI service not configured")

    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        prompt = f"""Parse this customer call and extract appointment details:

Customer: {customer_name}
Call transcript: {call_transcript}
Preferred times: {preferred_times or "Not specified"}

Extract and return JSON:
{{
  "service": "what service/product they need",
  "duration_minutes": 30,
  "suggested_dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "suggested_times": ["HH:MM", "HH:MM"],
  "notes": "any special requirements",
  "confidence": 0.0-1.0
}}
"""

        response = await local_ai.generate_response(prompt)

        logger.info(f"Generated appointment suggestion for {company_id}")
        return {
            "success": True,
            "appointment_suggestion": response,
        }
    except Exception as e:
        logger.error(f"Appointment scheduling failed: {e}")
        raise HTTPException(status_code=500, detail="Scheduling failed")


@router.post("/escalation-detection")
async def detect_escalation(
    transcript: str = Query(...),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze transcript to detect if customer should be escalated.
    Identifies: frustration level, unresolved issues, special requests.
    """
    if not local_ai:
        raise HTTPException(status_code=503, detail="Local AI service not configured")

    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        prompt = f"""Analyze this customer service call for escalation needs:

{transcript}

Return JSON:
{{
  "should_escalate": true/false,
  "escalation_reason": "if should_escalate is true",
  "frustration_level": 1-10,
  "unresolved_issues": ["issue1", "issue2"],
  "recommended_action": "transfer to agent|send to specialist|resolve",
  "confidence": 0.0-1.0
}}
"""

        response = await local_ai.generate_response(prompt)

        logger.info(f"Escalation detection for {company_id}")
        return {
            "success": True,
            "escalation_assessment": response,
        }
    except Exception as e:
        logger.error(f"Escalation detection failed: {e}")
        raise HTTPException(status_code=500, detail="Escalation detection failed")
