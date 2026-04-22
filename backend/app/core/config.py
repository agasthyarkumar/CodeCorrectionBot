from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    LLM_PROVIDER: str = "groq"
    LLM_MODEL: str = "openai/gpt-oss-120b"
    LLM_API_KEY: str = ""
    LLM_REASONING_EFFORT: str = "medium"
    LLM_MAX_TOKENS: int = 4096
    API_TOKEN: str = "dev-token"
    RATE_LIMIT: str = "5/minute"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
