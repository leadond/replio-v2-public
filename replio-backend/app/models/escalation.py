"""Escalation model for call routing."""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Escalation(SQLModel, table=True):
    """Escalation record for routing to agents."""
    __tablename__ = "escalations"

    id: Optional[str] = Field(default=None, primary_key=True)
    conversation_id: str = Field(index=True)
    caller_id: Optional[str] = None
    escalation_reason: str
    escalation_type: str  # supervisor, transfer, callback, specialist
    assigned_to_user_id: Optional[str] = None
    status: str = Field(default="pending", index=True)  # pending, in_progress, resolved, failed
    priority: str = Field(default="medium", index=True)  # low, medium, high, critical
    escalation_metadata: Optional[str] = None  # JSON
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
