"""SignalWire integration service for call management.

All calls here hit the real SignalWire REST API. There is no simulation mode:
if credentials are missing or wrong, calls fail loudly rather than pretending
to succeed.
"""
import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class SignalWireConfigError(RuntimeError):
    """Raised when SignalWire credentials are absent or incomplete."""


class SignalWireService:
    """Handle all SignalWire API calls and webhook events."""

    REQUIRED_SETTINGS = (
        "SIGNALWIRE_PROJECT_ID",
        "SIGNALWIRE_API_TOKEN",
        "SIGNALWIRE_SPACE",
        "SIGNALWIRE_PHONE_NUMBER",
    )

    @classmethod
    def missing_settings(cls) -> list:
        return [name for name in cls.REQUIRED_SETTINGS if not getattr(settings, name, "")]

    @classmethod
    def is_configured(cls) -> bool:
        return not cls.missing_settings()

    @classmethod
    def _require_config(cls) -> None:
        missing = cls.missing_settings()
        if missing:
            raise SignalWireConfigError(
                "SignalWire is not configured. Missing: " + ", ".join(missing)
            )

    @classmethod
    def _base_url(cls) -> str:
        # Read at call time, not import time, so config changes take effect on reload.
        return f"https://{settings.SIGNALWIRE_SPACE}/api/relay/rest"

    @classmethod
    def _auth(cls) -> tuple:
        return (settings.SIGNALWIRE_PROJECT_ID, settings.SIGNALWIRE_API_TOKEN)

    @staticmethod
    def _error(response: httpx.Response) -> Dict[str, Any]:
        """Normalise an upstream failure. SignalWire returns HTML on 404, which is
        useless in an API response, so summarise instead of forwarding a web page."""
        body = (response.text or "").strip()
        content_type = response.headers.get("content-type", "")
        if "text/html" in content_type or body.lstrip().lower().startswith("<!doctype"):
            body = (
                f"SignalWire returned HTTP {response.status_code} (HTML error page). "
                "This usually means the space URL or credentials are wrong."
            )
        return {"error": body[:500], "status": response.status_code}

    @classmethod
    async def initiate_call(
        cls,
        to_number: str,
        from_number: Optional[str] = None,
        call_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        cls._require_config()
        if not from_number:
            from_number = settings.SIGNALWIRE_PHONE_NUMBER

        payload = {
            "to": to_number,
            "from": from_number,
            "url": f"{settings.APP_URL}/webhooks/signalwire/voice",
        }
        if call_data:
            payload.update(call_data)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{cls._base_url()}/calls", json=payload, auth=cls._auth(), timeout=10.0
                )
                if response.status_code in (200, 201):
                    logger.info(f"Call initiated to {to_number}")
                    return response.json()
                logger.error(f"SignalWire call failed ({response.status_code})")
                return cls._error(response)
        except SignalWireConfigError:
            raise
        except Exception as e:
            logger.error(f"SignalWire request error: {e}")
            return {"error": str(e)}

    @classmethod
    async def get_call(cls, call_sid: str) -> Dict[str, Any]:
        cls._require_config()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{cls._base_url()}/calls/{call_sid}", auth=cls._auth(), timeout=10.0
                )
                return response.json() if response.status_code == 200 else cls._error(response)
        except SignalWireConfigError:
            raise
        except Exception as e:
            return {"error": str(e)}

    @classmethod
    async def hangup_call(cls, call_sid: str) -> Dict[str, Any]:
        cls._require_config()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{cls._base_url()}/calls/{call_sid}",
                    json={"status": "completed"},
                    auth=cls._auth(),
                    timeout=10.0,
                )
                if response.status_code in (200, 204):
                    return {"success": True}
                return cls._error(response)
        except SignalWireConfigError:
            raise
        except Exception as e:
            return {"error": str(e)}

    @classmethod
    async def list_calls(cls, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        cls._require_config()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{cls._base_url()}/calls",
                    params={"limit": limit, "offset": offset},
                    auth=cls._auth(),
                    timeout=10.0,
                )
                return response.json() if response.status_code == 200 else cls._error(response)
        except SignalWireConfigError:
            raise
        except Exception as e:
            return {"error": str(e)}
