# Core configuration loaded from environment variables via pydantic-settings
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database — Supabase PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/mintkey"

    # Redis — Upstash
    REDIS_URL: str = "redis://localhost:6379"

    # LLM — LiteLLM with Groq
    GROQ_API_KEY: str = ""
    LLM_MODEL: str = "groq/llama-3.3-70b-versatile"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # GitHub API
    GITHUB_TOKEN: str = ""

    # Auth
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days — match NextAuth session duration

    # HelixDB
    HELIX_URL: str = "http://localhost:6969"

    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    # Resend email
    RESEND_API_KEY: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
