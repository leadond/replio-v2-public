"""Audit logging endpoints for compliance."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.audit_service import AuditService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/trail")
async def get_audit_trail(
    company_id: str = Query(...),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, le=1000),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve audit trail for a company."""
    try:
        # Parse dates
        start = None
        end = None

        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO 8601")

        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO 8601")

        logs = AuditService.get_audit_trail(
            session,
            company_id=company_id,
            start_date=start,
            end_date=end,
            resource_type=resource_type,
            action=action,
            limit=limit,
        )

        return {
            "success": True,
            "count": len(logs),
            "logs": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "status": log.status,
                    "error": log.error_message,
                    "ip_address": log.ip_address,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                }
                for log in logs
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving audit trail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-activities")
async def get_user_activities(
    user_id: str = Query(...),
    limit: int = Query(100, le=500),
    hours: int = Query(24, ge=1, le=720),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get recent activities for a specific user."""
    try:
        logs = AuditService.get_user_activities(
            session,
            user_id=user_id,
            limit=limit,
            hours=hours,
        )

        return {
            "success": True,
            "user_id": user_id,
            "count": len(logs),
            "activities": [
                {
                    "id": log.id,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "status": log.status,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                }
                for log in logs
            ],
        }

    except Exception as e:
        logger.error(f"Error retrieving user activities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/failed-actions")
async def get_failed_actions(
    company_id: str = Query(...),
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(50, le=500),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get failed actions for security monitoring."""
    try:
        logs = AuditService.get_failed_actions(
            session,
            company_id=company_id,
            hours=hours,
            limit=limit,
        )

        return {
            "success": True,
            "company_id": company_id,
            "count": len(logs),
            "failed_actions": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "error": log.error_message,
                    "ip_address": log.ip_address,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                }
                for log in logs
            ],
        }

    except Exception as e:
        logger.error(f"Error retrieving failed actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_audit_summary(
    company_id: str = Query(...),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get audit statistics summary."""
    try:
        # Parse dates
        start = None
        end = None

        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")

        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")

        summary = AuditService.get_action_summary(
            session,
            company_id=company_id,
            start_date=start,
            end_date=end,
        )

        return {
            "success": True,
            "company_id": company_id,
            "summary": summary,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting audit summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export")
async def export_audit_logs(
    company_id: str = Query(...),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = Query("json", regex="^(json|csv)$"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Export audit logs in specified format."""
    try:
        # Parse dates
        start = None
        end = None

        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")

        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")

        exported = AuditService.export_audit_log(
            session,
            company_id=company_id,
            start_date=start,
            end_date=end,
        )

        if format == "csv":
            # Convert to CSV
            import csv
            import io

            output = io.StringIO()
            if exported:
                writer = csv.DictWriter(output, fieldnames=exported[0].keys())
                writer.writeheader()
                writer.writerows(exported)

            return {
                "success": True,
                "format": "csv",
                "data": output.getvalue(),
                "count": len(exported),
            }
        else:
            # Return as JSON
            return {
                "success": True,
                "format": "json",
                "data": exported,
                "count": len(exported),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_old_logs(
    days: int = Query(90, ge=1, le=365),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete old audit logs (retention policy)."""
    try:
        count = AuditService.cleanup_old_logs(
            session,
            days=days,
        )

        return {
            "success": True,
            "message": f"Deleted {count} audit logs older than {days} days",
            "count": count,
        }

    except Exception as e:
        logger.error(f"Error cleaning up audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
