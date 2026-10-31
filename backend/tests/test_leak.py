"""Statement leak checks (gate/leak.py), shared by the P2.7 gate and P2.5 enrichment.

The first group came with the gate (P2.7), the second with enrichment (P2.5).
"""

import pytest

from contracts_gen.task_spec import DsaNames, NameMapping
from gate import leak

# --- Leak checks (gate/leak.py) -------------------------------------------------------


def test_leak_checks_ignore_prose_and_short_lines() -> None:
    starter = {"a.py": "def f(xs):\n    return xs\n"}
    reference = {"a.py": "def f(xs):\n    return total\n"}

    assert leak.domain_leaks("It should return total spend.", starter, reference) == []


def test_a_multi_token_fix_leaks_without_its_context() -> None:
    starter = {"u.py": "offset = page * page_size\n"}
    reference = {"u.py": "offset = (page - 1) * page_size\n"}

    assert leak.domain_leaks("Use `(page - 1)` for it.", starter, reference) == ["( page - 1 )"]


def test_fix_fragments_cover_an_operator_flip() -> None:
    fragments = leak.fix_fragments("return a < b", "return a <= b")

    assert ["a", "<=", "b"] in fragments
    starter, reference = {"m.py": "return a < b\n"}, {"m.py": "return a <= b\n"}
    assert leak.domain_leaks("make it `a <= b`", starter, reference) == ["a <= b"]


def test_name_leaks_check_only_renamed_names_of_three_or_more_chars() -> None:
    names = DsaNames(
        function=NameMapping(original="two_sum", renamed="find_pair"),
        parameters=[
            NameMapping(original="nums", renamed="amounts"),
            NameMapping(original="k", renamed="goal"),
            NameMapping(original="target", renamed="target"),
        ],
    )

    assert leak.name_leaks("Given nums and k, find a target pair.", names) == ["nums"]
    assert leak.name_leaks("Use two_sum_cache here", names) == []
    assert leak.name_leaks("anything", None) == []


# --- From enrichment (P2.5) -----------------------------------------------------------

STARTER = {"app/utils.py": "def paginate(page, page_size):\n    offset = page * page_size\n"}
REFERENCE = {
    "app/utils.py": "def paginate(page, page_size):\n    offset = (page - 1) * page_size\n"
}
SYMPTOMS = (
    "Expense pages skip the first entries\nPage 1 of `GET /expenses` starts at the third "
    "expense instead of the first. Each page should hold the next `page_size` expenses."
)


@pytest.mark.parametrize(
    "statement",
    [
        "Use offset = (page - 1) * page_size.",  # the reference line
        "The offset should use `(page-1)`.",  # the fixing tokens, without spaces
    ],
)
def test_leak_check_catches_a_statement_containing_the_fix(statement) -> None:
    assert leak.domain_leaks(statement, STARTER, REFERENCE)
    assert leak.statement_problems(statement, STARTER, REFERENCE)[0].startswith(
        "gives the fix away"
    )


def test_leak_check_passes_a_statement_of_symptoms() -> None:
    assert leak.statement_problems(SYMPTOMS, STARTER, REFERENCE) == []


def test_leak_check_enforces_the_word_limit() -> None:
    assert leak.statement_problems("word " * 201, STARTER, REFERENCE) == ["longer than 200 words"]
    assert not leak.too_long("word " * 200)


def test_each_edit_of_a_split_fix_is_a_fragment() -> None:
    # Two separate edits: `<` -> `<=` and `0` -> `1`. Each one alone gives the fix away.
    fragments = leak.fix_fragments("if a < limit and b > 0:", "if a <= limit and b > 1:")

    assert ["a", "<=", "limit"] in fragments
    assert [">", "1", ":"] in fragments
    assert ["1"] not in fragments  # a lone 1 is too short to count on its own
    starter, reference = (
        {"m.py": "if a < limit and b > 0:\n"},
        {"m.py": "if a <= limit and b > 1:\n"},
    )
    assert leak.domain_leaks("check that b > 1: holds", starter, reference)
