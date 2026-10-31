"""`make seed-demo`: build and validate the two P1.3 tasks, run the validation gate on them
(backend/gate; both must pass, no LLM calls), store an assessment for the portfolio fixture
with the certified specs, start its session and print the session URL.

Starting the session starts its 60-minute timer; run this again for a fresh one.
"""

import json
import os

from app.assessments import create_assessment, get_or_start_session
from app.db import SessionLocal
from builder.manual import build_dsa_task, build_pagination_task
from builder.seeds import REPO_ROOT
from gate import certify, rules_profile

PORTFOLIO = REPO_ROOT / "contracts" / "fixtures" / "portfolio.valid.json"


def main() -> None:
    tasks = [build_pagination_task(), build_dsa_task()]
    for task in tasks:
        v = task.validation
        starter, reference = v["starter"], v["reference"]
        print(
            f"{v['task_id']}: starter visible {starter['visible']}, hidden {starter['hidden']} "
            f"(fails a visible test: {v['starter_fails_visible']}); "
            f"reference visible {reference['visible']}, hidden {reference['hidden']} "
            f"(passes everything: {v['reference_passes_all']})"
        )
    portfolio = json.loads(PORTFOLIO.read_text())
    profile = rules_profile(portfolio)
    specs = []
    for task in tasks:
        spec, reasons = certify(task.spec, profile)
        if reasons:
            raise SystemExit(f"{task.spec['task_id']} failed the gate: {json.dumps(reasons)}")
        print(f"{spec['task_id']}: gate passed, certificate {json.dumps(spec['certificate'])}")
        specs.append(spec)
    with SessionLocal() as db:
        assessment = create_assessment(db, portfolio, "novice", specs)
        db.commit()
        session, _ = get_or_start_session(db, assessment.id)
    frontend = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    print(f"assessment {assessment.id}")
    print(
        f"session URL: {frontend}/session/{session.id}  (deadline {session.deadline_at:%H:%M} UTC)"
    )


if __name__ == "__main__":
    main()
