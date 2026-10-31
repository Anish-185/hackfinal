"""Statement leak checks. The one place that decides whether a statement gives the fix away.

Used by the validation gate and by LLM enrichment (P2.5), so a statement is judged the same
way when it is written and when it is certified.

Domain tasks: a statement leaks if it contains a changed line from the reference side of
the starter-vs-reference diff, or the exact operator/value that fixes a replaced line.
DSA tasks: a statement leaks if it names the bank's original function or parameters.
Matching is on tokens, so whitespace and Markdown backticks don't hide a leak.
"""

import difflib
import re

from contracts_gen.task_spec import DsaNames
from gate.diff import diff
from gate.limits import LEAK_MIN_LINE_TOKENS, LEAK_MIN_NAME_CHARS

_TOKEN = re.compile(r"\w+|==|!=|<=|>=|\*\*|//|->|\+=|-=|[^\w\s]")


def tokens(text: str) -> list[str]:
    return _TOKEN.findall(text)


def _contains(haystack: list[str], needle: list[str]) -> bool:
    n = len(needle)
    return n > 0 and any(haystack[i : i + n] == needle for i in range(len(haystack) - n + 1))


def _has_operator(run: list[str]) -> bool:
    return any(not t[0].isalnum() and t != "_" for t in run)


def _code_like(line: list[str]) -> bool:
    return len(line) >= LEAK_MIN_LINE_TOKENS and _has_operator(line)


def _fix_like(fragment: list[str]) -> bool:
    """An operator or a number in it: `page - 1`, `a <= b`, `return 0` (not `return total`)."""
    return _has_operator(fragment) or any(t[0].isdigit() for t in fragment)


def fix_fragments(starter_line: str, reference_line: str) -> list[list[str]]:
    """Token runs that give away how `starter_line` becomes `reference_line`.

    The reference-side span covering every changed token (if it has 2+ tokens), the span
    with one token of context on each side, and with two tokens of context on the left
    (`page - 1` for a `2` -> `1` fix).
    Only runs with an operator or a number count. Empty when the fix only deletes tokens.
    """
    before, after = tokens(starter_line), tokens(reference_line)
    changed = [
        (j1, j2)
        for op, _, _, j1, j2 in difflib.SequenceMatcher(None, before, after).get_opcodes()
        if op != "equal" and j2 > j1
    ]
    if not changed:
        return []
    start, end = changed[0][0], changed[-1][1]
    runs = [after[max(0, start - 1) : end + 1], after[max(0, start - 2) : end]]
    if end - start >= 2:  # specific enough without context: `(page - 1)` for `page`
        runs.insert(0, after[start:end])
    return [run for run in runs if _fix_like(run)]


def domain_leaks(
    statement: str, starter_files: dict[str, str], reference_files: dict[str, str]
) -> list[str]:
    """What the statement gives away about the fix: changed lines and fix fragments."""
    told = tokens(statement)
    changes = diff(starter_files, reference_files)
    leaks = []
    for line in dict.fromkeys(changes.reference_lines):
        line_tokens = tokens(line)
        if _code_like(line_tokens) and _contains(told, line_tokens):
            leaks.append(line.strip())
    for before, after in changes.replaced:
        for fragment in fix_fragments(before, after):
            if _contains(told, fragment):
                leaks.append(" ".join(fragment))
                break
    return list(dict.fromkeys(leaks))


def name_leaks(statement: str, names: DsaNames | None) -> list[str]:
    """Original (bank) names that appear in the statement as whole words."""
    if names is None:
        return []
    mappings = [names.function, *names.parameters]
    return [
        m.original
        for m in mappings
        if m.original != m.renamed
        and len(m.original) >= LEAK_MIN_NAME_CHARS
        and re.search(rf"(?<![A-Za-z0-9_]){re.escape(m.original)}(?![A-Za-z0-9_])", statement)
    ]
