"""Resolve a task's reference_ref to the reference solution's files (backend only)."""

from builder.dsa_bank import load_bank, wrapped_reference
from builder.seeds import DSA_DIR, SEEDS_DIR, seed_files
from contracts_gen.task_spec import TaskSpec


def reference_files(spec: TaskSpec) -> dict[str, str]:
    """The files a correct solution consists of, at the starter's paths.

    seeds/<seed_id>: the seed's version of every starter file (the seed is the reference).
    dsa/<problem>/reference.py: solution.py with the bank reference; for renamed problems,
    wrapped with the task's names. DSA references are Python for every runtime (the Python
    reference is the oracle, as in builder.dsa_bank.reference_mismatch).
    """
    kind, _, rest = spec.reference_ref.partition("/")
    if kind == "seeds":
        seed_dir = SEEDS_DIR / rest
        if not seed_dir.is_dir():
            raise ValueError(f"unknown seed {rest!r}")
        files = seed_files(seed_dir)
        return {path: files.get(path, content) for path, content in spec.starter_files.items()}
    if kind == "dsa":
        problem_id = rest.split("/", 1)[0]
        if spec.dsa_names is not None:
            problem = next((p for p in load_bank() if p.id == problem_id), None)
            if problem is None:
                raise ValueError(f"unknown DSA bank problem {problem_id!r}")
            return {"solution.py": wrapped_reference(problem, spec.dsa_names)}
        path = DSA_DIR / rest
        if not path.is_file():
            raise ValueError(f"no reference at {spec.reference_ref!r}")
        return {"solution.py": path.read_text(encoding="utf-8")}
    raise ValueError(f"unsupported reference_ref {spec.reference_ref!r}")
