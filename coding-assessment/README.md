# Coding Assessment Engine

A HackerRank-style coding module. Candidates get a challenge with starter code, write a solution in a
Monaco editor, run it against sample tests or custom input, and submit it for grading against hidden
tests. Claude explains errors, and a portfolio profile can be turned into a validated, personalised challenge.

```
React + Monaco ──► Express API ──► BullMQ (Redis) ──► worker ──► Judge0 (sandbox)
                       │                                 │
                       ├── MongoDB (challenges, submissions, assessments)
                       └── Claude (debug hints, challenge generation)
```

The engine is independent of any portfolio analyzer. The analyzer only sends a profile to
`POST /api/challenges/generate`. Everything after that (display, execution, testing, scoring) happens here.

## Quick start (local)

Prerequisites: Node 20+, Docker (for MongoDB/Redis), and a Judge0 instance (see [judge0/README.md](judge0/README.md)).

```bash
# 1. Databases (MongoDB on 27017, Redis on 6379)
docker compose up -d mongo redis

# 2. Backend
cd backend
cp .env.example .env      # set JUDGE0_*, ANTHROPIC_API_KEY, ADMIN_API_KEY; REDIS_URL=redis://127.0.0.1:6379
npm install
npm run seed              # 3 sample challenges
npm run validate          # runs each reference solution through Judge0: checks your Judge0 setup
npm run dev               # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api to :5000)
```

Without `REDIS_URL`, jobs run in an in-process queue, which is fine for a single dev instance.
To run everything in containers, use `docker compose up -d --build` and open http://localhost:8080.
That needs `backend/.env`, plus `JUDGE0_URL` pointing at your Judge0 host.

## How it works

| Flow | What happens |
|---|---|
| **Run** | `POST /api/code/run` queues a job and the UI polls `GET /api/code/status/:jobId`. It runs the public sample tests, or the candidate's custom stdin. It is never graded. |
| **Submit** | `POST /api/code/submit` creates a `Submission` and queues it. The worker sends public, hidden and performance tests to Judge0 as one batch, compares outputs, and saves the score. The UI polls `GET /api/submissions/:id`. |
| **Scoring** | The score is the weighted share of passed tests (0–100). Each assessment keeps the best score per challenge. `codingScore` averages algorithm challenges, `debuggingScore` averages debugging challenges, and `totalScore` averages the two. |
| **AI debugger** | `POST /api/debug` sends the code and the failure (compiler output, stderr, or the failing sample test) to Claude, which returns `{errorType, explanation, hint, severity, lineNumbers}`. It never returns fixed code. |
| **Challenge generation** | `POST /api/challenges/generate` asks Claude for a challenge plus reference solutions. It runs every reference solution against every test through Judge0 and publishes only the languages that pass 100%. If none pass, the challenge stays a draft. |

Challenges are stdin/stdout programs. The starter code already contains the input/output harness, so the
candidate only implements a function. Comparison ignores trailing whitespace.

### AI modes

| Mode | Policy | Behaviour |
|---|---|---|
| Practice | `full` | Detailed explanation; may point at the exact line and show a ≤3-line concept snippet |
| Assessment | `limited` | Short conceptual nudge, no code, capped at `maxAiHints` (reserved atomically) |
| Assessment | `disabled` | `/api/debug` returns 403 |

While a timed assessment is running, its policy applies to every `/api/debug` call from that candidate.
Leaving out `assessmentId` cannot unlock practice-level help.

## API

All candidate routes need an `x-candidate-id` header. The frontend generates one per browser.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | API, queue backend and Judge0 reachability |
| GET | `/api/languages` | Supported languages |
| GET | `/api/challenges` · `/api/challenges/:id` | Published challenges (hidden tests and reference solutions never included) |
| POST | `/api/assessments` | Start a session: `{challengeIds, mode: "practice"\|"assessment", durationMinutes, aiPolicy, maxAiHints}` |
| GET | `/api/assessments` · `/api/assessments/:id` | Sessions; an expired assessment is finalised on read |
| POST | `/api/assessments/:id/finish` | Final scores |
| POST | `/api/code/run` | `{challengeId?, language, sourceCode, stdin?, useCustomInput?}` → `{jobId}` |
| GET | `/api/code/status/:jobId` | `{state: queued\|running\|completed\|failed, result}` |
| POST | `/api/code/submit` | `{challengeId, language, sourceCode, assessmentId?}` → `{submissionId}` |
| GET | `/api/submissions` · `/api/submissions/:id` | The candidate's submissions; hidden test details are redacted |
| POST | `/api/debug` | `{language, sourceCode, error, challengeId?, assessmentId?}` → hint |

Admin routes need an `x-admin-key: $ADMIN_API_KEY` header:

```bash
curl -X POST http://localhost:5000/api/challenges/generate \
  -H "Content-Type: application/json" -H "x-admin-key: $ADMIN_API_KEY" \
  -d '{"profile":{"languages":["Python","JavaScript"],"frameworks":["FastAPI","React"],"databases":["MongoDB"],"projects":["AI chatbot using FastAPI"]},"difficulty":"Medium","languages":["python","javascript"]}'
```

Also: `POST /api/challenges` (create manually, same shape as `seed/challenges.js`) and
`POST /api/challenges/:id/validate` (re-run the reference solutions).

## Security

- Candidate code runs **only** in Judge0, with per-submission CPU, wall-time, memory, file-size and process
  limits, and `enable_network: false`. Run Judge0 on its own VM. [judge0/README.md](judge0/README.md) lists the hardening settings.
- Hidden tests and reference solutions use `select: false` in the schema. Hidden and performance results
  are stripped of input, expected and actual output before they are saved.
- Rate limits: 20 runs/min, 6 submits/min and 8 AI calls/min per candidate+IP, plus a global API limit.
  Source code is capped at 64 KB, stdin at 64 KB, and program output is truncated at 8 KB.
- Job and submission reads are scoped to the candidate who created them.
- Submissions after the assessment ends (30 s grace period) or after it is finished are rejected.
- The AI prompt treats candidate code and output as untrusted data, so instructions hidden in comments are ignored.

## Before production

- **Authentication.** `x-candidate-id` is a placeholder. Replace `requireCandidate` in
  `backend/middleware/auth.js` with your platform's real auth.
- **Assessment creation.** Candidates currently start their own assessments and choose the AI policy.
  In production a recruiter should create them.
- **Seed reference solutions.** These cover Python and JavaScript only. Java and C++ starter code is
  included but has no reference solution yet.
- **Monaco CDN.** `@monaco-editor/react` loads Monaco from the jsDelivr CDN at runtime. To self-host
  it, call `loader.config({ monaco })` with the bundled `monaco-editor` package.
