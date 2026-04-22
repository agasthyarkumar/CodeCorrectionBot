from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    LLM_PROVIDER: str = "grok"
    LLM_MODEL: str = "grok-beta"
    LLM_API_KEY: str = ""
    API_TOKEN: str = "dev-token"
    RATE_LIMIT: str = "5/minute"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
