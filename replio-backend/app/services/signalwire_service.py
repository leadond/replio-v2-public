import httpx
from app.core.config import settings

class SignalWireService:
    def __init__(self):
        self.project_id = settings.SIGNALWIRE_PROJECT_ID
        self.token = settings.SIGNALWIRE_API_TOKEN
        self.space = settings.SIGNALWIRE_SPACE
        self.base_url = f"https://{self.space}/api/relay/rest"

    async def make_call(self, to: str, from_num: str = None):
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/calls",
                auth=(self.project_id, self.token),
                json={"to": to, "from": from_num or settings.SIGNALWIRE_PHONE_NUMBER},
                timeout=30.0,
            )
            return r.json() if r.status_code in (200, 201) else {"error": r.text}

    async def get_call(self, call_sid: str):
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/calls/{call_sid}",
                auth=(self.project_id, self.token),
                timeout=10.0,
            )
            return r.json() if r.status_code == 200 else {"error": r.text}

    async def send_sms(self, to: str, body: str):
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/messages",
                auth=(self.project_id, self.token),
                json={"to": to, "from": settings.SIGNALWIRE_PHONE_NUMBER, "body": body},
                timeout=10.0,
            )
            return r.json() if r.status_code in (200, 201) else {"error": r.text}
