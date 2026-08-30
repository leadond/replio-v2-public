"""Knowledge base models."""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class KnowledgeBase(SQLModel, table=True):
    """Company knowledge base articles."""
    __tablename__ = "knowledge_base"

    id: Optional[str] = Field(default=None, primary_key=True)
    company_id: str = Field(index=True)
    category: str = Field(index=True)
    title: str
    content: str
    keywords: Optional[str] = None  # comma-separated for search
    approved: bool = False
    approved_by_user_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    usage_count: int = 0
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True


class EmailMessage(SQLModel, table=True):
    """Email messages."""
    __tablename__ = "email_messages"

    id: Optional[str] = Field(default=None, primary_key=True)
    conversation_id: Optional[str] = None
    from_email: str = Field(index=True)
    to_email: str
    subject: str
    body: str
    ai_response: Optional[str] = None
    status: str = "received"  # received, processed, replied, failed
    response_sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True


class SMSMessage(SQLModel, table=True):
    """SMS/Text messages."""
    __tablename__ = "sms_messages"

    id: Optional[str] = Field(default=None, primary_key=True)
    conversation_id: Optional[str] = None
    from_number: str = Field(index=True)
    to_number: str
    message_text: str
    ai_response: Optional[str] = None
    status: str = "received"  # received, processed, sent, failed
    response_sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True


class ChatMessage(SQLModel, table=True):
    """Web chat messages."""
    __tablename__ = "chat_messages"

    id: Optional[str] = Field(default=None, primary_key=True)
    conversation_id: Optional[str] = None
    session_id: str = Field(index=True)
    user_id: Optional[str] = None
    message_text: str
    message_type: str = "user"  # user, agent, bot
    ai_response: Optional[str] = None
    status: str = "sent"  # sent, delivered, read
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True


class Appointment(SQLModel, table=True):
    """Appointments/Callbacks."""
    __tablename__ = "appointments"

    id: Optional[str] = Field(default=None, primary_key=True)
    conversation_id: Optional[str] = None
    caller_id: str = Field(index=True)
    company_id: str = Field(index=True)
    title: str
    description: Optional[str] = None
    scheduled_time: datetime = Field(index=True)
    duration_minutes: int = 30
    location: Optional[str] = None
    status: str = "scheduled"  # scheduled, confirmed, completed, cancelled
    appointment_type: str = "callback"  # callback, consultation, service
    assigned_agent_id: Optional[str] = None
    reminder_sent: bool = False
    reminder_time: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
