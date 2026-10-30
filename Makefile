.PHONY: up down test lint contracts

up:
	docker compose up -d --build

down:
	docker compose down

# Starts postgres/redis if needed; the health test hits the real services.
test:
	docker compose run --rm api pytest

lint:
	docker compose run --rm --no-deps api ruff check .
	docker compose run --rm --no-deps api ruff format --check .
	docker compose run --rm --no-deps frontend npm run lint

# Regenerate types from contracts/*.schema.json. Commit the output.
contracts:
	docker compose run --rm --no-deps api python scripts/generate_contracts.py
	docker compose run --rm --no-deps frontend npm run --silent contracts
