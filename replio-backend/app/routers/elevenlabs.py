from fastapi import APIRouter, Request, Response, HTTPException, Depends
from sqlmodel import Session
from app.core.config import settings
from app.core.database import get_session
from app.services.elevenlabs_service import ElevenLabsService
import httpx, json

router = APIRouter(prefix="/webhooks/elevenlabs", tags=["elevenlabs"])

@router.post("/conversation")
async def conversation_webhook(request: Request):
    payload = await request.json()
    event_type = payload.get("type", "unknown")
    print(f"[ElevenLabs] Event: {event_type}")
    if event_type == "conversation_initiated":
        pass
    elif event_type == "post_call":
        pass
    return {"status": "ok"}

@router.post("/tools")
async def tools_webhook(request: Request):
    payload = await request.json()
    tool_name = payload.get("tool_name", "")
    params = payload.get("parameters", {})
    print(f"[ElevenLabs] Tool call: {tool_name} params={params}")
    if tool_name == "check_calendar":
        return {"result": "No conflicts found"}
    elif tool_name == "book_appointment":
        return {"result": "Appointment booked successfully"}
    return {"result": "unknown tool"}

@router.get("/agents")
async def list_agents():
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.elevenlabs.io/v1/convai/agents",
            headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
            timeout=10.0,
        )
        return r.json() if r.status_code == 200 else {"error": r.text, "status": r.status_code}
