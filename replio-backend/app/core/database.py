from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

connect_args = {}
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

def get_session():
    with Session(engine) as session:
        yield session
