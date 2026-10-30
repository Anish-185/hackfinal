"""DSA grading. Expected answers never enter the sandbox.

The harness (runner/harness/python_cases.py) gets only {id, input} pairs, calls the
candidate's function on each with a per-case timeout, and reports outputs. This module
compares them with the expected values and builds a normal RunResult, one test per case
id. A report whose case ids differ from the expected ids is error / test_set_mismatch.
"""

import json
import math
from pathlib import Path
from typing import Any

import runner
from app.workspace import build_workspace, protected_reason
from contracts_gen.run_result import RunResult, Summary, TestResult
from contracts_gen.task_spec import Comparator, DsaCase, TaskSpec
from runner import ProgramRun, run_program

HARNESS_PATH = "_harness/run_cases.py"
INPUTS_PATH = "_harness/inputs.json"
CASE_TIMEOUT_S = 2.0
RUN_OVERHEAD_S = 10
SHOWN_CHARS = 200
TEST_SET_MISMATCH = "test_set_mismatch"

_HARNESS = {
    "python311": (Path(runner.__file__).parent / "harness" / "python_cases.py").read_text(),
}


def entry_point(spec: TaskSpec) -> tuple[str, str]:
    """("solution.py", "function") from the first entry symbol, "solution.py::function"."""
    path, _, function = spec.entry_symbols[0].partition("::")
    if not path or not function:
        raise ValueError(f"DSA task {spec.task_id} needs an entry symbol path::function")
    return path, function


def execute_cases(
    spec: TaskSpec,
    candidate_files: dict[str, str],
    cases: list[DsaCase],
    case_timeout_s: float = CASE_TIMEOUT_S,
) -> ProgramRun:
    """Run the harness on `cases` (inputs only) in a fresh sandbox."""
    harness = _HARNESS.get(spec.runtime)
    if harness is None:
        raise ValueError(f"No DSA harness for runtime {spec.runtime!r} yet (node20: P2.6)")
    module, function = entry_point(spec)
    inputs = [{"id": case.id, "input": case.input} for case in cases]
    files = build_workspace(spec, candidate_files, []) | {
        HARNESS_PATH: harness,
        INPUTS_PATH: json.dumps(inputs),
    }
    readonly = frozenset(
        {HARNESS_PATH, INPUTS_PATH} | {p for p in files if protected_reason(p) is not None}
    )

    def command(report_path: str) -> list[str]:
        return [
            "python",
            "-I",
            HARNESS_PATH,
            INPUTS_PATH,
            report_path,
            module,
            function,
            str(case_timeout_s),
        ]

    timeout_s = RUN_OVERHEAD_S + math.ceil(len(cases) * case_timeout_s)
    return run_program(spec.runtime, files, command, timeout_s=timeout_s, readonly=readonly)


def run_cases(
    spec: TaskSpec,
    candidate_files: dict[str, str],
    cases: list[DsaCase],
    expected_ids: list[str],
) -> RunResult:
    run = execute_cases(spec, candidate_files, cases)
    comparator = spec.dsa_cases.comparator if spec.dsa_cases else None
    return results_from_run(run, cases, expected_ids, comparator)


def results_from_run(
    run: ProgramRun,
    cases: list[DsaCase],
    expected_ids: list[str],
    comparator: Comparator | None,
) -> RunResult:
    """Compare the harness's outputs with the expected values (pure; unit-tested)."""
    if run.status != "ok":
        return _result(run, run.status, [])
    report = run.report or {}
    entries = report.get("cases")
    if "fatal" in report or not isinstance(entries, list):
        fatal = str(report.get("fatal") or "the harness did not write a report")
        return _result(run, "error", [], stderr=f"{fatal}\n{run.stderr_tail}")

    by_id = {e.get("id"): e for e in entries if isinstance(e, dict)}
    ids = [e.get("id") for e in entries if isinstance(e, dict)]
    if len(ids) != len(entries) or len(ids) != len(by_id) or set(ids) != set(expected_ids):
        return _result(run, "error", [], reason=TEST_SET_MISMATCH)

    tests = []
    for case in cases:
        entry = by_id[case.id]
        where = f"input {_show(case.input)}"
        if "error" in entry:
            outcome, message = "error", f"{where}: {entry['error']}"
        elif "output" in entry and matches(entry["output"], case.expected, comparator):
            outcome, message = "passed", None
        else:
            got = _show(entry.get("output"))
            outcome, message = "failed", f"{where}: expected {_show(case.expected)}, got {got}"
        tests.append(
            TestResult(
                id=case.id,
                name=f"case {case.id}",
                outcome=outcome,
                duration_ms=max(0, int(entry.get("duration_ms") or 0)),
                message=message,
            )
        )
    return _result(run, "ok", tests)


def matches(output: Any, expected: Any, comparator: Comparator | None) -> bool:
    kind = comparator.kind if comparator else "exact"
    if kind == "unordered_list" and isinstance(output, list) and isinstance(expected, list):
        return sorted(map(_canonical, output)) == sorted(map(_canonical, expected))
    if kind == "float_tolerance":
        return _close(output, expected, comparator.tolerance or 0.0)
    return _canonical(output) == _canonical(expected)


def _close(output: Any, expected: Any, tolerance: float) -> bool:
    if _is_number(output) and _is_number(expected):
        return abs(output - expected) <= tolerance
    if isinstance(output, list) and isinstance(expected, list):
        return len(output) == len(expected) and all(
            _close(o, e, tolerance) for o, e in zip(output, expected, strict=True)
        )
    if isinstance(output, dict) and isinstance(expected, dict):
        return output.keys() == expected.keys() and all(
            _close(output[k], expected[k], tolerance) for k in expected
        )
    return _canonical(output) == _canonical(expected)


def _is_number(value: Any) -> bool:
    return isinstance(value, int | float) and not isinstance(value, bool)


def _canonical(value: Any) -> str:
    """Exact JSON identity: 1, 1.0 and true are all different."""
    return json.dumps(value, sort_keys=True)


def _show(value: Any) -> str:
    text = json.dumps(value)
    return text if len(text) <= SHOWN_CHARS else text[: SHOWN_CHARS - 3] + "..."


def _result(
    run: ProgramRun,
    status: str,
    tests: list[TestResult],
    reason: str | None = None,
    stderr: str | None = None,
) -> RunResult:
    passed = sum(t.outcome == "passed" for t in tests)
    failed = sum(t.outcome in ("failed", "error") for t in tests)
    return RunResult(
        status=status,
        reason=reason,
        duration_ms=run.duration_ms,
        tests=tests,
        summary=Summary(passed=passed, failed=failed, total=len(tests)),
        stdout_tail=run.stdout_tail,
        stderr_tail=run.stderr_tail if stderr is None else stderr,
    )
