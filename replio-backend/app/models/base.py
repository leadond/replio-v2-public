from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from typing import Optional
import uuid

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

class BaseModel(SQLModel, table=False):
    pass
