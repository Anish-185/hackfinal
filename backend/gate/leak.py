"""Statement leak checks. The one place that decides whether a statement gives the fix away.

Used by the validation gate and by LLM enrichment (P2.5), so a statement is judged the same
way when it is written and when it is certified.

Domain tasks: a statement leaks if it contains a changed line from the reference side of
the starter-vs-reference diff, or the exact operator/value that fixes a replaced line.
DSA tasks: a statement leaks if it names the bank's original function or parameters.
Matching is on tokens, so whitespace and Markdown backticks don't hide a leak.
LLM-written domain statements (P2.5) must also stay within STATEMENT_MAX_WORDS
(statement_problems combines both for enrich's retry and template fallback).
"""

import difflib
import re

from contracts_gen.task_spec import DsaNames
from gate.diff import diff
from gate.limits import (
    LEAK_MIN_EDIT_CHARS,
    LEAK_MIN_LINE_TOKENS,
    LEAK_MIN_NAME_CHARS,
    STATEMENT_MAX_WORDS,
)

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
    (`page - 1` for a `2` -> `1` fix). Then, when the fix has several separate edits, each
    edit alone (if LEAK_MIN_EDIT_CHARS long) and with one token of context.
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
    if len(changed) > 1:
        for j1, j2 in changed:
            if len("".join(after[j1:j2])) >= LEAK_MIN_EDIT_CHARS:
                runs.append(after[j1:j2])
            runs.append(after[max(0, j1 - 1) : j2 + 1])
    unique = list(dict.fromkeys(tuple(run) for run in runs))
    return [list(run) for run in unique if _fix_like(list(run))]


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


def too_long(statement: str, max_words: int = STATEMENT_MAX_WORDS) -> bool:
    return len(statement.split()) > max_words


def statement_problems(
    statement: str, starter_files: dict[str, str], reference_files: dict[str, str]
) -> list[str]:
    """Why an LLM-written domain statement is rejected (P2.5): leaks, then length."""
    problems = [
        f"gives the fix away: `{found}`"
        for found in domain_leaks(statement, starter_files, reference_files)
    ]
    if too_long(statement):
        problems.append(f"longer than {STATEMENT_MAX_WORDS} words")
    return problems


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
