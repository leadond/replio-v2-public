"""Settings management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    two_factor_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    sms_alerts: Optional[bool] = None
    in_app_notifications: Optional[bool] = None


@router.get("")
async def get_all_settings(
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get all settings for a company."""
    return SettingsService.get_all_settings(session, company_id)


@router.get("/{company_id_param}")
async def get_company_settings(
    company_id_param: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get all settings for a company by company_id."""
    return SettingsService.get_all_settings(session, company_id_param)


@router.put("/{company_id_param}")
async def update_company_settings(
    company_id_param: str,
    data: SettingsUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update settings for a company."""
    updates = {}
    if data.company_name is not None:
        updates['company_name'] = data.company_name
    if data.timezone is not None:
        updates['timezone'] = data.timezone
    if data.language is not None:
        updates['language'] = data.language
    if data.theme is not None:
        updates['theme'] = data.theme
    if data.two_factor_enabled is not None:
        updates['two_factor_enabled'] = data.two_factor_enabled
    if data.email_notifications is not None:
        updates['email_notifications'] = data.email_notifications
    if data.sms_alerts is not None:
        updates['sms_alerts'] = data.sms_alerts
    if data.in_app_notifications is not None:
        updates['in_app_notifications'] = data.in_app_notifications

    result = {}
    for key, value in updates.items():
        setting = SettingsService.set_setting(session, company_id_param, key, str(value), None)
        result[key] = setting.value
    return result
