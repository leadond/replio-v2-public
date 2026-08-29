from sqlmodel import SQLModel, Field
from typing import Optional
from app.models.base import BaseModel

class Caller(BaseModel, table=True):
    __tablename__ = "callers"
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
