"""Call recording model."""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class CallRecording(SQLModel, table=True):
    """Call recording metadata and storage."""
    __tablename__ = "call_recordings"

    id: Optional[str] = Field(default=None, primary_key=True)
    conversation_id: str = Field(index=True)
    recording_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    file_size_mb: Optional[float] = None
    storage_provider: str = "local"  # s3, local, gcs
    transcription: Optional[str] = None
    transcription_status: str = "pending"  # pending, completed, failed
    storage_path: Optional[str] = None
    bitrate: str = "128k"
    format: str = "mp3"  # mp3, wav, m4a
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    expires_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True
