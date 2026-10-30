# Attributions

Open-source libraries, datasets, and borrowed methods used in this project.

## Backend (Python)

| Library | License | Use |
| :--- | :--- | :--- |
| [FastAPI](https://github.com/fastapi/fastapi) | MIT | HTTP API |
| [Uvicorn](https://github.com/encode/uvicorn) | BSD-3-Clause | ASGI server |
| [Pydantic](https://github.com/pydantic/pydantic) / [pydantic-settings](https://github.com/pydantic/pydantic-settings) | MIT | Data models, env config |
| [SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy) | MIT | Database access |
| [psycopg](https://github.com/psycopg/psycopg) | LGPL-3.0 | PostgreSQL driver |
| [redis-py](https://github.com/redis/redis-py) | MIT | Redis client |
| [Celery](https://github.com/celery/celery) | BSD-3-Clause | Background task queue |
| [Hatchling](https://github.com/pypa/hatch) | MIT | Python build backend |
| [pytest](https://github.com/pytest-dev/pytest) | MIT | Tests |
| [httpx2](https://github.com/pydantic/httpx2) | BSD-3-Clause | HTTP client for FastAPI's TestClient |
| [Ruff](https://github.com/astral-sh/ruff) | MIT | Lint and format |
| [jsonschema](https://github.com/python-jsonschema/jsonschema) | MIT | Validating contract fixtures in tests |
| [datamodel-code-generator](https://github.com/koxudaxi/datamodel-code-generator) | MIT | Generating Pydantic models from contracts/ |
| [OpenAI Python SDK](https://github.com/openai/openai-python) | Apache-2.0 | Client for Featherless's OpenAI-compatible API |
| [Instructor](https://github.com/567-labs/instructor) | MIT | Structured (JSON mode) LLM output with validation retries |
| [fakeredis](https://github.com/cunla/fakeredis-py) | BSD-3-Clause | In-memory Redis for LLM client tests |

## Models (via Featherless)

| Model | License | Use |
| :--- | :--- | :--- |
| [DeepSeek-V4-Flash](https://huggingface.co/deepseek-ai) (-0731 build) | See model card | Generator and assistant slots |
| [Qwen3-Coder-30B-A3B-Instruct](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct) | Apache-2.0 | Probe slot (480B variant for final calibration) |

## Frontend (TypeScript)

| Library | License | Use |
| :--- | :--- | :--- |
| [Next.js](https://github.com/vercel/next.js) / create-next-app | MIT | App framework and scaffold |
| [React](https://github.com/facebook/react) | MIT | UI |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | MIT | Styling |
| [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 | Type checking |
| [ESLint](https://github.com/eslint/eslint) / eslint-config-next | MIT | Lint |
| [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) | MIT | Generating TypeScript types from contracts/ |

## Schemas and borrowed methods

| Source | License | Use |
| :--- | :--- | :--- |
| [JSON Resume schema](https://github.com/jsonresume/resume-schema) | MIT | `contracts/portfolio.schema.json` follows its `basics`, `skills`, `projects` and `meta` structure and its ISO 8601 date pattern |

## Infrastructure

| Software | License | Use |
| :--- | :--- | :--- |
| [PostgreSQL 16](https://www.postgresql.org/) (Docker image) | PostgreSQL License | Database |
| [Redis 7](https://github.com/redis/redis) (Docker image) | BSD-3-Clause | Broker, result backend |
