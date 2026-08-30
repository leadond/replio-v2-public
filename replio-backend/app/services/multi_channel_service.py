"""Multi-channel message handling service."""
import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import Session
from app.models.knowledge_base import EmailMessage, SMSMessage, ChatMessage
from app.services.conversation_service import ConversationService

logger = logging.getLogger(__name__)


class EmailService:
    """Handle email messages."""

    @staticmethod
    def receive_email(
        session: Session,
        from_email: str,
        to_email: str,
        subject: str,
        body: str,
    ) -> EmailMessage:
        """Receive an email."""
        message = EmailMessage(
            id=str(uuid.uuid4()),
            from_email=from_email,
            to_email=to_email,
            subject=subject,
            body=body,
            status="received",
        )

        session.add(message)
        session.commit()
        session.refresh(message)
        logger.info(f"Email received: {message.id} from {from_email}")
        return message

    @staticmethod
    def send_reply(
        session: Session,
        message_id: str,
        response: str,
    ) -> Optional[EmailMessage]:
        """Send email reply."""
        message = session.get(EmailMessage, message_id)
        if message:
            message.ai_response = response
            message.status = "replied"
            message.response_sent_at = datetime.utcnow()
            session.add(message)
            session.commit()
            session.refresh(message)
            logger.info(f"Email reply sent for {message_id}")

        return message


class SMSService:
    """Handle SMS/text messages."""

    @staticmethod
    def receive_sms(
        session: Session,
        from_number: str,
        to_number: str,
        message_text: str,
    ) -> SMSMessage:
        """Receive an SMS."""
        message = SMSMessage(
            id=str(uuid.uuid4()),
            from_number=from_number,
            to_number=to_number,
            message_text=message_text,
            status="received",
        )

        session.add(message)
        session.commit()
        session.refresh(message)
        logger.info(f"SMS received: {message.id} from {from_number}")
        return message

    @staticmethod
    def send_reply(
        session: Session,
        message_id: str,
        response: str,
    ) -> Optional[SMSMessage]:
        """Send SMS reply."""
        message = session.get(SMSMessage, message_id)
        if message:
            message.ai_response = response
            message.status = "sent"
            message.response_sent_at = datetime.utcnow()
            session.add(message)
            session.commit()
            session.refresh(message)
            logger.info(f"SMS reply sent for {message_id}")

        return message


class ChatService:
    """Handle web chat messages."""

    @staticmethod
    def create_session(
        session: Session,
        company_id: str,
        user_id: Optional[str] = None,
    ) -> str:
        """Create a new chat session."""
        session_id = str(uuid.uuid4())
        logger.info(f"Chat session created: {session_id}")
        return session_id

    @staticmethod
    def receive_message(
        session: Session,
        session_id: str,
        message_text: str,
        user_id: Optional[str] = None,
    ) -> ChatMessage:
        """Receive a chat message."""
        message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            user_id=user_id,
            message_text=message_text,
            message_type="user",
            status="received",
        )

        session.add(message)
        session.commit()
        session.refresh(message)
        logger.info(f"Chat message received: {message.id} in session {session_id}")
        return message

    @staticmethod
    def send_response(
        session: Session,
        session_id: str,
        response: str,
    ) -> ChatMessage:
        """Send a chat response."""
        message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            message_text=response,
            message_type="bot",
            status="sent",
        )

        session.add(message)
        session.commit()
        session.refresh(message)
        logger.info(f"Chat response sent in session {session_id}")
        return message

    @staticmethod
    def get_chat_history(
        session: Session,
        session_id: str,
        limit: int = 50,
    ) -> list:
        """Get chat message history for a session."""
        from sqlmodel import select
        stmt = select(ChatMessage).where(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at).limit(limit)

        return session.exec(stmt).all()


class AppointmentService:
    """Handle appointments and scheduling."""

    @staticmethod
    def create_appointment(
        session: Session,
        caller_id: str,
        company_id: str,
        title: str,
        scheduled_time: datetime,
        duration_minutes: int = 30,
        appointment_type: str = "callback",
        description: Optional[str] = None,
    ) -> Any:
        """Create an appointment."""
        from app.models.knowledge_base import Appointment

        appointment = Appointment(
            id=str(uuid.uuid4()),
            caller_id=caller_id,
            company_id=company_id,
            title=title,
            description=description,
            scheduled_time=scheduled_time,
            duration_minutes=duration_minutes,
            appointment_type=appointment_type,
            status="scheduled",
        )

        session.add(appointment)
        session.commit()
        session.refresh(appointment)
        logger.info(f"Appointment created: {appointment.id}")
        return appointment

    @staticmethod
    def confirm_appointment(
        session: Session,
        appointment_id: str,
    ) -> Optional[Any]:
        """Confirm an appointment."""
        from app.models.knowledge_base import Appointment

        appointment = session.get(Appointment, appointment_id)
        if appointment:
            appointment.status = "confirmed"
            session.add(appointment)
            session.commit()
            session.refresh(appointment)
            logger.info(f"Appointment {appointment_id} confirmed")

        return appointment

    @staticmethod
    def cancel_appointment(
        session: Session,
        appointment_id: str,
        reason: Optional[str] = None,
    ) -> Optional[Any]:
        """Cancel an appointment."""
        from app.models.knowledge_base import Appointment

        appointment = session.get(Appointment, appointment_id)
        if appointment:
            appointment.status = "cancelled"
            if reason:
                appointment.notes = reason
            session.add(appointment)
            session.commit()
            session.refresh(appointment)
            logger.info(f"Appointment {appointment_id} cancelled")

        return appointment
