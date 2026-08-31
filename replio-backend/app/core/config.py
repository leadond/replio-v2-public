from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
from typing import Optional, List


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # DATABASE_URL is REQUIRED from environment. No fallback default.
    # This forces Railway/production to fail loudly if not set, rather than
    # silently using a hardcoded localhost value.
    DATABASE_URL: str
    SIGNALWIRE_PROJECT_ID: str = ""
    SIGNALWIRE_API_TOKEN: str = ""
    SIGNALWIRE_SPACE: str = ""
    SIGNALWIRE_PHONE_NUMBER: str = ""
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_AGENT_ID: str = ""
    ELEVENLABS_WEBHOOK_SECRET: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    OPENAI_API_KEY: Optional[str] = None

    # Local AI inference (hybrid deployment)
    LOCAL_AI_ENABLED: bool = False
    LOCAL_AI_API_KEY: str = "default-key-change-in-production"
    OPENCLAW_URL: str = "http://localhost:20000"
    LLAMA_CPP_URL: str = "http://localhost:20001"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    # Comma-separated list of browser origins allowed to call this API.
    # "*" is accepted for local development only.
    CORS_ORIGINS: str = "*"

    @field_validator("DATABASE_URL")
    @classmethod
    def normalise_database_url(cls, v: str) -> str:
        """Railway, Heroku and Fly inject `postgres://`, which SQLAlchemy 2 rejects.
        Rewrite to the driver-qualified scheme so the same value works everywhere."""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    def model_post_init(self, __context):
        """Validate production configuration after all fields are set."""
        if self.is_production:
            localhost_default = "postgresql://replio:replio@localhost:5432/replio"
            if self.DATABASE_URL == localhost_default:
                raise ValueError(
                    "DATABASE_URL must be set via environment variable in production. "
                    f"Got the hardcoded local default instead: {localhost_default}"
                )

    @property
    def cors_origin_list(self) -> List[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if raw in ("", "*"):
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in ("production", "prod")

    class Config:
        case_sensitive = True  # DATABASE_URL, not database_url
        # Note: Do NOT use env_file in production. In Railway/cloud deployments,
        # all config comes from environment variables. Loading .env would shadow them
        # and cause hardcoded localhost values to override real database URLs.
        # For local development, create a .env file with dev values (keep it out of git).


import os
settings = Settings()

# Diagnostic: Log what DATABASE_URL the app is using
print(f"[CONFIG] APP_ENV={settings.APP_ENV}")
print(f"[CONFIG] DATABASE_URL={settings.DATABASE_URL[:50]}...")
print(f"[CONFIG] Is production: {settings.is_production}")
if os.environ.get("DATABASE_URL"):
    print(f"[CONFIG] Found DATABASE_URL in environment: {os.environ.get('DATABASE_URL')[:50]}...")
else:
    print("[CONFIG] WARNING: DATABASE_URL not found in environment, using default")
