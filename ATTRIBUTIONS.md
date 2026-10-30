# Attributions

Open-source libraries, datasets, models and borrowed methods used in this project.
Add every new one here in the same change that introduces it (CLAUDE.md).

## Used as dependencies

### Backend (Python, `backend/pyproject.toml`)

| Library | License | Use |
| :--- | :--- | :--- |
| [FastAPI](https://github.com/fastapi/fastapi) | MIT | HTTP API |
| [Uvicorn](https://github.com/encode/uvicorn) | BSD-3-Clause | ASGI server |
| [Pydantic](https://github.com/pydantic/pydantic) / [pydantic-settings](https://github.com/pydantic/pydantic-settings) | MIT | Data models, env config |
| [SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy) | MIT | Database access |
| [Alembic](https://github.com/sqlalchemy/alembic) | MIT | Database migrations |
| [psycopg](https://github.com/psycopg/psycopg) | LGPL-3.0 | PostgreSQL driver |
| [redis-py](https://github.com/redis/redis-py) | MIT | Redis client |
| [Celery](https://github.com/celery/celery) | BSD-3-Clause | Background task queue |
| [OpenAI Python SDK](https://github.com/openai/openai-python) | Apache-2.0 | Client for Featherless's OpenAI-compatible API |
| [Instructor](https://github.com/567-labs/instructor) | MIT | Structured (JSON mode) LLM output with validation retries |
| [Docker SDK for Python](https://github.com/docker/docker-py) | Apache-2.0 | Starting sandbox containers in backend/runner |
| [Hatchling](https://github.com/pypa/hatch) | MIT | Python build backend |
| [pytest](https://github.com/pytest-dev/pytest) | MIT | Tests (dev) |
| [httpx2](https://github.com/pydantic/httpx2) | BSD-3-Clause | HTTP client for FastAPI's TestClient (dev) |
| [Ruff](https://github.com/astral-sh/ruff) | MIT | Lint and format (dev) |
| [jsonschema](https://github.com/python-jsonschema/jsonschema) | MIT | Validating contract fixtures in tests (dev) |
| [datamodel-code-generator](https://github.com/koxudaxi/datamodel-code-generator) | MIT | Generating Pydantic models from contracts/ (dev) |
| [fakeredis](https://github.com/cunla/fakeredis-py) | BSD-3-Clause | In-memory Redis for LLM client tests (dev) |
| [PyYAML](https://github.com/yaml/pyyaml) | MIT | Reading seed concepts.yaml files (dev) |

### Frontend (TypeScript, `frontend/package.json`)

| Library | License | Use |
| :--- | :--- | :--- |
| [Next.js](https://github.com/vercel/next.js) / create-next-app | MIT | App framework and scaffold |
| [React](https://github.com/facebook/react) / React DOM | MIT | UI |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) / @tailwindcss/turbopack | MIT | Styling |
| [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 | Type checking |
| [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) (@types/node, @types/react, @types/react-dom) | MIT | Type definitions |
| [ESLint](https://github.com/eslint/eslint) / eslint-config-next | MIT | Lint |
| [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) | MIT | Generating TypeScript types from contracts/ |
| [Monaco Editor](https://github.com/microsoft/monaco-editor) / [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) | MIT | Candidate IDE editor (P1.4). monaco-editor 0.55.1 is bundled from npm (core editor + a few syntax highlighters, lib/monaco.ts), no CDN (P1.4b) |
| [react-markdown](https://github.com/remarkjs/react-markdown) | MIT | Rendering task statements and repo tours (P1.4) |

### Runner images (`runtimes/`)

| Software | License | Use |
| :--- | :--- | :--- |
| [Python](https://www.python.org/) (`python:3.11.18-slim`) | PSF-2.0 | Python runtime image base |
| [Node.js](https://nodejs.org/) (`node:20.20.2-slim`) | MIT | Node runtime image base |
| [pytest-json-report](https://github.com/numirias/pytest-json-report) | MIT | Machine-readable pytest results |
| [pytest-timeout](https://github.com/pytest-dev/pytest-timeout) | MIT | Per-test timeouts available to task authors |
| [Hypothesis](https://github.com/HypothesisWorks/hypothesis) | MPL-2.0 | Property-based tests |
| [HTTPX](https://github.com/encode/httpx) | BSD-3-Clause | HTTP client for FastAPI test clients in tasks |
| [Jest](https://github.com/jestjs/jest) | MIT | JavaScript test runner |

pytest, FastAPI, SQLAlchemy and Pydantic are also installed in the Python image (listed above).

### Infrastructure (`docker-compose.yml`, Dockerfiles)

| Software | License | Use |
| :--- | :--- | :--- |
| [PostgreSQL 16](https://www.postgresql.org/) (Docker image) | PostgreSQL License | Database |
| [Redis 7](https://github.com/redis/redis) (Docker image) | BSD-3-Clause | Broker, result backend, LLM cache |
| [Python](https://www.python.org/) (`python:3.11-slim`) | PSF-2.0 | API and worker image base |
| [Node.js](https://nodejs.org/) (`node:24-slim`) | MIT | Frontend image base |

### Models and services (via Featherless)

| Model / service | License | Use |
| :--- | :--- | :--- |
| [Featherless API](https://featherless.ai/) | Service | All LLM calls (and, from P4.9, speech) |
| [DeepSeek-V4-Flash](https://huggingface.co/deepseek-ai) (-0731 build) | See model card | Generator and assistant slots |
| [Qwen3-Coder-30B-A3B-Instruct](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct) | Apache-2.0 | Probe slot (480B variant for final calibration) |
| [Meta-Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct) | Llama 3.1 Community License | Interviewer slot (provisional default) |

## Methods we adapted

| Source | License | Use |
| :--- | :--- | :--- |
| [JSON Resume schema](https://github.com/jsonresume/resume-schema) | MIT | `contracts/portfolio.schema.json` follows its `basics`, `skills`, `projects` and `meta` structure and its ISO 8601 date pattern |
| [LeetCode 3, "Longest Substring Without Repeating Characters"](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Problem idea only | `dsa/longest_unique_substring`: the classic sliding-window problem. Statement, stub, reference solution and all cases written by us; no LeetCode text or tests used |

## Planned

From docs/BLUEPRINT.md section 7. Move a row up to "Used as dependencies" or
"Methods we adapted" when it is actually used.

| Resource | License | Planned use |
| :--- | :--- | :--- |
| [SWE-smith](https://github.com/SWE-bench/SWE-smith) (method) | MIT | Bug mutation and issue text (P2.2) |
| [LibCST](https://github.com/Instagram/LibCST) | MIT | Formatting-preserving code edits (P2.2, P2.3) |
| [LeetCodeDataset](https://github.com/newfacade/LeetCodeDataset) | Apache-2.0 | Tagged DSA problems and tests, never served verbatim (P2.6) |
| [EvalPlus](https://github.com/evalplus/evalplus) (method) | Apache-2.0 | Test strengthening, differential testing (P2.7) |
| [mutmut](https://github.com/boxed/mutmut) | BSD-3-Clause | Mutation score, Python (P2.7) |
| [StrykerJS](https://github.com/stryker-mutator/stryker-js) | Apache-2.0 | Mutation score, JavaScript (P2.7) |
| [fast-check](https://github.com/dubzzz/fast-check) | MIT | Property-based tests, JavaScript (P2.7) |
| [llm-sandbox](https://github.com/vndee/llm-sandbox) | MIT | Alternative runner backend |
| [Sandpack](https://github.com/codesandbox/sandpack) | Apache-2.0 | Web preview only |
| [copydetect](https://github.com/blingenf/copydetect) | MIT | Assistant leak guard vs reference (P3.2) |
| [LLM Guard](https://github.com/protectai/llm-guard) (rules) | MIT | Assistant input rules (P3.2) |
| [promptfoo](https://github.com/promptfoo/promptfoo) | MIT | Attack testing of the assistant (P3.6) |
| [py-tree-sitter](https://github.com/tree-sitter/py-tree-sitter) | MIT | Function spans and call graph for the Trail Map (P4.4) |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | Browser API | Interviewer listening (P4.9) |
| [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (via Featherless) | Apache-2.0 | Interviewer voice (P4.9) |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | MIT | Optional speech-recognition fallback (P4.12) |
| [Three.js](https://github.com/mrdoob/three.js) | MIT | Interviewer orb (P4.10) |
| [Bandit](https://github.com/PyCQA/bandit) | Apache-2.0 | Static checks for security tasks |
| [Semgrep CE](https://github.com/semgrep/semgrep) (own rules) | LGPL-2.1 | Static checks for security tasks |
| [catsim](https://github.com/douglasrizzo/catsim) | See repo | Stretch: adaptive mode (IRT) |
| [Dolos](https://github.com/dodona-edu/dolos) | MIT | Stretch: collusion detection |
