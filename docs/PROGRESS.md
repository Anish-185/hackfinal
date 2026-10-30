# Progress

Update after every prompt (see the session protocol in CLAUDE.md).
Roles: A Execution · B Generation + AI and scoring · C Frontend + interviewer UI.

## Status

| ID | Item | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| P0.0 | Repository setup (README, LICENSE, ATTRIBUTIONS, .gitignore) | A | Done | 2026-10-31 (p0-sync): README problem statement, structure, PR placeholder sections; MIT LICENSE; ATTRIBUTIONS grouped (used / adapted / planned); .gitignore extended |
| P0.1 | Scaffold | A | Done | 2026-10-31: make test passed, lint clean |
| P0.2 | Contracts | B | Done | 2026-10-31: contract tests pass; regeneration stable |
| P0.3 | Featherless client | B | Done | 2026-10-31: 13 unit tests pass (interviewer slot added in p0-sync); smoke test pending an API key |
| P0.4 | Runtimes and runner | A | Done | 2026-10-31: make test-docker 10 passed |
| P0.5 | Seed: py-fastapi-expenses | B | Done | 2026-10-31: seed tests pass |
| P1.1 | Database and API | A | Done | 2026-10-31: 7 tables + Alembic 0001 (events append-only via trigger); session, task, files, events, run, submit, job routes in backend/app/routes/; make test 99 passed; curl sequence OK. run_job/submit_job are stubs until P1.2 |
| P1.2 | Worker jobs | A | Not started | |
| P1.3 | Hard-coded demo task | B | Not started | |
| P1.4 | Candidate IDE | C | Not started | |
| P1.5 | Basic scoring and report | A | Not started | |
| P2.1 | Taxonomy and profiler | B | Not started | |
| P2.2 | Mutation engine (Novice) | B | Not started | |
| P2.3 | Feature removal (Adept) | B | Not started | |
| P2.4 | Master builder | B | Not started | |
| P2.5 | LLM enrichment | B | Not started | |
| P2.6 | DSA bank, runners, rewriting | A, B | Not started | |
| P2.7 | Validation gate and certificate | B | Not started | |
| P2.8 | AI solve-rate probe | B | Not started | |
| P2.9 | Builder pipeline and recruiter page | B, C | Not started | |
| P3.1 | Hint endpoint and ladder | B | Not started | |
| P3.2 | Guards | B | Not started | |
| P3.3 | Assistant panel UI | C | Not started | |
| P3.4 | AI efficiency score | B | Not started | |
| P3.5 | Simulated candidates | B | Not started | |
| P3.6 | promptfoo attack run | B | Not started | |
| P4.1 | Certificate view | C | Not started | |
| P4.2 | Claim verification map | C | Not started | |
| P4.3 | Progress timeline and hint ROI | C | Not started | |
| P4.4 | Trail Map builder and metrics | B | Not started | |
| P4.5 | Trail Map replay UI | C | Not started | |
| P4.6 | Integrity flags | A | Not started | |
| P4.7 | Interview plan generator | B | Not started | |
| P4.8 | Interview turn endpoint | B | Not started | |
| P4.9 | Voice I/O (TTS proxy, model selection, speech recognition) | A, C | Not started | |
| P4.10 | Interview UI (consent, orb, captions) | C | Not started | |
| P4.11 | Interview report tab | C | Not started | |
| P4.12 | faster-whisper fallback (optional) | A | Not started | |
| P5.1 | Demo data and cache warm-up | All | Not started | |
| P5.2 | Error handling and resilience | All | Not started | |
| P5.3 | Demo checklist, backup video, README for PR | All | Not started | |

## Decisions log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-31 | Repo docs/ folder is the single source of truth | Any teammate's Claude can continue from GitHub alone |
| 2026-10-31 | AI voice interviewer added in Phase 4: browser speech recognition for listening, Featherless for thinking and speaking (/v1/audio/speech) | Natural voice with no paid voice services |
| 2026-10-31 | No ElevenLabs or other paid voice services | Cost |
| 2026-10-31 | Project-wide token policy (CLAUDE.md); probe 3 attempts, repair loop 2 tries | Minimize Featherless usage |
| 2026-10-31 | Team of 3 with roles A, B, C | Team size |
| 2026-10-31 | Interviewer slot defaults to meta-llama/Meta-Llama-3.1-8B-Instruct ($0.05/$0.08 per 1M); TTS defaults to hexgrad/Kokoro-82M, voice af_bella. Both provisional until the P4.9 comparison | Cheapest instruct model in the catalog, no thinking mode; Kokoro is Featherless's documented TTS example |

## Session log

| Date | Who | What was done | Next step |
| --- | --- | --- | --- |
| 2026-10-31 | Anish (Claude Code) | Verified P0.1–P0.5 locally; nothing pushed yet | Add docs, verify P0.0, push everything to main |
| 2026-10-31 | Anish (Claude Code) | p0-sync: added docs/, merged CLAUDE.new.md into CLAUDE.md, interviewer slot + test, .env.example synced, finished P0.0. make test 59 passed, make test-docker 10 passed, make lint clean. (P0.1–P0.5 were already on the fork's main as febdb72) | P1.1 Database and API |
| 2026-10-31 | Anish (Claude Code) | P1.1 db and api: models, migration, routes, leak test, deadline 409s; used backend/app/ instead of backend/api/ and backend/db/ (CLAUDE.md layout and BUILD_PROMPTS paths updated) | P1.2 Worker jobs |
