.PHONY: up down migrate test test-docker lint contracts runtimes llm-smoke llm-usage

up:
	docker compose up -d --build

down:
	docker compose down

# Apply database migrations (backend/migrations) to the dev database.
migrate:
	docker compose run --rm api alembic upgrade head

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
