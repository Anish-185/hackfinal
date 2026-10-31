"""DSA test strength: how many cases trivial stubs get right.

The stubs are constant or identity functions, so their outputs are computed here on the
backend and compared with the expected values; nothing runs in a sandbox.
"""

from typing import Any

from app.dsa import matches
from contracts_gen.task_spec import TaskSpec


def _first_argument(case_input: Any) -> Any:
    if isinstance(case_input, dict):
        return next(iter(case_input.values()), None)
    if isinstance(case_input, list):
        return case_input[0] if case_input else None
    return case_input


def _empty_like(value: Any) -> Any:
    """The empty value of `value`'s JSON type (bool is checked before int)."""
    for kind, empty in ((bool, False), (list, []), (dict, {}), (str, ""), (int, 0), (float, 0.0)):
        if isinstance(value, kind):
            return empty
    return None


def stub_fail_rates(spec: TaskSpec) -> dict[str, float]:
    """Share of all cases (visible + hidden) each stub fails, by stub name."""
    cases = spec.dsa_cases.visible + spec.dsa_cases.hidden
    if not cases:
        return {}
    empty = _empty_like(cases[0].expected)
    stubs = {
        "first_argument": _first_argument,
        "empty_value": lambda _: empty,
        "zero": lambda _: 0,
        "none": lambda _: None,
    }
    comparator = spec.dsa_cases.comparator
    return {
        name: sum(not matches(stub(c.input), c.expected, comparator) for c in cases) / len(cases)
        for name, stub in stubs.items()
    }
