# Build prompts

Paste one prompt at a time into Claude Code, in order. Every prompt follows
the session protocol in CLAUDE.md (branch, acceptance checks, update
docs/PROGRESS.md, commit, push, merge when green).

Format for any new prompt: goal → requirements → constraints → acceptance
checks Claude must run → report back (what changed, how to verify, gaps).
Phases 0–2.3 are written in full; later items are specifications to be
turned into full prompts against the code as it exists.

## Phase 0: Foundation (done except P0.0, which needs verifying)

- P0.1 Scaffold: compose (postgres, redis, api, worker, frontend), /health, Celery ping, Makefile.
- P0.2 Contracts: JSON Schemas + generated Pydantic/TS types + fixtures.
- P0.3 Featherless client: OpenAI SDK + Instructor, model slots, retries, Redis cache, smoke script.
- P0.4 Runtimes + runner: python311 and node20 images, locked-down run_tests().
- P0.5 Seed repo: seeds/py-fastapi-expenses with tests, concepts.yaml, README_TOUR.md.

### P0.0 Repository setup

```text
Follow the session protocol in CLAUDE.md. Branch: p0-0-repo-setup.

1. README.md:
   - Keep the Team Information and Team Members sections exactly as they
     are. Leave the "Problem Track" field in the table unchanged.
   - In the Problem Statement section, set the title to "Portfolio-Driven
     Adaptive Coding & Technical Assessment Platform" and replace the
     placeholder text with a 5–8 line summary based on docs/BLUEPRINT.md
     section 1.
   - Keep the Contribution & Submission Workflow and rules sections.
   - Add a "Project structure" note: our code lives in backend/, frontend/,
     contracts/, seeds/, dsa/, runtimes/, sim/, docs/ at the root instead of
     the starter's suggested src/, one line per folder.
   - Add placeholder sections, required for the final PR: Solution overview,
     Architecture and tech stack, Local setup, Demo video, Screenshots.
     Mark each "To be completed".
2. LICENSE: MIT, copyright 2026 Team JL (HFT26-TEAM-41).
3. ATTRIBUTIONS.md: every open-source project, dataset, and method actually
   used so far plus those planned in docs/BLUEPRINT.md section 7, each with
   link and license, grouped as "Used as dependencies", "Methods we
   adapted", "Planned".
4. .gitignore for Python, Node/Next.js, .env files, editor folders, OS
   files, Docker volumes, coverage output (merge with any existing one).

Acceptance checks:
- Show the README diff; confirm the Team Information lines are unchanged
- List added files
- docs/PROGRESS.md updated, branch pushed, merged to main if green
```

## Phase 1: Walking skeleton

### P1.1 Database and API

```text
Follow the session protocol in CLAUDE.md. Branch: p1-1-db-api.

1. SQLAlchemy models + Alembic migration in backend/db/:
   assessments (id, candidate_name, portfolio JSON, tier, status, created_at),
   tasks (id, assessment_id, spec JSON matching task_spec, order),
   sessions (id, assessment_id, started_at, deadline_at, submitted_at, status),
   file_snapshots (id, session_id, task_id, ts, files JSON),
   events (id, session_id, task_id, ts, type, payload JSON), append-only,
   runs (id, session_id, task_id, kind visible|silent|submit, result JSON, ts),
   scores (id, session_id, computed_at, breakdown JSON).
   Index events on (session_id, ts).
2. API routes in backend/api/:
   - POST /sessions {assessment_id}: starts a session; server sets
     deadline_at = now + 60 min. Starting twice returns the same session.
   - GET /sessions/{id}: status, server time, deadline, task list.
   - GET /sessions/{id}/tasks/{task_id}: candidate_task_view ONLY, via a
     dedicated to_candidate_view(spec) with a test proving it never includes
     reference_ref, hidden_tests, or certificate internals.
   - PUT /sessions/{id}/tasks/{task_id}/files: autosave snapshot.
   - POST /sessions/{id}/events: batch validated against the event schema;
     rejected after the deadline.
   - POST /sessions/{id}/tasks/{task_id}/run: enqueue a run job, return job id.
   - POST /sessions/{id}/submit: enqueue full grading.
   - GET /jobs/{id}: job status and RunResult (visible results only).
   Every write after deadline_at returns 409.
3. Tests for each route, including deadline rejection and the leak test.

Acceptance checks:
- `alembic upgrade head` works on a fresh database
- `make test` passes
- curl sequence: create session → fetch task → save files → post events
```

### P1.2 Worker jobs

```text
Follow the session protocol in CLAUDE.md. Branch: p1-2-workers.

1. run_job(session_id, task_id, files):
   - Visible tests via backend/runner → run kind "visible".
   - Hidden tests silently → run kind "silent". Hidden test files come from
     the task's reference source on the backend, copied into the container
     only for this run, read-only.
   - One "run" event: visible {passed,total}, hidden_silent
     {passed,total,failing_ids}.
   - The job result returned to the API includes ONLY the visible RunResult.
2. submit_job(session_id): for each task, latest snapshot → visible + hidden
   tests → run kind "submit" → "submit" event → session submitted → scoring
   (stub: store per-task pass counts).
3. Celery beat auto-submit every 30 s for sessions past their deadline.
4. Never return hidden stdout/stderr to the API.

Tests: run_job stores both runs and one event with no hidden data in the
response; submit_job uses the latest snapshot; auto-submit fires.

Acceptance checks:
- `make test` and `make test-docker` pass
- Show the event row for one real run
```

### P1.3 Hard-coded demo task

```text
Follow the session protocol in CLAUDE.md. Branch: p1-3-demo-task.

1. backend/builder/manual.py: Novice task from seeds/py-fastapi-expenses:
   off-by-one bug in app/utils.py::paginate via a small deterministic AST
   transform; ~6 pagination tests visible, the rest hidden; hand-written
   statement_md, repo tour, target_symbols, entry_symbols.
2. DSA task "longest substring without repeating characters"
   (sliding_window): Python stub, 5 visible + 30 hidden cases as JSON
   [{"input": {...}, "expected": ...}], plus a generic Python test file that
   loads JSON cases and calls the candidate's function.
3. `make seed-demo` creates the assessment for the portfolio fixture and
   prints the session URL.
4. Validate: starter fails ≥1 visible test; the seed passes everything.

Acceptance checks:
- `make seed-demo` prints the URL and both validation results
```

### P1.4 Candidate IDE

```text
Follow the session protocol in CLAUDE.md. Branch: p1-4-ide.

Session page at frontend/app/session/[id]/:
- Left: task tabs (domain, DSA), rendered statement, repo tour.
- Center: file tree + Monaco (@monaco-editor/react) with file tabs.
- Bottom: test results (pass/fail per test, messages).
- Top bar: countdown from the server deadline (resync every 30 s), Run,
  Submit, autosave status.
Behavior: autosave every 5 s and on Run; Run → POST → poll /jobs/{id} every
1 s → visible results; Submit → confirm → "submitted" screen; at the
deadline lock the editor and show "Time's up — submitted."
Telemetry (frontend/lib/telemetry.ts): focus sampled once per second (file,
line; symbol null), edit aggregated per second (file, chars_added,
chars_removed), paste (chars), blur. Batch; POST every 5 s and on unload
(sendBeacon). Use generated TS types. Tailwind, simple. No assistant yet.

Acceptance checks:
- `npm run build` passes with no type errors
- With the `make seed-demo` URL: fix the bug, Run, see more passes, Submit;
  describe what the UI showed
- Event counts per type for that session
```

### P1.5 Basic scoring and report

```text
Follow the session protocol in CLAUDE.md. Branch: p1-5-scoring.

1. backend/scoring/correctness.py (pure, unit-tested):
   correctness = 100 × (0.3 × visible_rate + 0.7 × hidden_rate) × perf_factor;
   perf_factor 1.0 without perf spec, else 1.0 within budget → 0.5 at 3×
   budget → 0.5 beyond. Edge cases: zero tests, all pass, all fail.
2. backend/scoring/score_session.py: per-task correctness from submit runs,
   time per task (first focus to last edit), run count, final score (Novice:
   mean correctness) → scores.breakdown. Reads stored records only. No LLM.
3. POST /sessions/{id}/regrade; test that two regrades give byte-identical JSON.
4. frontend/app/report/[id]/: final score, band (Strong ≥ 80, Pass ≥ 60,
   Borderline ≥ 45, Not yet), per task: visible/hidden pass rates, time, runs.

Acceptance checks:
- `make test` passes, including the determinism test
- Report for the demo session matches the breakdown JSON
```

## Phase 2: Generation + gate

### P2.1 Taxonomy and profiler

```text
Follow the session protocol in CLAUDE.md, including the token policy.
Branch: p2-1-profiler.

1. dsa/taxonomy.yaml: ~20 canonical topics (arrays, hashing, two_pointers,
   sliding_window, stack, queue, linked_list, binary_search, trees, bst,
   heaps, graphs_bfs_dfs, shortest_paths, dp, greedy, backtracking, tries,
   union_find, bit_manipulation, intervals) with synonyms and allowed tiers.
   Configurable thresholds: easy ≥1 solved, medium ≥5, hard ≥15.
2. contracts/profile.schema.json + `make contracts`: domain (backend | web |
   ml | security), runtime (python311 | node20), concepts (from the concept
   vocabulary only), allowed_topics per tier, suggested_tier + reason,
   unsupported_notes.
3. backend/profiler/:
   - Concept vocabulary = union of concepts in seeds/*/concepts.yaml.
   - Runtime and domain from keyword maps over keywords, skills,
     descriptions. Unsupported stacks map to the closest runtime with a note.
   - Concepts by deterministic keyword/synonym matching.
   - LLM fallback only when rules give no domain or zero concepts: one
     generator call, answers chosen from given lists (enums), max_tokens 150,
     temperature 0, cached, logged.
   - suggested_tier from solved counts and project count (documented rules).
   - POST /profiles {portfolio} → Profile, stored on the assessment.
Tests (LLM mocked): fixtures for Python backend, React web, ML, security,
messy topic names, unsupported stack (Go); LLM not called when rules
succeed, called once for a vague portfolio; threshold cases (4 dp → not
medium; 15 → hard).

Acceptance checks:
- `make test` passes; show the Profile for each fixture
```

### P2.2 Mutation engine (Novice)

```text
Follow the session protocol in CLAUDE.md. Branch: p2-2-mutation.
No LLM calls in this prompt.

1. Use LibCST (formatting-preserving); pin it; add to ATTRIBUTIONS.md.
2. backend/builder/mutate.py operators (each unit-tested): comparison flip,
   off-by-one (±1 on integer constants / index arithmetic), boolean operator
   swap, removed guard, swapped same-typed call arguments, wrong return.
3. inject_bug(seed_id, concept, rng_seed) → candidates: targets from the
   seed's concepts.yaml; every applicable site enumerated, ordered
   deterministically by rng_seed; each with starter_files (only the changed
   file differs), unified diff, target_symbols, operator, line.
4. Cheap pre-filter with backend/runner: keep mutants that import, fail ≥1
   test and ≤40% of tests; prefer 1–5 failing tests. Cap runner calls per
   request (default 12).
5. Visible/hidden split: ~1/3 of the concept's tests visible, including at
   least one test that fails on the starter.
6. Draft task_spec (mode "seed", tier "novice", statement placeholder for
   P2.5). manual.py uses engine output, keeping the hand bug as fallback.
7. `make mutate SEED=py-fastapi-expenses CONCEPT=pagination` prints candidates.
Tests: each operator; same rng_seed → identical output; ≥3 valid candidates
for pagination.

Acceptance checks:
- `make test` passes; show `make mutate` output
```

### P2.3 Feature removal (Adept)

```text
Follow the session protocol in CLAUDE.md. Branch: p2-3-feature-removal.
No LLM calls in this prompt.

1. backend/builder/remove_feature.py: remove_feature(seed_id, concept) →
   draft task_spec (tier "adept", mode "seed"). Only concepts whose symbols
   span 2–3 files are eligible (else a clear error listing eligible ones).
   Each target body becomes: signature + docstring +
   `raise NotImplementedError("TODO: <first docstring line>")` (LibCST).
   Missing docstrings → add them to the seed (re-run its tests).
2. Runner checks: app imports; non-target concepts' tests pass; target tests
   fail on the starter and pass on the seed.
3. ~1/3 of the concept's tests visible; record scope_files (2 or 3).
4. `make remove-feature SEED=... CONCEPT=...`. If no concept spans 2–3
   files, say which seed changes would create one.
Tests: eligible vs ineligible concepts; import; non-target pass; target fail.

Acceptance checks:
- `make test` passes; show `make remove-feature` output
```

### Specs for the rest of Phase 2

- **P2.4 Master builder:** a bug plus a performance regression (e.g. dict
  lookup → list scan, N+1 query); perf test with an input generator;
  calibration on the runner (limit ≈ 3× the reference's median time; the
  naive version must exceed it).
- **P2.5 LLM enrichment:** statement, repo tour, entity renaming to match the
  candidate's project (re-run all tests after renaming), extra hidden tests
  kept only if the reference passes them. Token policy: one call per task,
  only the changed files and test names as context, cached.
- **P2.6 DSA:** filter LeetCodeDataset into the bank with taxonomy tags;
  JSON cases; JS runner; selection rule (every tag claimed, thresholds);
  domain rewriting with signature mapping and re-run tests; fresh hidden
  inputs at submit with the reference as oracle. Never serve problem text
  verbatim.
- **P2.7 Validation gate + certificate:** reference passes ×3, starter fails,
  Novice starter passes non-target tests, scope diff by tier, size limits,
  brute-force agreement on 500 random inputs (DSA), perf calibration, topic
  check, optional mutation score (mutmut / Stryker). Writes the certificate.
- **P2.8 AI solve-rate probe:** probe slot attempts each task 3 times without
  hints, graded by tests; ai_solve_rate and difficulty_index; configurable
  rejection thresholds per tier; only for tasks that passed the gate.
- **P2.9 Builder pipeline + recruiter page:** Celery job orchestrating
  P2.1–P2.8; repair loop (≤2 tries); fallback bank; recruiter page to upload
  a portfolio, choose a tier, preview tasks and certificates, get the link.

## Phase 3: Assistant + scoring

- **P3.1 Hint endpoint + ladder:** L1 conceptual, L2 names a function, L3
  names a line; level rises only after a test run since the last hint.
  Context: statement, visible tests, current files (only those relevant),
  last 40 lines of visible output. Never reference or hidden tests.
  max_tokens ~250.
- **P3.2 Guards:** input rules first, a short classifier call only if rules
  are unsure; output check with copydetect similarity against the reference
  (block above threshold), ≤5 code lines, no complete function bodies; rate
  limit (1 per 60 s, 8 per task); log hint_request, hint_response,
  guard_block with function names mentioned.
- **P3.3 Assistant panel UI** (Adept/Master only), current hint level, note
  that efficient use scores best.
- **P3.4 AI efficiency score:** formula in docs/BLUEPRINT.md section 5; pure
  functions with tests; wired into scoring and re-grade.
- **P3.5 Simulated candidates:** four profiles (independent, good AI user,
  over-reliant, extractor) playing real sessions through the API; mostly
  scripted to save tokens.
- **P3.6 promptfoo:** attack config against the hint endpoint (extraction,
  jailbreak); small run; save the report for the demo.

## Phase 4: Report, Trail Map, interviewer

- **P4.1** Certificate view (recruiter page + report).
- **P4.2** Claim verification map.
- **P4.3** Progress timeline + hint ROI chart.
- **P4.4** Trail Map builder: tree-sitter per seed → spans, call graph,
  fixed layout; map focus/edit events to symbols; metrics.
- **P4.5** Trail Map replay UI: graph, trail before/after hints, dwell heat,
  scrubber, play, metric cards.
- **P4.6** Integrity flags: large pastes, tab blurs, single-jump pattern.
  Display only.
- **P4.7** Interview plan generator, with per-role question caching
  (docs/INTERVIEWER.md).
- **P4.8** Interview turn endpoint: state machine, deterministic router,
  minimal LLM decision, token budget, guardrails, logging.
- **P4.9** Voice I/O: Featherless TTS proxy with caching; TTS and
  interviewer model-selection scripts; browser speech-recognition hook.
- **P4.10** Interview UI: consent, orb, captions, push-to-talk, controls.
- **P4.11** Interview report tab: transcript, consistency check, token usage.
- **P4.12** Optional faster-whisper fallback.

## Phase 5: Polish + demo

- **P5.1** Pre-generate demo assessments; warm the LLM and TTS caches.
- **P5.2** Error handling and resilience: reconnect, retries, clear messages.
- **P5.3** Demo checklist, seeded simulated sessions, backup recording,
  README sections for the final PR.
