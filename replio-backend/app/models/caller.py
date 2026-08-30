from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid

class Caller(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    phone_number: str = Field(index=True)
    name: Optional[str] = None
    email: Optional[str] = None
    company_id: str = Field(foreign_key="companies.id", index=True)
    last_call_at: Optional[str] = None
    total_calls: int = Field(default=0)
    total_duration_seconds: float = Field(default=0.0)
    sentiment_score: Optional[float] = None
    notes: Optional[str] = None
    is_blocked: bool = Field(default=False)
    tags: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
