"""Score a submitted session from stored records only: submit runs, events, task specs.

No LLM and no sandbox: the same records always give the same breakdown, so a re-grade
reproduces the score exactly. Floats are rounded so the stored JSON is stable.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import dsa
from app.models import Assessment, AssessmentSession, Event, Run, Task
from contracts_gen.event import HiddenSample
from contracts_gen.run_result import RunResult
from contracts_gen.score_breakdown import ScoreBreakdown, TaskScore, TestCounts
from contracts_gen.task_spec import TaskSpec
from scoring import correctness as c

SCORING_VERSION = "1"
HINT_EVENT_TYPES = ("hint_request", "hint_response")


def score_session(db: Session, session_id: uuid.UUID) -> ScoreBreakdown:
    session = db.get(AssessmentSession, session_id)
    if session is None:
        raise ValueError(f"session {session_id} not found")
    tier = db.get(Assessment, session.assessment_id).tier
    tasks = db.scalars(
        select(Task).where(Task.assessment_id == session.assessment_id).order_by(Task.order)
    ).all()
    first_focus = _per_task(db, session_id, "focus", func.min(Event.ts))
    last_edit = _per_task(db, session_id, "edit", func.max(Event.ts))
    run_counts = _per_task(db, session_id, "run", func.count(Event.id))

    scores = [
        _task_score(
            TaskSpec.model_validate(task.spec),
            str(session_id),
            _latest_submit(db, session_id, task.task_id),
            first_focus.get(task.task_id),
            last_edit.get(task.task_id),
            run_counts.get(task.task_id, 0),
        )
        for task in tasks
    ]
    mean_correctness = c.mean([s.correctness for s in scores])
    efficiency = None if tier == "novice" else _ai_efficiency(db, session_id, mean_correctness)
    final = round(c.final_score(tier, mean_correctness, efficiency), 2)
    return ScoreBreakdown(
        scoring_version=SCORING_VERSION,
        tier=tier,
        final_score=final,
        band=c.band(final),
        mean_correctness=round(mean_correctness, 2),
        ai_efficiency=None if efficiency is None else round(efficiency, 4),
        tasks=scores,
    )


def _task_score(
    spec: TaskSpec,
    session_id: str,
    submit: Run | None,
    first_focus: int | None,
    last_edit: int | None,
    runs: int,
) -> TaskScore:
    """Counts come from the submit run; a task without one (never graded) passes nothing.

    DSA hidden cases are the sample stored on the submit run (never re-sampled), or the
    session's sample when there is no submit run.
    """
    visible_passed = hidden_passed = 0
    perf_ms = None
    sample = dsa.hidden_sample(spec, session_id)
    if submit is not None and "hidden_sample" in submit.result:
        sample = HiddenSample.model_validate(submit.result["hidden_sample"])
    hidden_expected = sample.case_ids if sample is not None else spec.hidden_test_ids
    if submit is not None:
        visible = RunResult.model_validate(submit.result["visible"])
        hidden = RunResult.model_validate(submit.result["hidden"])
        visible_passed = len(c.passed_ids(visible, spec.visible_test_ids))
        hidden_passed = len(c.passed_ids(hidden, hidden_expected))
        # Written by the submit job once perf is measured (Master tasks, P2.4).
        perf_ms = submit.result.get("perf_ms")
    visible_rate = c.rate(visible_passed, len(spec.visible_test_ids))
    hidden_rate = c.rate(hidden_passed, len(hidden_expected))
    budget_ms = spec.perf.budget_ms if spec.perf else None
    factor = c.perf_factor(budget_ms, perf_ms)
    time_ms = None
    if first_focus is not None and last_edit is not None:
        time_ms = max(0, last_edit - first_focus)
    return TaskScore(
        task_id=spec.task_id,
        kind=spec.kind,
        visible=TestCounts(passed=visible_passed, total=len(spec.visible_test_ids)),
        hidden=TestCounts(passed=hidden_passed, total=len(hidden_expected)),
        visible_rate=_round(visible_rate, 4),
        hidden_rate=_round(hidden_rate, 4),
        perf_budget_ms=budget_ms,
        perf_ms=perf_ms,
        perf_factor=round(factor, 4),
        correctness=round(c.correctness(visible_rate, hidden_rate, factor), 2),
        time_ms=time_ms,
        runs=runs,
    )


def _ai_efficiency(db: Session, session_id: uuid.UUID, mean_correctness: float) -> float:
    """E with zero hints is mean_correctness / 100 (BLUEPRINT §5). The hint formula is P3.4."""
    hints = db.scalar(
        select(func.count(Event.id)).where(
            Event.session_id == session_id, Event.type.in_(HINT_EVENT_TYPES)
        )
    )
    if hints:
        raise NotImplementedError("AI efficiency with hints is added in P3.4")
    return mean_correctness / 100.0


def _latest_submit(db: Session, session_id: uuid.UUID, task_id: str) -> Run | None:
    return db.scalars(
        select(Run)
        .where(Run.session_id == session_id, Run.task_id == task_id, Run.kind == "submit")
        .order_by(Run.ts.desc(), Run.id.desc())
        .limit(1)
    ).first()


def _per_task(db: Session, session_id: uuid.UUID, event_type: str, aggregate) -> dict:
    rows = db.execute(
        select(Event.task_id, aggregate)
        .where(Event.session_id == session_id, Event.type == event_type)
        .group_by(Event.task_id)
    )
    return {task_id: value for task_id, value in rows}


def _round(value: float | None, digits: int) -> float | None:
    return None if value is None else round(value, digits)
