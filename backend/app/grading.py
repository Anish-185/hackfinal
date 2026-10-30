"""Grading work done by the Celery worker: Run, Submit and auto-submit.

Hidden tests run in their own container, never alongside the visible ones, and nothing
from a hidden run (output, test names, messages) leaves this module except pass counts
and failing ids, which go into the database only.
"""

import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import jobs
from app.integrity import scan
from app.models import AssessmentSession, Event, FileSnapshot, Run, Score, Task
from app.workspace import (
    build_workspace,
    changed_files,
    protected_reason,
    runnable_test_paths,
    split_editable,
)
from contracts_gen.event import (
    HiddenSilentCounts,
    RunEvent,
    RunPayload,
    SubmitEvent,
    SubmitPayload,
    TestCounts,
)
from contracts_gen.run_result import RunResult, Summary
from contracts_gen.task_spec import TaskSpec, TestFile
from runner import run_tests

logger = logging.getLogger(__name__)

TEST_SET_MISMATCH = "test_set_mismatch"


@dataclass(frozen=True)
class TaskGrade:
    visible: RunResult
    hidden: RunResult
    visible_passed: set[str]
    hidden_passed: set[str]
    integrity: dict[str, Any]


def checked_run(
    runtime: str, files: dict[str, str], tests: list[TestFile], expected_ids: list[str]
) -> RunResult:
    """Run `tests` and refuse the result unless exactly the expected tests were collected."""
    paths = runnable_test_paths(runtime, tests)
    if paths:
        # Tests and test/config files can't be edited by the code under test.
        readonly = frozenset(p for p in files if protected_reason(p) is not None)
        result = run_tests(runtime, files, paths, readonly=readonly)
    else:
        result = _empty_result()
    if result.status == "ok" and {t.id for t in result.tests} != set(expected_ids):
        return result.model_copy(
            update={
                "status": "error",
                "reason": TEST_SET_MISMATCH,
                "tests": [],
                "summary": Summary(passed=0, failed=0, total=0),
            }
        )
    return result


def passed_ids(result: RunResult, expected_ids: list[str]) -> set[str]:
    """Expected tests that passed. A run that isn't "ok" passes nothing."""
    if result.status != "ok":
        return set()
    return {t.id for t in result.tests if t.outcome == "passed"} & set(expected_ids)


def grade_task(spec: TaskSpec, candidate_files: dict[str, str]) -> TaskGrade:
    visible = checked_run(
        spec.runtime,
        build_workspace(spec, candidate_files, spec.visible_tests),
        spec.visible_tests,
        spec.visible_test_ids,
    )
    hidden = checked_run(
        spec.runtime,
        build_workspace(spec, candidate_files, spec.hidden_tests),
        spec.hidden_tests,
        spec.hidden_test_ids,
    )
    _, dropped = split_editable(spec, candidate_files)
    flags = scan(changed_files(spec, candidate_files))
    return TaskGrade(
        visible=visible,
        hidden=hidden,
        visible_passed=passed_ids(visible, spec.visible_test_ids),
        hidden_passed=passed_ids(hidden, spec.hidden_test_ids),
        integrity={
            "dropped_paths": dropped,
            "flags": [flag.model_dump() for flag in flags],
        },
    )


def derive_test_ids(spec: dict[str, Any]) -> dict[str, Any]:
    """Return `spec` with visible_test_ids and hidden_test_ids collected from a starter run.

    Used when a task is built. Failing tests still count as collected; a run that can't
    collect (status not "ok") is an error in the task, not something to record.
    """
    draft = TaskSpec.model_validate(spec | {"visible_test_ids": [], "hidden_test_ids": []})
    ids = {}
    for name, tests in (("visible", draft.visible_tests), ("hidden", draft.hidden_tests)):
        paths = runnable_test_paths(draft.runtime, tests)
        if not paths:
            ids[f"{name}_test_ids"] = []
            continue
        files = build_workspace(draft, {}, tests)
        result = run_tests(draft.runtime, files, paths, timeout_s=120)
        if result.status != "ok":
            raise ValueError(f"{name} tests of {draft.task_id} could not run: {result.status}")
        ids[f"{name}_test_ids"] = sorted(t.id for t in result.tests)
    return spec | ids


def process_run(db: Session, session_id: str, task_id: str, files: dict[str, str]) -> dict:
    """Run job body: visible + silent hidden run, two run rows, one run event.

    Returns the visible RunResult only; that is all the API ever sees.
    """
    session = db.get(AssessmentSession, uuid.UUID(session_id))
    task = _task(db, session, task_id)
    spec = TaskSpec.model_validate(task.spec)
    grade = grade_task(spec, files)
    now = datetime.now(UTC)

    db.add_all(
        [
            Run(
                session_id=session.id,
                task_id=task_id,
                kind="visible",
                result=grade.visible.model_dump(mode="json"),
                integrity=grade.integrity,
                ts=now,
            ),
            Run(
                session_id=session.id,
                task_id=task_id,
                kind="silent",
                result=grade.hidden.model_dump(mode="json"),
                integrity=grade.integrity,
                ts=now,
            ),
        ]
    )
    failing = sorted(set(spec.hidden_test_ids) - grade.hidden_passed)
    event = RunEvent(
        session_id=session_id,
        task_id=task_id,
        ts=_ms(now),
        type="run",
        payload=RunPayload(
            visible=TestCounts(passed=len(grade.visible_passed), total=len(spec.visible_test_ids)),
            hidden_silent=HiddenSilentCounts(
                passed=len(grade.hidden_passed),
                total=len(spec.hidden_test_ids),
                failing_ids=failing,
            ),
        ),
    )
    db.add(_event_row(session.id, event))
    db.commit()
    return grade.visible.model_dump(mode="json")


def process_submit(db: Session, session_id: str) -> None:
    """Submit job body: grade every task's latest snapshot once, then store a stub score.

    Idempotent: the session row is locked, and a session that already has a score is
    skipped, so a retried or duplicated job does nothing.
    """
    session = db.get(AssessmentSession, uuid.UUID(session_id), with_for_update=True)
    if session is None:
        return
    if db.scalar(select(Score.id).where(Score.session_id == session.id)) is not None:
        logger.info("Session %s already graded; skipping", session_id)
        db.rollback()
        return
    if session.status != "submitted":
        session.status = "submitted"
        session.submitted_at = datetime.now(UTC)

    tasks = db.scalars(
        select(Task).where(Task.assessment_id == session.assessment_id).order_by(Task.order)
    ).all()
    breakdown: dict[str, Any] = {"stub": True, "tasks": {}}
    for task in tasks:
        spec = TaskSpec.model_validate(task.spec)
        snapshot = db.scalars(
            select(FileSnapshot)
            .where(FileSnapshot.session_id == session.id, FileSnapshot.task_id == task.task_id)
            .order_by(FileSnapshot.ts.desc(), FileSnapshot.id.desc())
            .limit(1)
        ).first()
        grade = grade_task(spec, snapshot.files if snapshot else {})
        now = datetime.now(UTC)
        db.add(
            Run(
                session_id=session.id,
                task_id=task.task_id,
                kind="submit",
                result={
                    "visible": grade.visible.model_dump(mode="json"),
                    "hidden": grade.hidden.model_dump(mode="json"),
                },
                integrity=grade.integrity | {"snapshot_id": snapshot.id if snapshot else None},
                ts=now,
            )
        )
        visible = TestCounts(passed=len(grade.visible_passed), total=len(spec.visible_test_ids))
        hidden = TestCounts(passed=len(grade.hidden_passed), total=len(spec.hidden_test_ids))
        event = SubmitEvent(
            session_id=session_id,
            task_id=task.task_id,
            ts=_ms(now),
            type="submit",
            payload=SubmitPayload(visible=visible, hidden=hidden, perf_ms=None, final=True),
        )
        db.add(_event_row(session.id, event))
        breakdown["tasks"][task.task_id] = {
            "visible": visible.model_dump(),
            "hidden": hidden.model_dump(),
        }
    db.add(Score(session_id=session.id, computed_at=datetime.now(UTC), breakdown=breakdown))
    db.commit()


def auto_submit_expired(db: Session) -> list[str]:
    """Lock every active session past its deadline and enqueue its grading."""
    expired = db.scalars(
        update(AssessmentSession)
        .where(
            AssessmentSession.status == "active",
            AssessmentSession.deadline_at <= datetime.now(UTC),
        )
        .values(status="submitted", submitted_at=AssessmentSession.deadline_at)
        .returning(AssessmentSession.id)
    ).all()
    db.commit()
    ids = [str(session_id) for session_id in expired]
    for session_id in ids:
        jobs.enqueue_submit(session_id)
    return ids


def _task(db: Session, session: AssessmentSession, task_id: str) -> Task:
    return db.scalars(
        select(Task).where(Task.assessment_id == session.assessment_id, Task.task_id == task_id)
    ).one()


def _event_row(session_id: uuid.UUID, event: RunEvent | SubmitEvent) -> Event:
    return Event(
        session_id=session_id,
        task_id=event.task_id,
        ts=event.ts,
        type=event.type,
        payload=event.payload.model_dump(mode="json"),
    )


def _empty_result() -> RunResult:
    return RunResult(
        status="ok",
        reason=None,
        duration_ms=0,
        tests=[],
        summary=Summary(passed=0, failed=0, total=0),
        stdout_tail="",
        stderr_tail="",
    )


def _ms(moment: datetime) -> int:
    return int(moment.timestamp() * 1000)
