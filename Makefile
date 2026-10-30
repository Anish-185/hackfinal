.PHONY: up down migrate seed-demo e2e test test-docker lint contracts runtimes llm-smoke llm-usage

up:
	docker compose up -d --build

down:
	docker compose down

# Apply database migrations (backend/migrations) to the dev database.
migrate:
	docker compose run --rm api alembic upgrade head

# Build and validate the P1.3 demo tasks in the sandbox, store an assessment, start its
# session and print the URL. Runs in the worker (it needs the Docker socket).
seed-demo:
	docker compose run --rm worker sh -c "alembic upgrade head && python -m builder.seed_demo"

# Headless-browser run of the demo against the running stack (`make up` first): a fresh
# seed-demo session, fix both tasks in the bundled Monaco, Run, Submit, open the report
# and assert the scores. Any request leaving the stack fails it. ~2 min.
e2e:
	./e2e/run.sh

# Starts postgres/redis if needed; the health test hits the real services. API tests
# build their own <db>_test database from the migrations, never touching dev data.
test:
	docker compose run --rm api pytest

# Runner tests that start real sandbox containers. Needs `make runtimes` first. Runs in the
# worker, the only service with the Docker socket.
test-docker:
	docker compose run --rm worker pytest -m docker --durations=0

lint:
	docker compose run --rm --no-deps api ruff check . /seeds
	docker compose run --rm --no-deps api ruff format --check . /seeds
	docker compose run --rm --no-deps frontend npm run lint

# Regenerate types from contracts/*.schema.json. Commit the output.
contracts:
	docker compose run --rm --no-deps api python scripts/generate_contracts.py
	docker compose run --rm --no-deps frontend npm run --silent contracts

# Sandbox images used by backend/runner.
runtimes:
	docker build -t assess-python311 runtimes/python311
	docker build -t assess-node20 runtimes/node20

# One small real request per model slot. Spends Featherless credits on a cache miss.
llm-smoke:
	docker compose run --rm api python -m llm.smoke

# Tokens and estimated spend per slot.
llm-usage:
	docker compose run --rm api python -m llm.usage
