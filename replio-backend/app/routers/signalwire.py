from fastapi import APIRouter, Request, Response, HTTPException, Depends
from sqlmodel import Session
from app.core.config import settings
from app.core.database import get_session
from app.services.signalwire_service import SignalWireService
import httpx

router = APIRouter(prefix="/webhooks/signalwire", tags=["signalwire"])

@router.post("/voice")
async def voice_webhook(request: Request):
    body = await request.form()
    from_num = body.get("From", "")
    to_num = body.get("To", "")
    call_sid = body.get("CallSid", "")
    print(f"[SignalWire] Incoming call from {from_num} to {to_num} sid={call_sid}")
    xml_response = f'''<Response>
    <Connect>
        <Stream url="{settings.APP_URL}/webhooks/signalwire/stream">
            <Parameter name="call_sid" value="{call_sid}"/>
            <Parameter name="from" value="{from_num}"/>
        </Stream>
    </Connect>
</Response>'''
    return Response(content=xml_response, media_type="application/xml")

@router.post("/stream")
async def stream_webhook(request: Request):
    data = await request.json()
    print(f"[SignalWire] Stream event: {data.get('event')}")
    return {"status": "ok"}

@router.post("/status")
async def status_webhook(request: Request):
    data = await request.json()
    print(f"[SignalWire] Status: {data}")
    return {"status": "ok"}

@router.post("/recording")
async def recording_webhook(request: Request):
    data = await request.json()
    print(f"[SignalWire] Recording: {data}")
    return {"status": "ok"}

@router.get("/numbers")
async def list_numbers():
    async with httpx.AsyncClient() as client:
        url = f"https://{settings.SIGNALWIRE_SPACE}/api/relay/rest/phone_numbers"
        r = await client.get(
            url,
            auth=(settings.SIGNALWIRE_PROJECT_ID, settings.SIGNALWIRE_API_TOKEN),
            timeout=10.0,
        )
        return r.json() if r.status_code == 200 else {"error": r.text, "status": r.status_code}
