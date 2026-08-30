"""Conversation management service."""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models.conversation import Conversation
from app.models.message import Message

logger = logging.getLogger(__name__)


class ConversationService:
    """Handle conversation operations and analytics."""

    @staticmethod
    def create_conversation(
        session: Session,
        caller_id: str,
        company_id: str,
        call_sid: Optional[str] = None,
        **kwargs
    ) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            caller_id=caller_id,
            company_id=company_id,
            call_sid=call_sid,
            status="in_progress",
            **kwargs
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        return conversation

    @staticmethod
    def get_conversation(session: Session, conversation_id: str) -> Optional[Conversation]:
        """Get conversation by ID."""
        return session.get(Conversation, conversation_id)

    @staticmethod
    def end_conversation(
        session: Session,
        conversation_id: str,
        summary: Optional[str] = None,
        sentiment_score: Optional[float] = None
    ) -> Optional[Conversation]:
        """End a conversation."""
        conversation = session.get(Conversation, conversation_id)
        if conversation:
            conversation.status = "completed"
            conversation.ended_at = datetime.utcnow().isoformat()
            if summary:
                conversation.summary = summary
            if sentiment_score is not None:
                conversation.sentiment_score = sentiment_score
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
        return conversation

    @staticmethod
    def add_message(
        session: Session,
        conversation_id: str,
        role: str,
        content: str,
        **kwargs
    ) -> Message:
        """Add a message to a conversation."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            **kwargs
        )
        session.add(message)
        session.commit()
        session.refresh(message)
        return message

    @staticmethod
    def get_messages(
        session: Session,
        conversation_id: str,
        limit: int = 100
    ) -> List[Message]:
        """Get all messages in a conversation."""
        stmt = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).limit(limit)
        return session.exec(stmt).all()

    @staticmethod
    def get_conversation_stats(
        session: Session,
        company_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """Get conversation statistics."""
        since = datetime.utcnow() - timedelta(days=days)

        stmt = select(Conversation).where(
            (Conversation.company_id == company_id) &
            (Conversation.created_at >= since.isoformat())
        )
        conversations = session.exec(stmt).all()

        total_duration = sum(c.duration_seconds or 0 for c in conversations)
        avg_duration = total_duration / len(conversations) if conversations else 0
        completed = sum(1 for c in conversations if c.status == "completed")

        return {
            "total_conversations": len(conversations),
            "completed": completed,
            "in_progress": len(conversations) - completed,
            "total_duration_seconds": total_duration,
            "average_duration_seconds": avg_duration,
            "success_rate": (completed / len(conversations) * 100) if conversations else 0
        }

    @staticmethod
    def update_conversation(
        session: Session,
        conversation_id: str,
        **updates
    ) -> Optional[Conversation]:
        """Update conversation fields."""
        conversation = session.get(Conversation, conversation_id)
        if conversation:
            for key, value in updates.items():
                if hasattr(conversation, key) and value is not None:
                    setattr(conversation, key, value)
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
        return conversation
