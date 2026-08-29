from sqlmodel import SQLModel, Field
from typing import Optional
from app.models.base import BaseModel

class Message(BaseModel, table=True):
    __tablename__ = "messages"
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    role: str = Field(default="caller")
    content: str
    source: str = Field(default="voice")
    latency_ms: Optional[int] = None
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
