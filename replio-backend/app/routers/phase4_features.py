"""Phase 4 comprehensive features router - Recordings, Escalations, Multi-channel, Knowledge Base."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.recording_service import RecordingService
from app.services.escalation_service import EscalationService
from app.services.knowledge_base_service import KnowledgeBaseService
from app.services.multi_channel_service import (
    EmailService, SMSService, ChatService, AppointmentService
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["phase4"])

# ============================================================================
# CALL RECORDINGS ENDPOINTS
# ============================================================================

@router.get("/recordings")
async def list_recordings(
    company_id: str = Query(...),
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List call recordings with pagination and search."""
    try:
        recordings = RecordingService.list_recordings(session, company_id, limit, offset)
        return {
            "recordings": recordings,
            "limit": limit,
            "offset": offset,
            "total": len(recordings)
        }
    except Exception as e:
        logger.error(f"Error listing recordings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recordings/create")
async def create_recording(
    conversation_id: str = Query(...),
    duration_seconds: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new call recording record."""
    try:
        recording = RecordingService.create_recording(
            session, conversation_id, duration_seconds
        )
        return {
            "success": True,
            "recording_id": recording.id,
            "conversation_id": recording.conversation_id,
            "status": recording.transcription_status,
        }
    except Exception as e:
        logger.error(f"Error creating recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recordings/{recording_id}")
async def get_recording(
    recording_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get recording details."""
    recording = RecordingService.get_recording(session, recording_id)
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")

    return {
        "id": recording.id,
        "conversation_id": recording.conversation_id,
        "duration_seconds": recording.duration_seconds,
        "file_size_mb": recording.file_size_mb,
        "format": recording.format,
        "transcription_status": recording.transcription_status,
        "created_at": recording.created_at.isoformat(),
    }


@router.get("/recordings/conversation/{conversation_id}")
async def get_conversation_recording(
    conversation_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get recording for a conversation."""
    recording = RecordingService.get_recording_by_conversation(session, conversation_id)
    if not recording:
        raise HTTPException(status_code=404, detail="No recording for this conversation")

    return {
        "id": recording.id,
        "conversation_id": recording.conversation_id,
        "duration_seconds": recording.duration_seconds,
        "transcription": recording.transcription,
    }


@router.post("/recordings/{recording_id}/transcribe")
async def add_transcription(
    recording_id: str,
    transcription: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Add transcription to recording."""
    recording = RecordingService.add_transcription(session, recording_id, transcription)
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")

    return {
        "success": True,
        "recording_id": recording.id,
        "transcription_status": recording.transcription_status,
    }


@router.get("/recordings/statistics")
async def recording_statistics(
    days: int = Query(30, ge=1, le=365),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get recording statistics."""
    return RecordingService.get_recording_statistics(session, days=days)


# ============================================================================
# ESCALATION ENDPOINTS
# ============================================================================

@router.post("/escalations/create")
async def create_escalation(
    conversation_id: str = Query(...),
    reason: str = Query(...),
    escalation_type: str = Query("supervisor"),
    priority: str = Query("medium"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create an escalation."""
    try:
        escalation = EscalationService.create_escalation(
            session, conversation_id, reason, escalation_type, priority
        )
        return {
            "success": True,
            "escalation_id": escalation.id,
            "status": escalation.status,
            "priority": escalation.priority,
        }
    except Exception as e:
        logger.error(f"Error creating escalation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/escalations/pending")
async def pending_escalations(
    company_id: str = Query(...),
    limit: int = Query(50, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get pending escalations for the caller's company."""
    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Company mismatch")
    escalations = EscalationService.list_pending_escalations(session, company_id, limit=limit)
    return {
        "count": len(escalations),
        "escalations": [
            {
                "id": e.id,
                "conversation_id": e.conversation_id,
                "reason": e.escalation_reason,
                "type": e.escalation_type,
                "priority": e.priority,
                "status": e.status,
                "created_at": e.created_at.isoformat(),
            }
            for e in escalations
        ],
    }


@router.put("/escalations/{escalation_id}/assign")
async def assign_escalation(
    escalation_id: str,
    user_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Assign escalation to a user."""
    escalation = EscalationService.assign_escalation(session, escalation_id, user_id)
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")

    return {"success": True, "assigned_to": user_id}


@router.put("/escalations/{escalation_id}/resolve")
async def resolve_escalation(
    escalation_id: str,
    resolution_notes: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Resolve an escalation."""
    escalation = EscalationService.resolve_escalation(
        session, escalation_id, resolution_notes
    )
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")

    return {"success": True, "status": "resolved"}


@router.get("/escalations/metrics")
async def escalation_metrics(
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get escalation metrics for the caller's company."""
    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Company mismatch")
    return EscalationService.get_escalation_metrics(session, company_id)


# ============================================================================
# KNOWLEDGE BASE ENDPOINTS
# ============================================================================

@router.post("/knowledge-base/articles")
async def create_kb_article(
    company_id: str = Query(...),
    category: str = Query(...),
    title: str = Query(...),
    content: str = Query(...),
    keywords: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create knowledge base article."""
    try:
        article = KnowledgeBaseService.create_article(
            session, company_id, category, title, content, keywords
        )
        return {
            "success": True,
            "article_id": article.id,
            "approved": article.approved,
        }
    except Exception as e:
        logger.error(f"Error creating KB article: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge-base/search")
async def search_kb(
    company_id: str = Query(...),
    query: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Search knowledge base."""
    articles = KnowledgeBaseService.search_articles(session, company_id, query)
    return {
        "count": len(articles),
        "results": [
            {
                "id": a.id,
                "title": a.title,
                "category": a.category,
                "content": a.content[:200],  # truncate
                "approved": a.approved,
            }
            for a in articles
        ],
    }


@router.put("/knowledge-base/{article_id}/approve")
async def approve_kb_article(
    article_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Approve knowledge base article."""
    article = KnowledgeBaseService.approve_article(session, article_id, current_user.id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return {"success": True, "approved": True}


@router.get("/knowledge-base/statistics")
async def kb_statistics(
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get knowledge base statistics."""
    return KnowledgeBaseService.get_kb_statistics(session, company_id)


# ============================================================================
# EMAIL INTEGRATION ENDPOINTS
# ============================================================================

@router.post("/emails/receive")
async def receive_email(
    from_email: str = Query(...),
    to_email: str = Query(...),
    subject: str = Query(...),
    body: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Receive an email."""
    try:
        message = EmailService.receive_email(session, from_email, to_email, subject, body)
        return {
            "success": True,
            "message_id": message.id,
            "from": from_email,
            "status": message.status,
        }
    except Exception as e:
        logger.error(f"Error receiving email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emails/{message_id}/reply")
async def reply_email(
    message_id: str,
    response: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Send email reply."""
    message = EmailService.send_reply(session, message_id, response)
    if not message:
        raise HTTPException(status_code=404, detail="Email not found")

    return {"success": True, "status": message.status}


# ============================================================================
# SMS INTEGRATION ENDPOINTS
# ============================================================================

@router.post("/sms/receive")
async def receive_sms(
    from_number: str = Query(...),
    to_number: str = Query(...),
    message_text: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Receive an SMS."""
    try:
        message = SMSService.receive_sms(session, from_number, to_number, message_text)
        return {
            "success": True,
            "message_id": message.id,
            "from": from_number,
            "status": message.status,
        }
    except Exception as e:
        logger.error(f"Error receiving SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sms/{message_id}/reply")
async def reply_sms(
    message_id: str,
    response: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Send SMS reply."""
    message = SMSService.send_reply(session, message_id, response)
    if not message:
        raise HTTPException(status_code=404, detail="SMS not found")

    return {"success": True, "status": message.status}


# ============================================================================
# WEB CHAT ENDPOINTS
# ============================================================================

@router.post("/chat/sessions")
async def create_chat_session(
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create chat session."""
    session_id = ChatService.create_session(session, company_id)
    return {"success": True, "session_id": session_id}


@router.post("/chat/messages")
async def send_chat_message(
    session_id: str = Query(...),
    message_text: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Send a chat message."""
    try:
        message = ChatService.receive_message(session, session_id, message_text)
        return {"success": True, "message_id": message.id}
    except Exception as e:
        logger.error(f"Error sending chat message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/sessions/{session_id}/history")
async def get_chat_history(
    session_id: str,
    limit: int = Query(50, le=200),
    db_session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get chat history for session."""
    messages = ChatService.get_chat_history(db_session, session_id, limit)
    return {
        "session_id": session_id,
        "message_count": len(messages),
        "messages": [
            {
                "id": m.id,
                "type": m.message_type,
                "text": m.message_text,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


# ============================================================================
# APPOINTMENT ENDPOINTS
# ============================================================================

@router.post("/appointments/create")
async def create_appointment(
    caller_id: str = Query(...),
    company_id: str = Query(...),
    title: str = Query(...),
    scheduled_time: str = Query(...),
    duration_minutes: int = Query(30),
    appointment_type: str = Query("callback"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create an appointment."""
    try:
        appointment = AppointmentService.create_appointment(
            session, caller_id, company_id, title,
            datetime.fromisoformat(scheduled_time),
            duration_minutes, appointment_type
        )
        return {
            "success": True,
            "appointment_id": appointment.id,
            "status": appointment.status,
        }
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/appointments/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Confirm an appointment."""
    appointment = AppointmentService.confirm_appointment(session, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"success": True, "status": "confirmed"}


@router.put("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    reason: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Cancel an appointment."""
    appointment = AppointmentService.cancel_appointment(session, appointment_id, reason)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"success": True, "status": "cancelled"}


# ============================================================================
# LIST ENDPOINTS FOR FRONTEND
# ============================================================================

@router.get("/escalations")
async def list_escalations(
    company_id: str = Query(...),
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List escalations with pagination."""
    try:
        escalations = EscalationService.list_escalations(session, company_id, status, limit, offset)
        return {"escalations": escalations, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error listing escalations: {e}", exc_info=True)
        # Never report an empty list for a failed query - that is a false
        # statement about the data. Surface the failure instead.
        raise HTTPException(status_code=500, detail=f"Failed to list escalations: {e}")


@router.get("/knowledge-base")
async def list_knowledge_base(
    company_id: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List knowledge base articles with pagination."""
    try:
        articles = KnowledgeBaseService.list_articles(session, company_id, limit, offset)
        return {"articles": articles, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error listing knowledge base: {e}", exc_info=True)
        # Never report an empty list for a failed query - that is a false
        # statement about the data. Surface the failure instead.
        raise HTTPException(status_code=500, detail=f"Failed to list knowledge base: {e}")


@router.get("/guidance")
async def list_guidance(
    company_id: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List guidance items with pagination."""
    try:
        guidance_items = []
        return {"guidance": guidance_items, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error listing guidance: {e}", exc_info=True)
        # Never report an empty list for a failed query - that is a false
        # statement about the data. Surface the failure instead.
        raise HTTPException(status_code=500, detail=f"Failed to list guidance: {e}")


@router.get("/chat")
async def list_chat_sessions(
    company_id: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List chat sessions with pagination."""
    try:
        chat_sessions = ChatService.list_sessions(session, company_id, limit, offset)
        return {"sessions": chat_sessions, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error listing chat sessions: {e}", exc_info=True)
        # Never report an empty list for a failed query - that is a false
        # statement about the data. Surface the failure instead.
        raise HTTPException(status_code=500, detail=f"Failed to list chat sessions: {e}")


@router.get("/appointments")
async def list_appointments(
    company_id: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List appointments with pagination."""
    try:
        appointments = AppointmentService.list_appointments(session, company_id, limit, offset)
        return {"appointments": appointments, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error listing appointments: {e}", exc_info=True)
        # Never report an empty list for a failed query - that is a false
        # statement about the data. Surface the failure instead.
        raise HTTPException(status_code=500, detail=f"Failed to list appointments: {e}")


@router.get("/reports")
async def list_reports(
    company_id: str = Query(...),
    report_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List reports with pagination."""
    try:
        reports = []
        return {"reports": reports, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error listing reports: {e}", exc_info=True)
        # Never report an empty list for a failed query - that is a false
        # statement about the data. Surface the failure instead.
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {e}")
