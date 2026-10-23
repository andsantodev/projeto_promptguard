from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Values come from environment variables or .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openrouter_api_key: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    target_model: str = "google/gemini-3.5-flash-lite"
    evaluator_model: str = "anthropic/claude-haiku-5.5"

    session_hour_limit: int = 18
    session_day_limit: int = 60
    global_day_limit: int = 300

    frontend_dist: Path = Path("dist")


settings = Settings()
