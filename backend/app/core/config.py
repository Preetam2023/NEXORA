"""Application settings — loaded from .env / environment."""
from __future__ import annotations

from functools import lru_cache
from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_env: str = "local"
    app_name: str = "nexora"
    log_level: str = "INFO"
    api_prefix: str = "/api"

    # PostgreSQL / Supabase
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nexora"
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # SAP AI Core / GenAI Hub
    aicore_client_id: str = ""
    aicore_client_secret: str = ""
    aicore_auth_url: str = ""
    aicore_base_url: str = ""
    aicore_resource_group: str = "default"
    aicore_llm_model: str = "sap/anthropic--claude-4.5-haiku"
    aicore_llm_fast_model: str = "sap/anthropic--claude-4.5-haiku"
    aicore_llm_max_tokens: int = 4096
    aicore_llm_timeout: int = 60
    ai_enabled: bool = True

    # CORS — accepts comma-separated string or JSON list
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: Any) -> Any:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
