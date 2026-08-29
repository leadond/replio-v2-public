from fastapi import APIRouter
from app.core.config import settings
import httpx

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    return {"status": "ok", "env": settings.APP_ENV}

@router.get("/health/llm")
async def llm_health():
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5.0)
            return {"ollama": "up" if r.status_code == 200 else "down", "status_code": r.status_code}
    except Exception as e:
        return {"ollama": "down", "error": str(e)}
