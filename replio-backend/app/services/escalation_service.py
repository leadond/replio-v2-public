"""Escalation management service."""
import logging
import uuid
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Session, select
from app.models.escalation import Escalation

logger = logging.getLogger(__name__)


class EscalationService:
    """Handle escalation operations."""

    @staticmethod
    def create_escalation(
        session: Session,
        conversation_id: str,
        reason: str,
        escalation_type: str = "supervisor",
        priority: str = "medium",
        caller_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Escalation:
        """Create a new escalation."""
        escalation = Escalation(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            caller_id=caller_id,
            escalation_reason=reason,
            escalation_type=escalation_type,
            priority=priority,
            status="pending",
            escalation_metadata=json.dumps(metadata) if metadata else None,
        )

        session.add(escalation)
        session.commit()
        session.refresh(escalation)

        logger.info(
            f"Escalation created: {escalation.id} "
            f"(conv: {conversation_id}, type: {escalation_type})"
        )

        return escalation

    @staticmethod
    def get_escalation(session: Session, escalation_id: str) -> Optional[Escalation]:
        """Get escalation by ID."""
        return session.get(Escalation, escalation_id)

    @staticmethod
    def list_pending_escalations(
        session: Session,
        user_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[Escalation]:
        """List pending escalations."""
        stmt = select(Escalation).where(Escalation.status == "pending")

        if user_id:
            stmt = stmt.where(Escalation.assigned_to_user_id == user_id)

        stmt = stmt.order_by(Escalation.priority.desc()).limit(limit)

        return session.exec(stmt).all()

    @staticmethod
    def assign_escalation(
        session: Session,
        escalation_id: str,
        user_id: str,
    ) -> Optional[Escalation]:
        """Assign escalation to a user."""
        escalation = session.get(Escalation, escalation_id)
        if escalation:
            escalation.assigned_to_user_id = user_id
            escalation.status = "in_progress"
            session.add(escalation)
            session.commit()
            session.refresh(escalation)
            logger.info(f"Escalation {escalation_id} assigned to {user_id}")

        return escalation

    @staticmethod
    def resolve_escalation(
        session: Session,
        escalation_id: str,
        resolution_notes: str,
    ) -> Optional[Escalation]:
        """Resolve an escalation."""
        escalation = session.get(Escalation, escalation_id)
        if escalation:
            escalation.status = "resolved"
            escalation.resolved_at = datetime.utcnow()
            escalation.resolution_notes = resolution_notes
            session.add(escalation)
            session.commit()
            session.refresh(escalation)
            logger.info(f"Escalation {escalation_id} resolved")

        return escalation

    @staticmethod
    def list_escalations_by_conversation(
        session: Session,
        conversation_id: str,
    ) -> List[Escalation]:
        """Get all escalations for a conversation."""
        stmt = select(Escalation).where(
            Escalation.conversation_id == conversation_id
        ).order_by(Escalation.created_at.desc())

        return session.exec(stmt).all()

    @staticmethod
    def get_escalation_metrics(
        session: Session,
        company_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get escalation statistics."""
        pending = session.exec(
            select(Escalation).where(Escalation.status == "pending")
        ).all()

        in_progress = session.exec(
            select(Escalation).where(Escalation.status == "in_progress")
        ).all()

        resolved = session.exec(
            select(Escalation).where(Escalation.status == "resolved")
        ).all()

        # Count by priority
        critical = sum(1 for e in (pending + in_progress) if e.priority == "critical")
        high = sum(1 for e in (pending + in_progress) if e.priority == "high")

        return {
            "total_pending": len(pending),
            "total_in_progress": len(in_progress),
            "total_resolved": len(resolved),
            "critical_pending": critical,
            "high_pending": high,
            "average_resolution_time": "pending",  # calculated from timestamps
            "by_type": {
                "supervisor": sum(1 for e in (pending + in_progress) if e.escalation_type == "supervisor"),
                "transfer": sum(1 for e in (pending + in_progress) if e.escalation_type == "transfer"),
                "callback": sum(1 for e in (pending + in_progress) if e.escalation_type == "callback"),
                "specialist": sum(1 for e in (pending + in_progress) if e.escalation_type == "specialist"),
            }
        }

    @staticmethod
    def list_escalations(
        session: Session,
        company_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Escalation]:
        """List escalations for a company.

        Escalation has no company_id of its own - it is scoped through the
        conversation it belongs to, so this joins rather than filtering directly.
        """
        from app.models.conversation import Conversation

        stmt = (
            select(Escalation)
            .join(Conversation, Conversation.id == Escalation.conversation_id)
            .where(Conversation.company_id == company_id)
        )
        if status:
            stmt = stmt.where(Escalation.status == status)
        stmt = stmt.order_by(Escalation.created_at.desc()).offset(offset).limit(limit)
        return list(session.exec(stmt).all())

