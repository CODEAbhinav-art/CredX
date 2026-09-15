"""
CredX Backend — Configuration
Loads environment variables with validation via pydantic-settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.0-flash", env="GEMINI_MODEL")
    llm_force_fallback: bool = Field(default=False, env="LLM_FORCE_FALLBACK")

    # Server
    backend_port: int = Field(default=8000, env="BACKEND_PORT")
    backend_cors_origin: str = Field(default="http://localhost:3000", env="BACKEND_CORS_ORIGIN")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
