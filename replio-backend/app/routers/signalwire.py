from fastapi import APIRouter, Request, Response, HTTPException, Depends, Query
from sqlmodel import Session
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.database import get_session
from app.services.signalwire_service import SignalWireService
from app.routers.auth import get_current_user
from app.models.user import User
import httpx

router = APIRouter(prefix="/webhooks/signalwire", tags=["signalwire"])
calls_router = APIRouter(prefix="/calls", tags=["calls"])

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


# ============================================================================
# OUTBOUND CALLS ENDPOINTS
# ============================================================================

@calls_router.post("/initiate")
async def initiate_call(
    to_number: str = Query(...),
    from_number: Optional[str] = None,
    caller_id: Optional[str] = None,
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Initiate an outbound call to a phone number."""
    try:
        if not from_number:
            from_number = settings.SIGNALWIRE_PHONE_NUMBER

        result = await SignalWireService.initiate_call(to_number, from_number)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to initiate call"))

        return {
            "success": True,
            "call_id": result.get("sid"),
            "to_number": to_number,
            "from_number": from_number,
            "status": result.get("status"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@calls_router.get("/list")
async def list_calls(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List recent calls."""
    try:
        calls = await SignalWireService.list_calls(limit, offset)
        return calls
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@calls_router.post("/{call_id}/hangup")
async def hangup_call(
    call_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """End an ongoing call."""
    try:
        result = await SignalWireService.hangup_call(call_id)

        if result.get("success"):
            return {"success": True, "message": f"Call {call_id} ended"}
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to hangup call"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@calls_router.get("/{call_id}")
async def get_call_status(
    call_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get the status of a specific call."""
    try:
        call_info = await SignalWireService.get_call(call_id)
        if "error" in call_info:
            raise HTTPException(status_code=404, detail=call_info.get("error"))
        return call_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
