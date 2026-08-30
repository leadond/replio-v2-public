"""Audit log model for compliance and security."""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class AuditLog(SQLModel, table=True):
    """Audit log entry for tracking system actions."""
    __tablename__ = "audit_logs"

    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    company_id: str = Field(index=True)
    action: str = Field(index=True)  # create, read, update, delete, login, etc
    resource_type: str  # conversation, caller, setting, etc
    resource_id: Optional[str] = None
    changes: Optional[str] = None  # JSON diff
    status: str = "success"  # success, failure
    error_message: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)

    class Config:
        arbitrary_types_allowed = True
