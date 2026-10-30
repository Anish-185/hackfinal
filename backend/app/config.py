from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str

    featherless_api_key: str = ""
    featherless_model_generator: str = ""
    featherless_model_assistant: str = ""
    featherless_model_probe: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
