from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConversationCreate(BaseModel):
    caller_id: str
    company_id: str

class ConversationRead(BaseModel):
    id: str
    caller_id: str
    company_id: str
    call_sid: Optional[str] = None
    elevenlabs_conversation_id: Optional[str] = None
    status: str
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration_seconds: float
    outcome: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    sentiment_score: Optional[float] = None
    recording_url: Optional[str] = None
    escalation_reason: Optional[str] = None
    handled_by: str
    created_at: Optional[datetime] = None
