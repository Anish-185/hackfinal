# Portfolio-Driven Assessment Platform

## What we're building
A platform that turns a candidate's JSON portfolio into a validated 60-minute
coding assessment (one domain task + one DSA task) in their own tech stack,
runs it in sandboxes, offers a guarded AI assistant on Adept/Master tiers,
and produces a deterministic performance report.
Full plan and progress log: docs/BLUEPRINT.md. Read it before any task.

## Non-negotiable rules
1. LLMs never decide correctness or scores. Scores come only from test
   results and the formulas in backend/scoring.
2. Reference solutions and hidden tests never leave the backend: not to the
   browser, not into the assistant model's context, not in any API response.
3. Candidate code runs only inside runner containers: network disabled,
   CPU/memory/PID/time limits, non-root user, fresh container per run.
4. The schemas in contracts/ are the source of truth. Changing a schema means:
   update the JSON Schema → run `make contracts` → update backend and
   frontend in the same change.
5. Scoring is reproducible: the same events + snapshots always give the same score.
6. All Featherless calls go through backend/llm. Never call the API elsewhere.
7. Secrets live in .env only. Never commit .env.

## Stack
- Backend: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2 + Alembic,
  Celery + Redis, pytest
- LLM: OpenAI Python SDK with base_url https://api.featherless.ai/v1,
  wrapped with Instructor (JSON mode). Three model slots set by env vars:
  FEATHERLESS_MODEL_GENERATOR, FEATHERLESS_MODEL_ASSISTANT, FEATHERLESS_MODEL_PROBE
- Runner: Docker, runtime images in runtimes/
- Frontend: Next.js (App Router), TypeScript, Tailwind, @monaco-editor/react
- Database: PostgreSQL 16

## Layout
contracts/   JSON Schemas (source of truth) + generated types
frontend/    Next.js app: app/recruiter, app/session/[id], app/report/[id]
backend/     api/ profiler/ builder/ gate/ runner/ assistant/ scoring/
             trail/ llm/ workers/ db/
seeds/       hand-written seed repos, each with tests + concepts.yaml
dsa/         DSA bank, JSON test cases, runners per language
runtimes/    Dockerfiles per runtime
sim/         simulated candidate scripts

## Tiers
- novice: 1-file bug fix + easy DSA, no assistant
- adept: 2–3 file feature + medium DSA, assistant enabled
- master: multi-file bug + performance constraint + medium/hard DSA, assistant enabled

## Commands
make up | make down | make test | make contracts | make lint | make seed-demo

## Repository and hackathon rules
- Repo: github.com/ROG-user-0987/HFT26-TEAM-41, a fork of
  cbitosc/HFT26-TEAM-41 (CBIT Hacktoberfest '26). Push only to the fork
  (origin). Never push to the upstream cbitosc repo.
- One feature branch per prompt (e.g. p0-1-scaffold); merge into the fork's
  main only after the acceptance checks pass.
- Open-source libraries are allowed with attribution: add every new library,
  dataset, or borrowed method to ATTRIBUTIONS.md in the same change.
- Keep the Team Information section of README.md unchanged.

## Working rules for Claude
- Before finishing any task, run the relevant tests and show the output.
  Never claim something works without running it.
- Keep changes scoped to the current prompt. Don't refactor unrelated code.
- Add dependencies only when needed, and pin versions.
- Prefer simple, readable code over clever abstractions.
- If a requirement is ambiguous or conflicts with the rules above, stop and ask.
- End every task with: what changed, how to verify it, known gaps.