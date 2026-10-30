"""Hand-built demo tasks (P1.3): a Novice pagination bug and one DSA problem.

P2.x replaces these with generated tasks; they go through the same contract, grading and
validation. Building needs Docker: test ids are collected and both tasks are validated in
the sandbox (the starter fails at least one visible test; the reference passes everything).
"""

import ast
import json
from dataclasses import dataclass
from typing import Any

from app import grading
from builder.seeds import DSA_DIR, SEEDS_DIR, seed_files
from contracts_gen.task_spec import TaskSpec
from runner import run_tests

EXPENSES_SEED = "py-fastapi-expenses"
PAGINATION_TESTS = "tests/test_pagination.py"
HIDDEN_PAGINATION_TESTS = "tests/test_pagination_hidden.py"
DSA_PROBLEM = "longest_unique_substring"
DSA_CASES_SEED = 20261031  # dsa/longest_unique_substring/make_cases.py

PAGINATION_STATEMENT = """\
## Expenses list pages are wrong

Users of the expenses API report that paging through `GET /expenses` skips data:
the first page doesn't start with their first expense, and the last page is often
empty even though `total` says there are more.

Find and fix the bug so that `page` and `page_size` return the right slice of the
filtered, sorted expenses. Keep the response shape (`items`, `page`, `page_size`,
`total`, `has_next`) unchanged. Run the visible tests to check your fix; more tests
run when you submit.
"""


@dataclass(frozen=True)
class BuiltTask:
    spec: dict[str, Any]
    validation: dict[str, Any]


# --- Bug injection --------------------------------------------------------------------


def inject_offset_bug(source: str) -> str:
    """In paginate(), turn `offset = (page - 1) * page_size` into `offset = page * page_size`.

    Located with the AST and applied as a text splice, so the rest of the file keeps its
    formatting. Deterministic; raises if the pattern isn't there exactly once.
    """
    tree = ast.parse(source)
    paginate = next(
        (n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "paginate"), None
    )
    if paginate is None:
        raise ValueError("paginate() not found")
    sites = [
        node.value.left
        for node in ast.walk(paginate)
        if isinstance(node, ast.Assign)
        and [getattr(t, "id", None) for t in node.targets] == ["offset"]
        and isinstance(node.value, ast.BinOp)
        and isinstance(node.value.op, ast.Mult)
        and isinstance(node.value.left, ast.BinOp)
        and isinstance(node.value.left.op, ast.Sub)
        and isinstance(node.value.left.right, ast.Constant)
        and node.value.left.right.value == 1
    ]
    if len(sites) != 1:
        raise ValueError(f"expected one `offset = (page - 1) * ...`, found {len(sites)}")
    minus_one = sites[0]
    lines = source.splitlines(keepends=True)
    line = lines[minus_one.lineno - 1].encode()
    start, end = minus_one.col_offset, minus_one.end_col_offset  # UTF-8 byte offsets
    if line[start - 1 : start] == b"(" and line[end : end + 1] == b")":
        start, end = start - 1, end + 1
    replacement = ast.get_source_segment(source, minus_one.left).encode()
    lines[minus_one.lineno - 1] = (line[:start] + replacement + line[end:]).decode()
    return "".join(lines)


# --- Test splitting -------------------------------------------------------------------


def collect_test_names(source: str) -> list[str]:
    """Top-level test functions, in source order."""
    return [
        node.name
        for node in ast.parse(source).body
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)
        and node.name.startswith("test_")
    ]


def split_test_module(source: str, selected: set[str]) -> tuple[str, str]:
    """(module with the `selected` tests, module with the other tests).

    Both keep every non-test statement (imports, fixtures, helpers) in source order.
    """
    names = collect_test_names(source)
    if unknown := selected - set(names):
        raise ValueError(f"unknown tests: {sorted(unknown)}")
    lines = source.splitlines()
    header: list[tuple[ast.stmt, str]] = []
    tests: list[tuple[str, str]] = []
    for node in ast.parse(source).body:
        first = min([node.lineno] + [d.lineno for d in getattr(node, "decorator_list", [])])
        text = "\n".join(lines[first - 1 : node.end_lineno])
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name in names:
            tests.append((node.name, text))
        else:
            header.append((node, text))

    def module(keep: set[str]) -> str:
        parts: list[str] = []
        previous: ast.stmt | None = None
        for node, text in header:
            imports = (ast.Import, ast.ImportFrom)
            joined = (
                previous is not None and isinstance(previous, imports) and isinstance(node, imports)
            )
            parts.append(("\n" if joined else "\n\n\n" if parts else "") + text)
            previous = node
        parts += ["\n\n\n" + text for name, text in tests if name in keep]
        return "".join(parts) + "\n"

    return module(selected), module(set(names) - selected)


def choose_visible(names: list[str], failing: set[str]) -> list[str]:
    """About a third of `names`: the first failing test, then passing ones, in source order."""
    if not failing:
        raise ValueError("the starter must fail at least one test")
    count = max(1, round(len(names) / 3))
    first_failing = next(n for n in names if n in failing)
    passing = [n for n in names if n not in failing]
    return [n for n in names if n == first_failing or n in passing[: count - 1]]


# --- Domain task ----------------------------------------------------------------------


def build_pagination_task() -> BuiltTask:
    seed_dir = SEEDS_DIR / EXPENSES_SEED
    files = seed_files(seed_dir)
    reference_utils = files["app/utils.py"]
    starter = {
        path: content
        for path, content in files.items()
        if path.startswith("app/") or path in ("pytest.ini", "tests/conftest.py")
    }
    starter["app/utils.py"] = inject_offset_bug(reference_utils)

    pagination = files[PAGINATION_TESTS]
    names = collect_test_names(pagination)
    visible_names = choose_visible(names, _failing_functions(starter, pagination))
    visible_source, hidden_source = split_test_module(pagination, set(visible_names))
    other_tests = sorted(p for p in files if p.startswith("tests/test_") and p != PAGINATION_TESTS)

    spec = {
        "task_id": "expenses-pagination",
        "version": 1,
        "tier": "novice",
        "kind": "domain",
        "mode": "seed",
        "seed_id": EXPENSES_SEED,
        "runtime": "python311",
        "dsa_tags": [],
        "statement_md": PAGINATION_STATEMENT,
        "repo_tour_md": files["README_TOUR.md"],
        "starter_files": starter,
        "reference_ref": f"seeds/{EXPENSES_SEED}",
        "target_symbols": ["app/utils.py::paginate"],
        "entry_symbols": ["app/routes.py::list_expenses"],
        "visible_tests": [{"path": PAGINATION_TESTS, "content": visible_source}],
        "hidden_tests": [{"path": HIDDEN_PAGINATION_TESTS, "content": hidden_source}]
        + [{"path": p, "content": files[p]} for p in other_tests],
        "dsa_cases": None,
        "perf": None,
        "time_budget_min": 35,
        "random_seeds": [],
        "ai_solve_rate": 0.0,
        "difficulty_index": 0.0,
    }
    spec = grading.derive_test_ids(spec | {"certificate": _certificate(["app/utils.py"])})
    return _validated(spec, {"app/utils.py": reference_utils}, ["app/utils.py"])


def _failing_functions(starter: dict[str, str], pagination: str) -> set[str]:
    """Names of the pagination tests that fail on the starter (parametrized ones collapsed)."""
    result = run_tests("python311", starter | {PAGINATION_TESTS: pagination}, [PAGINATION_TESTS])
    if result.status != "ok":
        raise ValueError(f"pagination tests could not run on the starter: {result.status}")
    return {t.id.split("::", 1)[1].split("[", 1)[0] for t in result.tests if t.outcome != "passed"}


# --- DSA task -------------------------------------------------------------------------


def dsa_task_spec() -> dict[str, Any]:
    """The DSA spec, test ids filled in. Needs no Docker; build_dsa_task validates it."""
    problem_dir = DSA_DIR / DSA_PROBLEM
    cases = json.loads((problem_dir / "cases.json").read_text())
    entry = "solution.py::length_of_longest_substring"
    spec = {
        "task_id": "dsa-longest-unique-substring",
        "version": 1,
        "tier": "novice",
        "kind": "dsa",
        "mode": "seed",
        "seed_id": DSA_PROBLEM,
        "runtime": "python311",
        "dsa_tags": ["sliding_window"],
        "statement_md": (problem_dir / "problem.md").read_text(),
        "repo_tour_md": "",
        "starter_files": {"solution.py": (problem_dir / "stub.py").read_text()},
        "reference_ref": f"dsa/{DSA_PROBLEM}/reference.py",
        "target_symbols": [entry],
        "entry_symbols": [entry],
        "visible_tests": [],
        "hidden_tests": [],
        "dsa_cases": {"visible": cases["visible"], "hidden": cases["hidden"], "comparator": None},
        "perf": None,
        "time_budget_min": 25,
        "random_seeds": [DSA_CASES_SEED],
        "certificate": _certificate(["solution.py"]),
        "ai_solve_rate": 0.0,
        "difficulty_index": 0.0,
    }
    return grading.derive_test_ids(spec)


def build_dsa_task() -> BuiltTask:
    reference = (DSA_DIR / DSA_PROBLEM / "reference.py").read_text()
    return _validated(dsa_task_spec(), {"solution.py": reference}, ["solution.py"])


# --- Validation -----------------------------------------------------------------------


def _certificate(scope_files: list[str], reference_pass: bool = False, starter_fail: bool = False):
    # mutation_score, bruteforce_agree and perf are filled by the validation gate (P2.7).
    return {
        "reference_pass": reference_pass,
        "starter_fail": starter_fail,
        "mutation_score": 0.0,
        "bruteforce_agree": None,
        "perf_ref_ms": None,
        "perf_naive_ms": None,
        "scope_files": scope_files,
    }


def _validated(
    spec: dict[str, Any], reference_files: dict[str, str], scope_files: list[str]
) -> BuiltTask:
    """Grade the starter and the reference in the sandbox; refuse a task that isn't sound."""
    task = TaskSpec.model_validate(spec)
    starter = grading.grade_task(task, {})
    reference = grading.grade_task(task, reference_files)

    def counts(grade: grading.TaskGrade) -> dict[str, Any]:
        return {
            "visible": f"{len(grade.visible_passed)}/{len(task.visible_test_ids)}",
            "hidden": f"{len(grade.hidden_passed)}/{len(task.hidden_test_ids)}",
        }

    starter_fails_visible = len(starter.visible_passed) < len(task.visible_test_ids)
    starter_fails_hidden = len(starter.hidden_passed) < len(task.hidden_test_ids)
    reference_passes_all = len(reference.visible_passed) == len(task.visible_test_ids) and len(
        reference.hidden_passed
    ) == len(task.hidden_test_ids)
    validation = {
        "task_id": task.task_id,
        "starter": counts(starter),
        "reference": counts(reference),
        "starter_fails_visible": starter_fails_visible,
        "reference_passes_all": reference_passes_all,
    }
    if not (starter_fails_visible and reference_passes_all):
        raise ValueError(f"task {task.task_id} failed validation: {validation}")
    spec = spec | {
        "certificate": _certificate(scope_files, reference_passes_all, starter_fails_hidden)
    }
    return BuiltTask(
        spec=TaskSpec.model_validate(spec).model_dump(mode="json"), validation=validation
    )
