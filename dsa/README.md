# dsa

The DSA problem bank. Backend only: mounted read-only at `/dsa` in the api and worker
containers, never into a sandbox. One folder per problem:

| File | What it is |
| :--- | :--- |
| `problem.md` | Statement shown to the candidate (our own words; never copied from a source) |
| `stub.py` | Starter `solution.py` |
| `reference.py` | Reference solution, same function name. Validated against every case in the sandbox when the task is built |
| `cases.json` | `{"visible": [...], "hidden": [...]}`, each `{"id", "input", "expected"}` |
| `make_cases.py` | Regenerates `cases.json` (hand-picked + seeded random inputs, answers from `reference.py`) |

Grading (`backend/app/dsa.py`): the sandbox gets only `{id, input}` pairs and a harness
(`backend/runner/harness/`) that calls the candidate's function with a per-case timeout;
the backend compares outputs with `expected` (exact by default, or the spec's comparator).

Problems: `longest_unique_substring` (sliding_window), used by the P1.3 demo assessment.
