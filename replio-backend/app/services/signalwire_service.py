"""SignalWire integration service for call management."""
import httpx
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class SignalWireService:
    """Handle all SignalWire API calls and webhook events."""

    BASE_URL = f"https://{settings.SIGNALWIRE_SPACE}/api/relay/rest"
    AUTH = (settings.SIGNALWIRE_PROJECT_ID, settings.SIGNALWIRE_API_TOKEN)
    active_calls: Dict[str, Dict[str, Any]] = {}

    @classmethod
    async def initiate_call(cls, to_number: str, from_number: Optional[str] = None, call_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not from_number:
            from_number = settings.SIGNALWIRE_PHONE_NUMBER

        if settings.MOCK_SIGNALWIRE:
            call_sid = str(uuid.uuid4())
            cls.active_calls[call_sid] = {
                "sid": call_sid,
                "to": to_number,
                "from": from_number,
                "status": "initiated",
                "created_at": datetime.utcnow().isoformat(),
            }
            logger.info(f"[MOCK] Call initiated to {to_number} with SID {call_sid}")
            return {"sid": call_sid, "status": "initiated"}

        payload = {"to": to_number, "from": from_number, "url": f"{settings.APP_URL}/webhooks/signalwire/voice"}
        if call_data:
            payload.update(call_data)
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{cls.BASE_URL}/calls", json=payload, auth=cls.AUTH, timeout=10.0)
                if response.status_code in [200, 201]:
                    logger.info(f"Call initiated to {to_number}")
                    return response.json()
                else:
                    logger.error(f"Failed: {response.text}")
                    return {"error": response.text, "status": response.status_code}
        except Exception as e:
            logger.error(f"Exception: {str(e)}")
            return {"error": str(e)}

    @classmethod
    async def get_call(cls, call_sid: str) -> Dict[str, Any]:
        if settings.MOCK_SIGNALWIRE:
            if call_sid in cls.active_calls:
                return cls.active_calls[call_sid]
            return {"error": f"Call {call_sid} not found"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{cls.BASE_URL}/calls/{call_sid}", auth=cls.AUTH, timeout=10.0)
                return response.json() if response.status_code == 200 else {"error": response.text}
        except Exception as e:
            return {"error": str(e)}

    @classmethod
    async def hangup_call(cls, call_sid: str) -> Dict[str, Any]:
        if settings.MOCK_SIGNALWIRE:
            if call_sid in cls.active_calls:
                cls.active_calls[call_sid]["status"] = "completed"
                return {"success": True}
            return {"error": f"Call {call_sid} not found"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{cls.BASE_URL}/calls/{call_sid}", json={"status": "completed"}, auth=cls.AUTH, timeout=10.0)
                return {"success": response.status_code in [200, 204]}
        except Exception as e:
            return {"error": str(e)}

    @classmethod
    async def list_calls(cls, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        if settings.MOCK_SIGNALWIRE:
            calls_list = list(cls.active_calls.values())
            return {"calls": calls_list[offset:offset+limit]}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{cls.BASE_URL}/calls", params={"limit": limit, "offset": offset}, auth=cls.AUTH, timeout=10.0)
                return response.json() if response.status_code == 200 else {"error": response.text}
        except Exception as e:
            return {"error": str(e)}
