from sqlmodel import Field, SQLModel
from datetime import datetime, timezone
from typing import Optional
import uuid

def now_utc():
    return datetime.now(timezone.utc)

class BaseModel(SQLModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=now_utc)
    updated_at: Optional[datetime] = Field(default_factory=now_utc)
