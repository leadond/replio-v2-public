from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid

class Message(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    role: str = Field(default="caller")
    content: str
    source: str = Field(default="voice")
    latency_ms: Optional[int] = None
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
