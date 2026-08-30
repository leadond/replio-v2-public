"""Call recording management service."""
import logging
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models.call_recording import CallRecording

logger = logging.getLogger(__name__)


class RecordingService:
    """Handle call recording operations."""

    @staticmethod
    def create_recording(
        session: Session,
        conversation_id: str,
        duration_seconds: Optional[int] = None,
        storage_path: Optional[str] = None,
    ) -> CallRecording:
        """Create a new recording record."""
        recording = CallRecording(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            duration_seconds=duration_seconds,
            storage_path=storage_path,
        )

        session.add(recording)
        session.commit()
        session.refresh(recording)
        return recording

    @staticmethod
    def get_recording(session: Session, recording_id: str) -> Optional[CallRecording]:
        """Get recording by ID."""
        return session.get(CallRecording, recording_id)

    @staticmethod
    def get_recording_by_conversation(
        session: Session, conversation_id: str
    ) -> Optional[CallRecording]:
        """Get recording for a conversation."""
        stmt = select(CallRecording).where(
            CallRecording.conversation_id == conversation_id
        )
        return session.exec(stmt).first()

    @staticmethod
    def list_recordings(
        session: Session,
        company_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[CallRecording]:
        """List all recordings."""
        stmt = select(CallRecording).order_by(
            CallRecording.created_at.desc()
        ).offset(offset).limit(limit)
        return session.exec(stmt).all()

    @staticmethod
    def update_recording(
        session: Session,
        recording_id: str,
        **updates
    ) -> Optional[CallRecording]:
        """Update recording metadata."""
        recording = session.get(CallRecording, recording_id)
        if recording:
            for key, value in updates.items():
                if hasattr(recording, key) and value is not None:
                    setattr(recording, key, value)

            session.add(recording)
            session.commit()
            session.refresh(recording)

        return recording

    @staticmethod
    def add_transcription(
        session: Session,
        recording_id: str,
        transcription: str,
    ) -> Optional[CallRecording]:
        """Add transcription to recording."""
        return RecordingService.update_recording(
            session,
            recording_id,
            transcription=transcription,
            transcription_status="completed",
        )

    @staticmethod
    def delete_recording(session: Session, recording_id: str) -> bool:
        """Delete recording (hard delete)."""
        recording = session.get(CallRecording, recording_id)
        if recording:
            session.delete(recording)
            session.commit()
            return True
        return False

    @staticmethod
    def get_recording_statistics(
        session: Session,
        company_id: Optional[str] = None,
        days: int = 30,
    ) -> Dict[str, Any]:
        """Get recording statistics."""
        since = datetime.utcnow() - timedelta(days=days)

        stmt = select(CallRecording).where(
            CallRecording.created_at >= since
        )
        recordings = session.exec(stmt).all()

        total_duration = sum(r.duration_seconds or 0 for r in recordings)
        transcribed = sum(
            1 for r in recordings if r.transcription_status == "completed"
        )

        return {
            "total_recordings": len(recordings),
            "total_duration_seconds": total_duration,
            "average_duration_seconds": (
                total_duration / len(recordings) if recordings else 0
            ),
            "transcribed_count": transcribed,
            "transcription_rate": (
                (transcribed / len(recordings) * 100) if recordings else 0
            ),
            "total_storage_mb": sum(r.file_size_mb or 0 for r in recordings),
        }

    @staticmethod
    def cleanup_expired_recordings(
        session: Session,
        days: int = 90,
    ) -> int:
        """Delete recordings older than retention period."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        stmt = select(CallRecording).where(CallRecording.created_at < cutoff_date)
        old_recordings = session.exec(stmt).all()

        count = 0
        for recording in old_recordings:
            session.delete(recording)
            count += 1

        if count > 0:
            session.commit()
            logger.info(f"Cleaned up {count} old recordings")

        return count
