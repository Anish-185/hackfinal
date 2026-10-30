"""Enqueue Celery jobs and report their status to the API.

Each job gets a small record in Redis ({kind, session_id, task_id}), so GET /jobs/{id}
answers 404 for ids we never issued instead of Celery's "PENDING forever".
"""

import json
import logging
import uuid
from typing import Any, Literal

from celery.result import AsyncResult
from pydantic import BaseModel, ValidationError

from app.cache import redis_client
from app.worker import celery_app
from contracts_gen.run_result import RunResult

logger = logging.getLogger(__name__)

JobKind = Literal["run", "submit"]
JobStatus = Literal["queued", "running", "done", "failed"]

JOB_RECORD_TTL_S = 24 * 3600

_STATUS = {
    "PENDING": "queued",
    "RECEIVED": "queued",
    "STARTED": "running",
    "RETRY": "running",
    "SUCCESS": "done",
    "FAILURE": "failed",
    "REVOKED": "failed",
}


class JobRecord(BaseModel):
    kind: JobKind
    session_id: str
    task_id: str | None


class JobView(BaseModel):
    job_id: str
    kind: JobKind
    status: JobStatus
    result: RunResult | None
    """Visible RunResult of a finished run job. Null otherwise."""
    error: str | None


def enqueue(task_name: str, args: list[Any], record: JobRecord) -> str:
    job_id = str(uuid.uuid4())
    # Record first, so a fast worker can't finish a job we don't know about yet.
    redis_client.set(f"job:{job_id}", record.model_dump_json(), ex=JOB_RECORD_TTL_S)
    celery_app.send_task(task_name, args=args, task_id=job_id)
    return job_id


def celery_state(job_id: str) -> tuple[str, Any]:
    result = AsyncResult(job_id, app=celery_app)
    return result.state, result.result if result.state == "SUCCESS" else None


def get_job(job_id: str) -> JobView | None:
    raw = redis_client.get(f"job:{job_id}")
    if raw is None:
        return None
    record = JobRecord.model_validate(json.loads(raw))
    state, value = celery_state(job_id)
    status: JobStatus = _STATUS.get(state, "queued")

    result = None
    error = "job failed" if status == "failed" else None
    if status == "done" and record.kind == "run":
        # The worker returns only the visible RunResult. Anything else is not passed on.
        try:
            result = RunResult.model_validate(value)
        except ValidationError:
            logger.error("Job %s returned something other than a RunResult", job_id)
            status, error = "failed", "job failed"
    return JobView(job_id=job_id, kind=record.kind, status=status, result=result, error=error)
