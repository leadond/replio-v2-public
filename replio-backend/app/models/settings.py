"""Application settings model."""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Settings(SQLModel, table=True):
    """Application configuration settings."""
    __tablename__ = "settings"

    id: Optional[str] = Field(default=None, primary_key=True)
    company_id: str = Field(index=True)
    key: str = Field(index=True)
    value: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
