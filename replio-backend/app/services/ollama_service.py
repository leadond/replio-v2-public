"""OLLAMA LLM service for local AI processing."""
import logging
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaService:
    """Handle OLLAMA LLM operations locally."""

    BASE_URL = "http://localhost:11434"
    DEFAULT_MODEL = "llama3.2:3b"
    REQUEST_TIMEOUT = 30.0

    @classmethod
    async def check_health(cls) -> Dict[str, Any]:
        """Check if OLLAMA is running and accessible."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{cls.BASE_URL}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "healthy",
                        "base_url": cls.BASE_URL,
                        "model": cls.DEFAULT_MODEL,
                        "available_models": [m.get("name") for m in data.get("models", [])],
                    }
                else:
                    return {"status": "unhealthy", "error": response.text}
        except Exception as e:
            logger.error(f"OLLAMA health check failed: {e}")
            return {"status": "unreachable", "error": str(e)}

    @classmethod
    async def generate(
        cls,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """Generate text using OLLAMA."""
        model = model or cls.DEFAULT_MODEL

        try:
            async with httpx.AsyncClient(timeout=cls.REQUEST_TIMEOUT) as client:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": stream,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 512,
                    },
                }

                if system:
                    payload["system"] = system

                response = await client.post(
                    f"{cls.BASE_URL}/api/generate",
                    json=payload,
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "response": data.get("response", ""),
                        "model": model,
                        "tokens": data.get("eval_count", 0),
                    }
                else:
                    logger.error(f"OLLAMA generation failed: {response.text}")
                    return {"success": False, "error": response.text}

        except Exception as e:
            logger.error(f"OLLAMA generation error: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    async def summarize(
        cls,
        text: str,
        max_length: int = 150,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Summarize text using OLLAMA."""
        model = model or cls.DEFAULT_MODEL

        prompt = f"""Summarize the following text in {max_length} words or less.
Return only the summary, no additional text.

Text: {text}

Summary:"""

        result = await cls.generate(prompt, model=model)

        if result.get("success"):
            return {
                "success": True,
                "summary": result.get("response", "").strip(),
                "model": model,
            }
        else:
            return {"success": False, "error": result.get("error")}

    @classmethod
    async def analyze_sentiment(
        cls,
        text: str,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze sentiment of text using OLLAMA."""
        model = model or cls.DEFAULT_MODEL

        prompt = f"""Analyze the sentiment of the following text and respond with ONLY a JSON object in this format:
{{"sentiment": "positive|negative|neutral", "score": 0.0-1.0, "confidence": 0.0-1.0}}

Text: {text}

Response:"""

        result = await cls.generate(prompt, model=model)

        if result.get("success"):
            try:
                import json
                response_text = result.get("response", "").strip()
                # Extract JSON from response
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start >= 0 and end > start:
                    json_str = response_text[start:end]
                    sentiment_data = json.loads(json_str)
                    return {
                        "success": True,
                        "sentiment": sentiment_data.get("sentiment", "neutral"),
                        "score": float(sentiment_data.get("score", 0.5)),
                        "confidence": float(sentiment_data.get("confidence", 0.8)),
                        "model": model,
                    }
            except Exception as e:
                logger.error(f"Sentiment parsing error: {e}")

            return {
                "success": True,
                "sentiment": "neutral",
                "score": 0.5,
                "confidence": 0.5,
                "model": model,
                "note": "Could not parse detailed response",
            }
        else:
            return {"success": False, "error": result.get("error")}

    @classmethod
    async def detect_intent(
        cls,
        text: str,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Detect intent from text using OLLAMA."""
        model = model or cls.DEFAULT_MODEL

        prompt = f"""Analyze the following customer service text and detect the primary intent.
Respond with ONLY one of these intents: support, billing, complaint, compliment, question, other

Text: {text}

Intent:"""

        result = await cls.generate(prompt, model=model)

        if result.get("success"):
            intent = result.get("response", "").strip().lower()
            valid_intents = ["support", "billing", "complaint", "compliment", "question", "other"]

            detected_intent = next(
                (i for i in valid_intents if i in intent),
                "other"
            )

            return {
                "success": True,
                "intent": detected_intent,
                "raw_response": result.get("response", "").strip(),
                "model": model,
            }
        else:
            return {"success": False, "error": result.get("error")}

    @classmethod
    async def answer_question(
        cls,
        question: str,
        context: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Answer a question using OLLAMA, optionally with context."""
        model = model or cls.DEFAULT_MODEL

        if context:
            prompt = f"""Using the following context, answer the question concisely in 1-2 sentences.

Context: {context}

Question: {question}

Answer:"""
        else:
            prompt = f"""Answer the following question concisely in 1-2 sentences.

Question: {question}

Answer:"""

        result = await cls.generate(prompt, model=model)

        if result.get("success"):
            return {
                "success": True,
                "answer": result.get("response", "").strip(),
                "model": model,
            }
        else:
            return {"success": False, "error": result.get("error")}

    @classmethod
    async def extract_entities(
        cls,
        text: str,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Extract named entities from text."""
        model = model or cls.DEFAULT_MODEL

        prompt = f"""Extract named entities (names, dates, locations, organizations) from the following text.
Respond with a JSON object where keys are entity types and values are lists.

Text: {text}

Entities:"""

        result = await cls.generate(prompt, model=model)

        if result.get("success"):
            try:
                import json
                response_text = result.get("response", "").strip()
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start >= 0 and end > start:
                    json_str = response_text[start:end]
                    entities = json.loads(json_str)
                    return {
                        "success": True,
                        "entities": entities,
                        "model": model,
                    }
            except Exception as e:
                logger.error(f"Entity extraction parsing error: {e}")

            return {
                "success": True,
                "entities": {},
                "model": model,
                "note": "Could not parse entity response",
            }
        else:
            return {"success": False, "error": result.get("error")}
