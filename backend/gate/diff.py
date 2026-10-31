"""The starter-vs-reference diff: which files and lines the fix changes."""

import difflib
from dataclasses import dataclass


@dataclass(frozen=True)
class Diff:
    files: list[str]
    """Paths whose content differs, sorted."""
    changed_lines: int
    """A replaced line counts once: max(starter lines, reference lines) per changed block."""
    reference_lines: list[str]
    """Lines on the reference side of the diff (what the candidate has to write)."""
    replaced: list[tuple[str, str]]
    """(starter line, reference line) pairs from blocks replacing as many lines as they remove."""


def diff(starter: dict[str, str], reference: dict[str, str]) -> Diff:
    files, changed, reference_lines, replaced = [], 0, [], []
    for path in sorted(set(starter) | set(reference)):
        before = starter.get(path, "").splitlines()
        after = reference.get(path, "").splitlines()
        if before == after:
            continue
        files.append(path)
        matcher = difflib.SequenceMatcher(None, before, after, autojunk=False)
        for op, i1, i2, j1, j2 in matcher.get_opcodes():
            if op == "equal":
                continue
            changed += max(i2 - i1, j2 - j1)
            reference_lines += after[j1:j2]
            if op == "replace" and i2 - i1 == j2 - j1:
                replaced += zip(before[i1:i2], after[j1:j2], strict=True)
    return Diff(files, changed, reference_lines, replaced)
