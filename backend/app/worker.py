from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery("app", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
)


@celery_app.task(name="ping")
def ping() -> str:
    return "pong"
