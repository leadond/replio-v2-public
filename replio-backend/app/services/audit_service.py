"""Audit logging service for compliance and security."""
import logging
import uuid
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


class AuditService:
    """Handle audit logging operations."""

    @staticmethod
    def log_action(
        session: Session,
        user_id: str,
        company_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        changes: Optional[Dict[str, Any]] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log an audit event."""
        try:
            audit_log = AuditLog(
                id=str(uuid.uuid4()),
                user_id=user_id,
                company_id=company_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                changes=json.dumps(changes) if changes else None,
                status=status,
                error_message=error_message,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.utcnow(),
            )

            session.add(audit_log)
            session.commit()
            session.refresh(audit_log)

            logger.info(
                f"Audit: {action} on {resource_type} ({resource_id}) by {user_id} - {status}"
            )

            return audit_log

        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
            # Don't raise exception to avoid disrupting main operations
            return None

    @staticmethod
    def get_audit_trail(
        session: Session,
        company_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
        limit: int = 100,
    ) -> List[AuditLog]:
        """Retrieve audit trail for a company."""
        stmt = select(AuditLog).where(AuditLog.company_id == company_id)

        if start_date:
            stmt = stmt.where(AuditLog.timestamp >= start_date)

        if end_date:
            stmt = stmt.where(AuditLog.timestamp <= end_date)

        if resource_type:
            stmt = stmt.where(AuditLog.resource_type == resource_type)

        if action:
            stmt = stmt.where(AuditLog.action == action)

        stmt = stmt.order_by(AuditLog.timestamp.desc()).limit(limit)

        return session.exec(stmt).all()

    @staticmethod
    def get_user_activities(
        session: Session,
        user_id: str,
        limit: int = 100,
        hours: int = 24,
    ) -> List[AuditLog]:
        """Get recent activities for a user."""
        since = datetime.utcnow() - timedelta(hours=hours)

        stmt = select(AuditLog).where(
            (AuditLog.user_id == user_id) & (AuditLog.timestamp >= since)
        ).order_by(AuditLog.timestamp.desc()).limit(limit)

        return session.exec(stmt).all()

    @staticmethod
    def get_failed_actions(
        session: Session,
        company_id: str,
        hours: int = 24,
        limit: int = 50,
    ) -> List[AuditLog]:
        """Get failed actions for security monitoring."""
        since = datetime.utcnow() - timedelta(hours=hours)

        stmt = select(AuditLog).where(
            (AuditLog.company_id == company_id) &
            (AuditLog.status == "failure") &
            (AuditLog.timestamp >= since)
        ).order_by(AuditLog.timestamp.desc()).limit(limit)

        return session.exec(stmt).all()

    @staticmethod
    def get_action_summary(
        session: Session,
        company_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get summary statistics for audit trail."""
        stmt = select(AuditLog).where(AuditLog.company_id == company_id)

        if start_date:
            stmt = stmt.where(AuditLog.timestamp >= start_date)

        if end_date:
            stmt = stmt.where(AuditLog.timestamp <= end_date)

        logs = session.exec(stmt).all()

        # Aggregate stats
        actions = {}
        resource_types = {}
        status_counts = {"success": 0, "failure": 0}
        user_activity = {}

        for log in logs:
            # Count by action
            actions[log.action] = actions.get(log.action, 0) + 1

            # Count by resource type
            resource_types[log.resource_type] = resource_types.get(log.resource_type, 0) + 1

            # Count by status
            status_counts[log.status] = status_counts.get(log.status, 0) + 1

            # Count by user
            user_activity[log.user_id] = user_activity.get(log.user_id, 0) + 1

        return {
            "total_events": len(logs),
            "actions": actions,
            "resource_types": resource_types,
            "status_counts": status_counts,
            "top_users": sorted(user_activity.items(), key=lambda x: x[1], reverse=True)[:10],
        }

    @staticmethod
    def export_audit_log(
        session: Session,
        company_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """Export audit logs as structured data."""
        logs = AuditService.get_audit_trail(
            session,
            company_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000,
        )

        exported = []
        for log in logs:
            exported.append({
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "status": log.status,
                "changes": json.loads(log.changes) if log.changes else None,
                "error": log.error_message,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            })

        return exported

    @staticmethod
    def cleanup_old_logs(
        session: Session,
        days: int = 90,
    ) -> int:
        """Delete audit logs older than specified days."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        stmt = select(AuditLog).where(AuditLog.timestamp < cutoff_date)
        old_logs = session.exec(stmt).all()

        count = 0
        for log in old_logs:
            session.delete(log)
            count += 1

        if count > 0:
            session.commit()
            logger.info(f"Cleaned up {count} old audit logs")

        return count
