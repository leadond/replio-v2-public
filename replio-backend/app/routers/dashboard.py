"""Dashboard and analytics endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from typing import Dict, Any, List
from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.conversation_service import ConversationService
from app.services.caller_service import CallerService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get overall dashboard statistics."""
    return AnalyticsService.get_dashboard_stats(session, company_id)


@router.get("/conversations/trends")
async def get_conversation_trends(
    company_id: str = Query(...),
    days: int = Query(7, ge=1, le=90),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get conversation trends."""
    return ConversationService.get_conversation_stats(session, company_id, days)


@router.get("/callers/top")
async def get_top_callers(
    company_id: str = Query(...),
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get top callers."""
    return AnalyticsService.get_top_callers(session, company_id, limit)


@router.get("/sentiment/trends")
async def get_sentiment_trends(
    company_id: str = Query(...),
    days: int = Query(7, ge=1, le=90),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get sentiment analysis trends."""
    return AnalyticsService.get_sentiment_trends(session, company_id, days)
