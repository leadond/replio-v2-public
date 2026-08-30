"""Caller management service."""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlmodel import Session, select, func
from app.models.caller import Caller
from app.models.conversation import Conversation

logger = logging.getLogger(__name__)


class CallerService:
    """Handle caller operations and analytics."""

    @staticmethod
    def create_or_update_caller(session: Session, phone_number: str, company_id: str, **kwargs) -> Caller:
        stmt = select(Caller).where((Caller.phone_number == phone_number) & (Caller.company_id == company_id))
        caller = session.exec(stmt).first()
        if caller:
            for key, value in kwargs.items():
                if hasattr(caller, key) and value is not None:
                    setattr(caller, key, value)
        else:
            caller = Caller(phone_number=phone_number, company_id=company_id, **kwargs)
        session.add(caller)
        session.commit()
        session.refresh(caller)
        return caller

    @staticmethod
    def get_caller_history(session: Session, caller_id: str, limit: int = 50) -> List[Conversation]:
        stmt = select(Conversation).where(Conversation.caller_id == caller_id).order_by(Conversation.created_at.desc()).limit(limit)
        return session.exec(stmt).all()

    @staticmethod
    def get_caller_stats(session: Session, caller_id: str) -> Dict[str, Any]:
        conversations = session.exec(select(Conversation).where(Conversation.caller_id == caller_id)).all()
        total_duration = sum(c.duration_seconds or 0 for c in conversations)
        avg_duration = total_duration / len(conversations) if conversations else 0
        return {
            "total_calls": len(conversations),
            "total_duration_seconds": total_duration,
            "average_duration_seconds": avg_duration,
            "last_call": max((c.created_at for c in conversations), default=None)
        }

    @staticmethod
    def block_caller(session: Session, caller_id: str) -> Optional[Caller]:
        caller = session.get(Caller, caller_id)
        if caller:
            caller.is_blocked = True
            session.add(caller)
            session.commit()
            session.refresh(caller)
        return caller
