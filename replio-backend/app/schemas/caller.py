from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CallerCreate(BaseModel):
    phone_number: str
    name: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None

class CallerRead(BaseModel):
    id: str
    phone_number: str
    name: Optional[str] = None
    email: Optional[str] = None
    company_id: str
    last_call_at: Optional[str] = None
    total_calls: int
    total_duration_seconds: float
    sentiment_score: Optional[float] = None
    notes: Optional[str] = None
    is_blocked: bool
    tags: Optional[str] = None
    created_at: Optional[datetime] = None

class CallerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    is_blocked: Optional[bool] = None
