from sqlmodel import SQLModel
from typing import Optional

class TestModel(SQLModel, table=True):
    id: Optional[str] = None
    name: str = "test"

print("Model loaded successfully!")
