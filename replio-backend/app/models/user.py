from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from app.models.base import BaseModel

class User(BaseModel, table=True):
    __tablename__ = "users"
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    company_id: Optional[str] = Field(default=None, foreign_key="companies.id")
