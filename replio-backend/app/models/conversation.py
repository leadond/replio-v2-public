from sqlmodel import SQLModel, Field
from typing import Optional
from app.models.base import BaseModel

class Conversation(BaseModel, table=True):
    __tablename__ = "conversations"
    caller_id: str = Field(foreign_key="callers.id", index=True)
    company_id: str = Field(foreign_key="companies.id", index=True)
    call_sid: Optional[str] = None
    elevenlabs_conversation_id: Optional[str] = None
    status: str = Field(default="in_progress")
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration_seconds: float = Field(default=0.0)
    outcome: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    sentiment_score: Optional[float] = None
    recording_url: Optional[str] = None
    escalation_reason: Optional[str] = None
    handled_by: str = Field(default="ai")
