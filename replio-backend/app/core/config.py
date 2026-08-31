from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
from typing import Optional, List


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = Field(
        default="postgresql://replio:replio@localhost:5432/replio",
        description="Database connection string. Must be set in production via environment variable.",
    )
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
        # Only load .env for local development. In production (Railway, etc.),
        # rely entirely on environment variables to avoid accidentally shipping
        # dev secrets or hardcoded localhost connections.
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True  # DATABASE_URL, not database_url

        @classmethod
        def settings_customise_sources(cls, settings_cls, init_settings, env_settings, dotenv_settings, file_settings, env_nested_delimiter=None):
            """In production, ignore .env file and only use environment variables."""
            # Determine if we're in production
            app_env = init_settings.get("APP_ENV") or env_settings.get("APP_ENV") or "development"
            if app_env.lower() in ("production", "prod"):
                # Skip .env file for production
                return (env_settings, init_settings)
            # For development, include .env
            return (init_settings, env_settings, dotenv_settings, file_settings)


settings = Settings()
