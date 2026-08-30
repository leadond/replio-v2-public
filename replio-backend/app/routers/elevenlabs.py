from fastapi import APIRouter, Request, Response, HTTPException, Depends, Query
from sqlmodel import Session
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.elevenlabs_service import ElevenLabsService
from app.services.conversation_service import ConversationService
import httpx, json, logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/elevenlabs", tags=["elevenlabs"])


@router.post("/conversations/start", tags=["elevenlabs-agent"])
async def start_conversation(
    caller_id: str = Query(...),
    company_id: str = Query(...),
    agent_id: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Start a new ElevenLabs agent conversation."""
    try:
        service = ElevenLabsService(
            api_key=settings.ELEVENLABS_API_KEY,
            agent_id=agent_id or settings.ELEVENLABS_AGENT_ID
        )

        # Create database conversation record
        conv = ConversationService.create_conversation(
            session,
            caller_id=caller_id,
            company_id=company_id,
        )

        # Start ElevenLabs conversation
        elevenlabs_conv = await service.start_conversation()

        return {
            "conversation_id": conv.id,
            "elevenlabs_conversation_id": elevenlabs_conv.get("conversation_id"),
            "status": "active"
        }
    except Exception as e:
        logger.error(f"Error starting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/message", tags=["elevenlabs-agent"])
async def send_conversation_message(
    conversation_id: str,
    message: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Send a message in an ElevenLabs conversation."""
    try:
        conv = ConversationService.get_conversation(session, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        service = ElevenLabsService(
            api_key=settings.ELEVENLABS_API_KEY,
            agent_id=settings.ELEVENLABS_AGENT_ID
        )

        response = await service.send_message(conversation_id, message)

        # Store message in database
        ConversationService.add_message(session, conversation_id, "user", message)
        if response.get("message"):
            ConversationService.add_message(session, conversation_id, "assistant", response["message"])

        return response
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", tags=["elevenlabs-agent"])
async def get_conversation_details(
    conversation_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get conversation details from ElevenLabs."""
    try:
        service = ElevenLabsService(
            api_key=settings.ELEVENLABS_API_KEY,
            agent_id=settings.ELEVENLABS_AGENT_ID
        )

        details = await service.get_conversation(conversation_id)
        return details
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/transcript", tags=["elevenlabs-agent"])
async def get_conversation_transcript(
    conversation_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get conversation transcript from ElevenLabs."""
    try:
        service = ElevenLabsService(
            api_key=settings.ELEVENLABS_API_KEY,
            agent_id=settings.ELEVENLABS_AGENT_ID
        )

        transcript = await service.get_transcript(conversation_id)
        return transcript
    except Exception as e:
        logger.error(f"Error getting transcript: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/end", tags=["elevenlabs-agent"])
async def end_conversation(
    conversation_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """End an ElevenLabs conversation."""
    try:
        service = ElevenLabsService(
            api_key=settings.ELEVENLABS_API_KEY,
            agent_id=settings.ELEVENLABS_AGENT_ID
        )

        result = await service.end_conversation(conversation_id)

        # Update conversation in database
        ConversationService.end_conversation(session, conversation_id)

        return result
    except Exception as e:
        logger.error(f"Error ending conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Webhook endpoints
@router.post("/webhooks/conversation")
async def conversation_webhook(request: Request):
    """Handle ElevenLabs conversation webhooks."""
    payload = await request.json()
    event_type = payload.get("type", "unknown")
    logger.info(f"[ElevenLabs] Event: {event_type}")

    if event_type == "conversation_initiated":
        pass
    elif event_type == "post_call":
        pass

    return {"status": "ok"}


@router.post("/webhooks/tools")
async def tools_webhook(request: Request):
    """Handle ElevenLabs tool call webhooks."""
    payload = await request.json()
    tool_name = payload.get("tool_name", "")
    params = payload.get("parameters", {})
    logger.info(f"[ElevenLabs] Tool call: {tool_name} params={params}")

    if tool_name == "check_calendar":
        return {"result": "No conflicts found"}
    elif tool_name == "book_appointment":
        return {"result": "Appointment booked successfully"}

    return {"result": "unknown tool"}


@router.get("/agents")
async def list_agents(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List available ElevenLabs agents."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.elevenlabs.io/v1/convai/agents",
            headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
            timeout=10.0,
        )
        return r.json() if r.status_code == 200 else {"error": r.text, "status": r.status_code}
