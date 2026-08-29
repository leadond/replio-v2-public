from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from app.models.base import BaseModel

class Company(BaseModel, table=True):
    __tablename__ = "companies"
    name: str = Field(index=True)
    slug: str = Field(index=True, unique=True)
    signalwire_phone_number: Optional[str] = None
    elevenlabs_agent_id: Optional[str] = None
    google_calendar_email: Optional[str] = None
    google_calendar_connected: bool = Field(default=False)
    webhook_url: Optional[str] = None
    prompt_template: Optional[str] = None
    is_active: bool = Field(default=True)
    plan: str = Field(default="starter")
    subscription_status: str = Field(default="trialing")
    monthly_minutes_used: float = Field(default=0.0)
    monthly_minutes_limit: float = Field(default=500.0)
