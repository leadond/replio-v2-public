"""
Local AI inference service integration for hybrid deployment.
Connects to OpenClaw (primary) and llama.cpp (fallback) on local machine.
"""
import httpx
import logging
from typing import Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class LocalAIService:
    """Hybrid inference service: OpenClaw primary, llama.cpp fallback."""

    def __init__(self, openclaw_url: str, llama_cpp_url: str, api_key: str):
        self.openclaw_url = openclaw_url
        self.llama_cpp_url = llama_cpp_url
        self.api_key = api_key
        self.timeout = 30.0

    def _headers(self) -> Dict[str, str]:
        """Return headers with API key auth."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=5))
    async def transcribe_call(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Transcribe call audio to text.
        Primary: OpenClaw (Qwen models - excellent for voice)
        Fallback: llama.cpp (LLaMA)
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.openclaw_url}/v1/audio/transcribe",
                    headers=self._headers(),
                    files={"audio": audio_data},
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.warning(f"OpenClaw transcription failed: {e}. Trying llama.cpp fallback.")
            return await self._fallback_transcribe(audio_data)

    async def _fallback_transcribe(self, audio_data: bytes) -> Dict[str, Any]:
        """Fallback transcription via llama.cpp."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.llama_cpp_url}/v1/audio/transcribe",
                    headers=self._headers(),
                    files={"audio": audio_data},
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"llama.cpp transcription also failed: {e}")
            raise

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=5))
    async def generate_response(self, prompt: str, context: Optional[str] = None) -> str:
        """
        Generate AI response for call handling, scheduling, guidance.
        Primary: OpenClaw (Qwen - excellent reasoning)
        Fallback: llama.cpp (LLaMA)
        """
        payload = {
            "prompt": prompt,
            "context": context,
            "temperature": 0.7,
            "max_tokens": 500,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.openclaw_url}/v1/completions",
                    headers=self._headers(),
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data.get("text", "").strip()
        except Exception as e:
            logger.warning(f"OpenClaw generation failed: {e}. Trying llama.cpp fallback.")
            return await self._fallback_generate(payload)

    async def _fallback_generate(self, payload: Dict[str, Any]) -> str:
        """Fallback response generation via llama.cpp."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.llama_cpp_url}/v1/completions",
                    headers=self._headers(),
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data.get("text", "").strip()
        except Exception as e:
            logger.error(f"llama.cpp generation also failed: {e}")
            raise

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=5))
    async def analyze_call(self, transcript: str, call_type: str) -> Dict[str, Any]:
        """
        Analyze call transcript for routing, scheduling, sentiment.
        Used for: routing decisions, appointment booking, escalation detection.
        """
        prompt = f"""Analyze this {call_type} call transcript:

{transcript}

Extract and return JSON:
{{
  "intent": "schedule|escalate|resolve|transfer",
  "sentiment": "positive|neutral|negative",
  "action": "description of recommended action",
  "confidence": 0.0-1.0,
  "key_points": ["point1", "point2"]
}}
"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.openclaw_url}/v1/completions",
                    headers=self._headers(),
                    json={
                        "prompt": prompt,
                        "temperature": 0.5,
                        "max_tokens": 300,
                    },
                )
                response.raise_for_status()
                data = response.json()
                text = data.get("text", "{}").strip()
                # Parse JSON from response
                import json
                return json.loads(text)
        except Exception as e:
            logger.warning(f"OpenClaw analysis failed: {e}. Trying llama.cpp fallback.")
            return await self._fallback_analyze(prompt)

    async def _fallback_analyze(self, prompt: str) -> Dict[str, Any]:
        """Fallback call analysis via llama.cpp."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.llama_cpp_url}/v1/completions",
                    headers=self._headers(),
                    json={
                        "prompt": prompt,
                        "temperature": 0.5,
                        "max_tokens": 300,
                    },
                )
                response.raise_for_status()
                data = response.json()
                text = data.get("text", "{}").strip()
                import json
                return json.loads(text)
        except Exception as e:
            logger.error(f"llama.cpp analysis also failed: {e}")
            raise

    async def health_check(self) -> Dict[str, bool]:
        """Check health of both services."""
        results = {
            "openclaw": False,
            "llama_cpp": False,
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{self.openclaw_url}/health")
                results["openclaw"] = r.status_code == 200
        except:
            pass

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{self.llama_cpp_url}/health")
                results["llama_cpp"] = r.status_code == 200
        except:
            pass

        return results
