"""ElevenLabs AI Agent integration service."""
import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class ElevenLabsService:
    """Handle ElevenLabs Agent API calls."""

    BASE_URL = "https://api.elevenlabs.io"

    def __init__(self, api_key: Optional[str] = None, agent_id: Optional[str] = None):
        self.api_key = api_key or settings.ELEVENLABS_API_KEY
        self.agent_id = agent_id or settings.ELEVENLABS_AGENT_ID
        self.headers = {"xi-api-key": self.api_key}

    async def start_conversation(self, caller_id: Optional[str] = None) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.BASE_URL}/convai/conversation/start_session", headers=self.headers, json={"agent_id": self.agent_id}, timeout=10.0)
                if response.status_code == 200:
                    logger.info(f"Conversation started for caller: {caller_id}")
                    return response.json()
                else:
                    logger.error(f"Failed: {response.text}")
                    return {"error": response.text, "status": response.status_code}
        except Exception as e:
            return {"error": str(e)}

    async def send_message(self, conversation_id: str, message: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.BASE_URL}/convai/conversation/{conversation_id}/message", headers=self.headers, json={"message": message}, timeout=10.0)
                return response.json() if response.status_code == 200 else {"error": response.text}
        except Exception as e:
            return {"error": str(e)}

    async def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.BASE_URL}/convai/conversation/{conversation_id}", headers=self.headers, timeout=10.0)
                return response.json() if response.status_code == 200 else {"error": response.text}
        except Exception as e:
            return {"error": str(e)}

    async def end_conversation(self, conversation_id: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.BASE_URL}/convai/conversation/{conversation_id}/end", headers=self.headers, timeout=10.0)
                return {"success": response.status_code in [200, 204]}
        except Exception as e:
            return {"error": str(e)}
