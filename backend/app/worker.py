"""Celery tasks. The app object lives in app.celery_app; the work itself in app.grading."""

from app import grading, jobs
from app.celery_app import celery_app
from app.db import SessionLocal

__all__ = ["celery_app"]


@celery_app.task(name="ping")
def ping() -> str:
    return "pong"


@celery_app.task(name="run_job", bind=True)
def run_job(self, session_id: str, task_id: str, files: dict[str, str]) -> dict:
    """Returns the visible RunResult only (GET /jobs/{id} shows it to the candidate)."""
    try:
        with SessionLocal() as db:
            return grading.process_run(db, session_id, task_id, files)
    finally:
        jobs.release_run_lock(session_id, self.request.id)


# acks_late: a job lost to a worker crash is redelivered; process_submit is idempotent.
@celery_app.task(name="submit_job", acks_late=True)
def submit_job(session_id: str) -> None:
    with SessionLocal() as db:
        grading.process_submit(db, session_id)


@celery_app.task(name="auto_submit_expired")
def auto_submit_expired() -> list[str]:
    with SessionLocal() as db:
        return grading.auto_submit_expired(db)
