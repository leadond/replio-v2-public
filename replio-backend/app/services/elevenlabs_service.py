import httpx
from app.core.config import settings

class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.agent_id = settings.ELEVENLABS_AGENT_ID
        self.base_url = "https://api.elevenlabs.io/v1"

    async def get_agent(self):
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/convai/agents/{self.agent_id}",
                headers={"xi-api-key": self.api_key},
                timeout=10.0,
            )
            return r.json() if r.status_code == 200 else {"error": r.text}

    async def create_conversation(self, caller_number: str):
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/convai/conversation",
                headers={"xi-api-key": self.api_key},
                json={"agent_id": self.agent_id, "caller_number": caller_number},
                timeout=10.0,
            )
            return r.json() if r.status_code in (200, 201) else {"error": r.text}

    async def get_conversation(self, conversation_id: str):
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/convai/conversation/{conversation_id}",
                headers={"xi-api-key": self.api_key},
                timeout=10.0,
            )
            return r.json() if r.status_code == 200 else {"error": r.text}
