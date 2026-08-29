import httpx, json, os
from app.core.config import settings
from tenacity import retry, stop_after_attempt, wait_exponential

class LLMService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL
        self.ollama_model = settings.OLLAMA_MODEL
        self.openai_key = settings.OPENAI_API_KEY

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate(self, prompt: str, system_prompt: str = None, temperature: float = 0.7) -> str:
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": self.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": temperature},
                }
                if system_prompt:
                    payload["system"] = system_prompt
                r = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json=payload,
                    timeout=60.0,
                )
                if r.status_code == 200:
                    data = r.json()
                    return data.get("response", "")
        except Exception as e:
            print(f"[LLM] Ollama failed: {e}")

        if self.openai_key:
            try:
                async with httpx.AsyncClient() as client:
                    messages = [{"role": "user", "content": prompt}]
                    if system_prompt:
                        messages.insert(0, {"role": "system", "content": system_prompt})
                    r = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"},
                        json={"model": "gpt-3.5-turbo", "messages": messages, "temperature": temperature},
                        timeout=30.0,
                    )
                    if r.status_code == 200:
                        return r.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[LLM] OpenAI failed: {e}")

        return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again."

    async def summarize(self, text: str) -> str:
        prompt = f"Summarize the following conversation in 2-3 sentences:

{text}"
        return await self.generate(prompt, temperature=0.3)

    async def analyze_sentiment(self, text: str) -> float:
        prompt = f"Rate the sentiment of this text from -1 (very negative) to 1 (very positive). Respond with ONLY a number.

{text}"
        result = await self.generate(prompt, temperature=0.1)
        try:
            return float(result.strip())
        except:
            return 0.0
