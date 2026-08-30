"""Settings management service."""
import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import Session, select
from app.models.settings import Settings

logger = logging.getLogger(__name__)


class SettingsService:
    """Handle application settings operations."""

    @staticmethod
    def get_setting(session: Session, company_id: str, key: str) -> Optional[Settings]:
        """Get a setting by key."""
        stmt = select(Settings).where(
            (Settings.company_id == company_id) & (Settings.key == key)
        )
        return session.exec(stmt).first()

    @staticmethod
    def get_all_settings(session: Session, company_id: str) -> Dict[str, str]:
        """Get all settings for a company."""
        stmt = select(Settings).where(Settings.company_id == company_id)
        settings = session.exec(stmt).all()
        return {s.key: s.value for s in settings}

    @staticmethod
    def set_setting(
        session: Session,
        company_id: str,
        key: str,
        value: str,
        description: Optional[str] = None
    ) -> Settings:
        """Set a setting value, creating or updating as needed."""
        existing = SettingsService.get_setting(session, company_id, key)

        if existing:
            existing.value = value
            existing.updated_at = datetime.utcnow()
            if description:
                existing.description = description
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
        else:
            setting = Settings(
                id=str(uuid.uuid4()),
                company_id=company_id,
                key=key,
                value=value,
                description=description,
            )
            session.add(setting)
            session.commit()
            session.refresh(setting)
            return setting

    @staticmethod
    def delete_setting(session: Session, company_id: str, key: str) -> bool:
        """Delete a setting."""
        setting = SettingsService.get_setting(session, company_id, key)
        if setting:
            session.delete(setting)
            session.commit()
            return True
        return False

    @staticmethod
    def get_settings_dict(session: Session, company_id: str) -> Dict[str, Any]:
        """Get all settings as a dictionary."""
        return SettingsService.get_all_settings(session, company_id)
