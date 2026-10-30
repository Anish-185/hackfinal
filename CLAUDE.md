# Portfolio-Driven Assessment Platform (HFT26 Team 41 · JL)

## What we're building
A platform that turns a candidate's JSON portfolio into a validated 60-minute
coding assessment (one domain task + one DSA task) in their own tech stack,
runs it in sandboxes, offers a guarded AI assistant on Adept/Master tiers,
an optional AI voice interviewer, and a deterministic performance report.

Context files (the repo's docs/ folder is the single source of truth; the
shared Claude doc is an older snapshot):
- docs/BLUEPRINT.md — decisions, architecture, scoring, resources, plan
- docs/BUILD_PROMPTS.md — every build prompt, in order
- docs/PROGRESS.md — status table, decisions log, session log
- docs/INTERVIEWER.md — AI voice interviewer spec

## Session protocol (every session)
Start:
1. `git pull` on main.
2. Read this file, then docs/PROGRESS.md, then the relevant parts of
   docs/BLUEPRINT.md and docs/BUILD_PROMPTS.md.
3. Create a branch named after the prompt (e.g. `p1-1-db-api`).
End:
1. Run the prompt's acceptance checks and show the output.
2. Update the item's row in docs/PROGRESS.md and add a session-log row
   (date, who, what was done, next step).
3. Commit with the prompt ID in the message (e.g. "P1.1 db and api").
4. Push the branch to origin.
5. Merge into main only when the checks pass; push main.
6. Report: what changed, how to verify it, known gaps.

## Non-negotiable rules
1. LLMs never decide correctness or scores. Scores come only from test
   results and the formulas in backend/scoring.
2. Reference solutions and hidden tests never leave the backend: not to the
   browser, not into any model's context, not in any API response.
3. Candidate code runs only inside runner containers: network disabled,
   CPU/memory/PID/time limits, non-root user, fresh container per run.
4. The schemas in contracts/ are the source of truth. Changing a schema means:
   update the JSON Schema → `make contracts` → update backend and frontend
   in the same change.
5. Scoring is reproducible: the same events + snapshots give the same score.
6. All Featherless calls (text and speech) go through backend/llm. Never
   call the API elsewhere.
7. Secrets live in .env only. Never commit .env.
8. Trail Map metrics, integrity flags, and the voice interview are shown in
   the report but never affect the score.
9. Hidden tests run only in their own sandbox, never next to visible ones.
   Candidates can edit only starter files outside tests/config
   (app/workspace.py), and a run counts only if exactly the task's expected
   test ids were collected (TaskSpec.visible_test_ids / hidden_test_ids).
   Threat model and known limits: docs/BLUEPRINT.md section 11.

## Token policy (whole project)
- Every Featherless call sets max_tokens and a low temperature.
- Use the smallest model slot that does the job. Prefer plain code over an
  LLM call whenever the result can be computed.
- Cache every LLM and TTS response by input hash in Redis (on by default).
- Never send whole repos; send only the needed files or snippets. Truncate
  test output to the last 40 lines.
- Tests and CI always mock Featherless; they never call the real API.
- Log tokens per call; keep per-assessment and per-interview totals.
- Reuse generated tasks when inputs are identical. Pre-generate demo data once.
- AI solve-rate probe: 3 attempts. Repair loop: at most 2 tries.

## Stack
- Backend: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2 + Alembic,
  Celery + Redis, pytest
- LLM: OpenAI Python SDK with base_url https://api.featherless.ai/v1,
  wrapped with Instructor (JSON mode). Model slots: generator, assistant,
  probe, interviewer.
- Speech: Featherless POST /v1/audio/speech for the interviewer's voice;
  browser Web Speech API for listening. No ElevenLabs or other paid voice
  services anywhere.
- Runner: Docker, runtime images in runtimes/
- Frontend: Next.js (App Router), TypeScript, Tailwind, @monaco-editor/react
- Database: PostgreSQL 16

## Environment variables (keep .env.example in sync)
DATABASE_URL, REDIS_URL, FEATHERLESS_API_KEY,
FEATHERLESS_MODEL_GENERATOR, FEATHERLESS_MODEL_ASSISTANT,
FEATHERLESS_MODEL_PROBE, FEATHERLESS_MODEL_INTERVIEWER,
FEATHERLESS_TTS_MODEL, FEATHERLESS_TTS_VOICE,
INTERVIEW_TOKEN_BUDGET (default 4000)

Also used by the P0 code (see .env.example for values and comments):
- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB (postgres container)
- Per slot (GENERATOR, ASSISTANT, PROBE, INTERVIEWER):
  FEATHERLESS_PRICE_IN_<SLOT>, FEATHERLESS_PRICE_OUT_<SLOT> (USD per 1M
  tokens; required, the budget guard fails closed without them) and
  FEATHERLESS_CHAT_TEMPLATE_KWARGS_<SLOT> (JSON, e.g. {"thinking":false})
- LLM_TIMEOUT_S, LLM_MAX_RETRIES, LLM_CACHE_ENABLED, LLM_CACHE_TTL_S,
  LLM_BUDGET_USD (hard spend cap; once reached only cached responses are served)

## Layout
contracts/   JSON Schemas (source of truth) + fixtures + generated types
frontend/    Next.js app: app/recruiter, app/session/[id], app/report/[id],
             app/interview/[id]
backend/     app/            FastAPI app and plumbing:
                             main.py, routes/ (one module per resource),
                             models.py (SQLAlchemy tables), db.py, jobs.py
                             (enqueue, job status, run lock), celery_app.py
                             (Celery app + beat schedule), worker.py (Celery
                             tasks), grading.py (run/submit/auto-submit),
                             workspace.py (editable allowlist), integrity.py
                             (suspicious-code scan), candidate_view.py, config.py
             migrations/     Alembic (alembic.ini next to it)
             llm/ runner/ contracts_gen/ scripts/ tests/
             planned packages: profiler/ builder/ gate/ assistant/
             scoring/ trail/ interviewer/
             A new top-level package must be added to `packages` in
             backend/pyproject.toml and to the mkdir line in backend/Dockerfile.
seeds/       hand-written seed repos, each with tests + concepts.yaml
dsa/         taxonomy, DSA bank, JSON test cases, runners per language
runtimes/    Dockerfiles per runtime
sim/         simulated candidate scripts
docs/        blueprint, prompts, progress, interviewer spec

## Tiers
- novice: 1-file bug fix + easy DSA, no assistant
- adept: 2–3 file feature + medium DSA, assistant enabled
- master: multi-file bug + performance constraint + medium/hard DSA, assistant enabled

## Commands
make up | make down | make migrate | make test | make test-docker | make lint |
make contracts | make runtimes | make llm-smoke | make llm-usage
(Keep this list in sync with the Makefile. `make seed-demo` arrives with P1.3.)

- `make migrate`: `alembic upgrade head` on the dev database. A schema change
  means: edit app/models.py → `docker compose run --rm api alembic revision
  --autogenerate -m "..."` → review the file → `make migrate`.
  tests/test_migrations.py fails if models and migrations differ.
- `make test`: backend tests in the api container; starts postgres and redis.
  API tests use their own `<db>_test` database built from the migrations.
- `make test-docker`: runner tests that start real sandbox containers. Runs
  in the worker (the only service with the Docker socket); needs
  `make runtimes` first.
- `make contracts`: regenerate Pydantic and TS types; commit the output.
- `make llm-smoke`: one real request per slot; spends credits on a cache miss.
- `make llm-usage`: tokens and estimated spend per slot.

First-time setup: `cp .env.example .env` (fill FEATHERLESS_API_KEY), then
`make runtimes`, `make up` and `make migrate`.
Files created inside a container (e.g. a generated migration) are owned by
root; fix with `docker compose run --rm --no-deps api chown -R $(id -u):$(id -g) /app`.

## Team
3 members: Sriram Aditya Sai (lead), G Anish, Faiz.
Roles: A Execution (runner, sandbox, API, workers) · B Generation + AI and
scoring · C Frontend + interviewer UI. Person-to-role mapping: TBD.

## Repository and hackathon rules
- Repo: github.com/ROG-user-0987/HFT26-TEAM-41, a fork of
  cbitosc/HFT26-TEAM-41 (CBIT Hacktoberfest '26). Push only to the fork
  (origin). Never push to the upstream cbitosc repo.
- One feature branch per prompt; merge into the fork's main only after its
  acceptance checks pass.
- Open-source libraries are allowed with attribution: add every new library,
  dataset, or borrowed method to ATTRIBUTIONS.md in the same change.
- All code must be written during the hackathon.
- Keep the Team Information section of README.md unchanged.
- Final submission: a PR from the fork's main to upstream main titled
  "[SUBMISSION] TEAM-41 - JL - <track name>", with solution overview,
  architecture and tech stack, local setup, demo video link, screenshots.

## Interviewer rules
- Never affects the final score.
- Never reveals solutions, hidden tests, or reference code.
- Never asks about protected attributes (age, religion, family,
  nationality, health, etc.).
- Uses only recruiter-provided information about the company.
- Requires mic consent, disclosing that browser speech recognition may send
  audio to the browser vendor.
- Stores transcripts, not audio, by default.
- Follows the token budget rules in docs/INTERVIEWER.md.

## Working rules for Claude
- Before finishing any task, run the relevant tests and show the output.
  Never claim something works without running it.
- Keep changes scoped to the current prompt. Don't refactor unrelated code.
- Add dependencies only when needed, pin versions, and attribute them.
- Prefer simple, readable code over clever abstractions.
- If a requirement is ambiguous or conflicts with the rules above, stop and ask.
