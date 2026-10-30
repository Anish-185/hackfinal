from typing import Any

from sqlalchemy.orm import Session

from app.models import Assessment, Task
from contracts_gen.portfolio import Portfolio
from contracts_gen.task_spec import TaskSpec


def create_assessment(
    db: Session, portfolio: dict[str, Any], tier: str, specs: list[dict[str, Any]]
) -> Assessment:
    """Store an assessment and its tasks (in the given order). Validates against contracts/."""
    validated = Portfolio.model_validate(portfolio)
    assessment = Assessment(
        candidate_name=validated.basics.name,
        portfolio=portfolio,
        tier=tier,
        status="ready",
    )
    db.add(assessment)
    db.flush()
    for order, spec in enumerate(specs):
        task_spec = TaskSpec.model_validate(spec)
        db.add(Task(assessment_id=assessment.id, task_id=task_spec.task_id, spec=spec, order=order))
    db.flush()
    return assessment
