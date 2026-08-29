from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.database import engine
from sqlmodel import SQLModel
from app.models import Company, User, Caller, Conversation, Message
target_metadata = SQLModel.metadata
config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)
def run_migrations_online():
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
run_migrations_online()
