"""Analytics and dashboard service.

Every value returned here is computed from the database. Where a figure cannot
be derived from real data (for example a week-over-week change when there is no
prior week to compare against) the field is returned as ``None`` so the UI can
omit it rather than display a fabricated number.
"""
import logging
import time
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select, func, text
from app.models.conversation import Conversation
from app.models.caller import Caller
from app.models.message import Message

logger = logging.getLogger(__name__)

# Captured at import so uptime reflects this process, not an invented SLA figure.
_PROCESS_STARTED_AT = time.monotonic()

TREND_DAYS = 7


def _percent_change(current: float, previous: float):
    """Percent change between two periods.

    Returns None when there is no prior-period baseline — a change from zero is
    not a meaningful percentage, and inventing one would be misleading.
    """
    if previous is None or previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 1)


class AnalyticsService:
    """Handle analytics and dashboard data."""

    @staticmethod
    def get_dashboard_stats(session: Session, company_id: str) -> dict:
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(days=TREND_DAYS)
        prior_start = now - timedelta(days=TREND_DAYS * 2)

        conversations = session.exec(
            select(Conversation).where(Conversation.company_id == company_id)
        ).all()
        conv_ids = [c.id for c in conversations]

        callers = session.exec(
            select(func.count(func.distinct(Caller.id))).where(Caller.company_id == company_id)
        ).first() or 0

        if conv_ids:
            total_messages = session.exec(
                select(func.count(Message.id)).where(Message.conversation_id.in_(conv_ids))
            ).first() or 0
            channel_counts = session.exec(
                select(Message.source, func.count(Message.id))
                .where(Message.conversation_id.in_(conv_ids))
                .group_by(Message.source)
            ).all()
        else:
            total_messages = 0
            channel_counts = []

        total_duration = sum(c.duration_seconds or 0 for c in conversations)
        avg_duration = total_duration / len(conversations) if conversations else 0

        total_by_channel = sum(count for _, count in channel_counts)
        channel_distribution = [
            {
                "channel": source or "other",
                "count": count,
                "percentage": round((count / total_by_channel * 100) if total_by_channel else 0, 1),
            }
            for source, count in channel_counts
        ]

        # ---- week-over-week deltas, computed from real rows ----
        def _in_window(conv, start, end):
            created = conv.created_at
            if created is None:
                return False
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            return start <= created < end

        current_convs = [c for c in conversations if _in_window(c, window_start, now)]
        prior_convs = [c for c in conversations if _in_window(c, prior_start, window_start)]

        current_ids = [c.id for c in current_convs]
        prior_ids = [c.id for c in prior_convs]

        def _message_count(ids):
            if not ids:
                return 0
            return session.exec(
                select(func.count(Message.id)).where(Message.conversation_id.in_(ids))
            ).first() or 0

        def _avg_duration(convs):
            return (sum(c.duration_seconds or 0 for c in convs) / len(convs)) if convs else 0

        deltas = {
            "calls_pct": _percent_change(len(current_convs), len(prior_convs)),
            "messages_pct": _percent_change(_message_count(current_ids), _message_count(prior_ids)),
            "callers_pct": _percent_change(
                len({c.caller_id for c in current_convs}),
                len({c.caller_id for c in prior_convs}),
            ),
            "avg_duration_pct": _percent_change(_avg_duration(current_convs), _avg_duration(prior_convs)),
            "period_days": TREND_DAYS,
        }

        # ---- real daily series for the trailing week ----
        counts_by_day = {}
        for c in current_convs:
            created = c.created_at
            if created is None:
                continue
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            counts_by_day[created.date()] = counts_by_day.get(created.date(), 0) + 1

        daily_trend = []
        for offset in range(TREND_DAYS - 1, -1, -1):
            day = (now - timedelta(days=offset)).date()
            daily_trend.append({
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "count": counts_by_day.get(day, 0),
            })

        return {
            "total_calls": len(conversations),
            "total_messages": total_messages,
            "total_callers": callers,
            "avg_conversation_duration_seconds": avg_duration,
            "channel_distribution": channel_distribution,
            "deltas": deltas,
            "daily_trend": daily_trend,
            "system_health": AnalyticsService.get_system_health(session),
        }

    @staticmethod
    def get_system_health(session: Session) -> dict:
        """Measure real system health. No placeholder values."""
        db_status = "unknown"
        db_latency_ms = None
        started = time.perf_counter()
        try:
            session.exec(text("SELECT 1"))
            db_latency_ms = round((time.perf_counter() - started) * 1000, 1)
            db_status = "connected"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_status = "error"

        return {
            "database_status": db_status,
            "db_latency_ms": db_latency_ms,
            "uptime_seconds": int(time.monotonic() - _PROCESS_STARTED_AT),
        }

    @staticmethod
    def get_top_callers(session: Session, company_id: str, limit: int = 10) -> list:
        result = session.exec(
            select(Caller.id, func.count(Conversation.id).label("call_count"))
            .join(Conversation)
            .where(Conversation.company_id == company_id)
            .group_by(Caller.id)
            .order_by(func.count(Conversation.id).desc())
            .limit(limit)
        ).all()
        return [{"caller_id": r[0], "call_count": r[1]} for r in result]

    @staticmethod
    def get_sentiment_trends(session: Session, company_id: str, days: int = 7) -> dict:
        # Compare against a datetime, not an ISO string — created_at is a datetime column.
        since = datetime.now(timezone.utc) - timedelta(days=days)
        conversations = session.exec(
            select(Conversation).where(
                (Conversation.company_id == company_id) & (Conversation.created_at >= since)
            )
        ).all()
        sentiments = [c.sentiment_score for c in conversations if c.sentiment_score is not None]
        return {
            "average_sentiment": (sum(sentiments) / len(sentiments)) if sentiments else None,
            "sample_size": len(sentiments),
            "trend_data": [
                {"date": c.created_at.isoformat() if c.created_at else None, "sentiment": c.sentiment_score}
                for c in conversations
                if c.sentiment_score is not None
            ],
        }
