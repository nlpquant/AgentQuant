import os

from pydantic import AnyUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: AnyUrl = os.environ.get("REDIS_URL", "redis://localhost:6379")
    redis_db: int = int(os.getenv("REDIS_DB", "0"))
    task_expire: int = int(os.getenv("TASK_EXPIRE", "3600"))  # 1 hour
    data_expire: int = int(os.getenv("DATA_EXPIRE", "43200"))  # 12 hours

    k8s_config_file: str = os.getenv("K8S_CONFIG_FILE", "../../deploy/kind/kubeconfig.yaml")
    k8s_server_endpoint: str = os.getenv("K8S_SERVER_ENDPOINT", "")
    job_namespace: str = os.getenv("JOB_NAMESPACE", "default")
    job_redis_image: str = os.getenv("JOB_REDIS_IMAGE", "redis:alpine3.22")
    job_redis_host: str = os.getenv("JOB_REDIS_HOST", "host.docker.internal")
    job_redis_port: int = int(os.getenv("JOB_REDIS_PORT", "6379"))
    job_redis_db: int = int(os.getenv("JOB_REDIS_DB", "0"))
    job_runner_image: str = os.getenv("JOB_RUNNER_IMAGE", "docker.io/go2sheep/code-runner:python-3.12")
    job_runner_timeout: int = int(os.getenv("JOB_RUNNER_TIMEOUT", "300"))  # 5 minutes


settings = Settings()
