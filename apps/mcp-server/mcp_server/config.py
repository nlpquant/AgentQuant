import os

from pydantic import AnyUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: AnyUrl = os.environ.get("REDIS_URL", "redis://localhost:6379")
    redis_db: int = int(os.getenv("REDIS_DB", "0"))
    task_expire: int = int(os.getenv("TASK_EXPIRE", "3600"))  # 1 hour
    data_expire: int = int(os.getenv("DATA_EXPIRE", "43200"))  # 12 hours


settings = Settings()
