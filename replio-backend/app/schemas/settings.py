"""Settings schemas for request/response."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SettingCreate(BaseModel):
    """Settings creation schema."""
    key: str
    value: str
    description: Optional[str] = None


class SettingRead(BaseModel):
    """Settings read schema."""
    id: str
    company_id: str
    key: str
    value: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingUpdate(BaseModel):
    """Settings update schema."""
    value: str
    description: Optional[str] = None
