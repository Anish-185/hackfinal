from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery("app", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    # Lets GET /jobs/{id} tell "queued" from "running".
    task_track_started=True,
)


@celery_app.task(name="ping")
def ping() -> str:
    return "pong"


# The API enqueues these by name (app/jobs.py). P1.2 implements them.
@celery_app.task(name="run_job")
def run_job(session_id: str, task_id: str, files: dict[str, str]) -> dict:
    raise NotImplementedError("run_job is implemented in P1.2")


@celery_app.task(name="submit_job")
def submit_job(session_id: str) -> None:
    raise NotImplementedError("submit_job is implemented in P1.2")
