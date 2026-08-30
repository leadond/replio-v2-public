#!/usr/bin/env python3
"""Initialize database with tables and demo data."""

from sqlmodel import SQLModel, Session, select
from app.core.database import engine
from app.core.security import get_password_hash

# Import all models so they register with SQLModel.metadata
from app.models.user import User
from app.models.company import Company
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.caller import Caller
from app.models.settings import Settings
from app.models.audit_log import AuditLog
from app.models.call_recording import CallRecording
from app.models.escalation import Escalation
from app.models.knowledge_base import KnowledgeBase

import uuid

def init_db():
    """Create tables and initialize demo data."""
    # Create all tables
    SQLModel.metadata.create_all(engine)
    print("[OK] Database tables created")

    with Session(engine) as session:
        # Check if demo company exists
        stmt = select(Company).where(Company.slug == "demo-company")
        company = session.exec(stmt).first()

        if not company:
            company = Company(
                id=str(uuid.uuid4()),
                name="Demo Company",
                slug="demo-company",
                plan="starter",
                subscription_status="active",
            )
            session.add(company)
            session.commit()
            session.refresh(company)
            print(f"[OK] Demo company created: {company.id}")
        else:
            print(f"[OK] Demo company already exists: {company.id}")

        # Check if demo user exists
        stmt = select(User).where(User.email == "demo@replio.io")
        user = session.exec(stmt).first()

        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="demo@replio.io",
                hashed_password=get_password_hash("Demo123!"),
                full_name="Demo User",
                company_id=company.id,
                is_active=True,
                is_superuser=False,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"[OK] Demo user created: {user.id}")
            print(f"\nEmail: demo@replio.io")
            print(f"Password: Demo123!")
        else:
            print(f"[OK] Demo user already exists: {user.id}")

if __name__ == "__main__":
    init_db()
    print("\n[OK] Database initialization complete!")
