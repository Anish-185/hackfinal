import { Reveal, Item } from "./Reveal";

// Architecture as the request actually travels, and the open-source work we build on
// (from ATTRIBUTIONS.md: used dependencies only, planned ones are marked).
const FLOW: { name: string; parts: string; note: string }[] = [
  { name: "Browser", parts: "Next.js, React, Monaco (bundled)", note: "IDE, report. Calls /api through a same-origin rewrite." },
  { name: "API", parts: "FastAPI, Pydantic v2, SQLAlchemy, Alembic", note: "Sessions, files, events, scoring. Schemas in contracts/ are the source of truth." },
  { name: "Queue", parts: "Celery, Redis", note: "Run, submit, auto-submit every 30 s. Redis also caches every LLM response." },
  { name: "Sandbox", parts: "Docker, python:3.11, node:20, pytest, Jest", note: "Fresh container per run. Network off, non-root, limits on CPU, memory, PIDs, time." },
  { name: "Store", parts: "PostgreSQL 16", note: "Events are append-only, enforced by a trigger." },
];

const OSS: [string, string][] = [
  ["LibCST", "bug mutation and feature removal"],
  ["Instructor + OpenAI SDK", "structured output from Featherless"],
  ["Monaco Editor", "the candidate's editor"],
  ["pytest, pytest-json-report, Hypothesis", "tests inside the sandbox"],
  ["Jest", "JavaScript tests"],
  ["Playwright", "make e2e in headless Chromium"],
  ["JSON Resume", "the portfolio schema we extend"],
  ["SWE-smith (method)", "the idea behind the mutation filter"],
  ["DeepSeek-V4-Flash, Qwen3-Coder, Qwen2.5-7B", "models via Featherless"],
  ["Lenis, Motion, Fontsource", "this page"],
];

export default function Stack() {
  return (
    <section className="section" id="stack">
      <div className="wrap">
        <div className="grid">
          <div className="stack-intro">
            <p className="label">Architecture and stack</p>
            <h2 className="h2">Boring parts, strict boundaries.</h2>
            <p>
              Candidate code never runs in the API process. Reference solutions and hidden tests never leave the backend.
              Every model call goes through one module, <code>backend/llm</code>, with a token cap, a low temperature,
              a cache and a hard spend limit.
            </p>
          </div>
        </div>

        <Reveal as="ol" className="flow" amount={0.15}>
          {FLOW.map((f) => (
            <Item as="li" key={f.name}>
              <h3 className="h3">{f.name}</h3>
              <p className="flow-parts">{f.parts}</p>
              <p className="small">{f.note}</p>
            </Item>
          ))}
        </Reveal>
        <p className="small flow-side">
          On the side: <b>Featherless</b> for the generator, assistant, probe and interviewer model slots, and for speech
          from P4.9.
        </p>

        <div className="grid oss">
          <h3 className="h3 oss-title">Built on</h3>
          <ul className="oss-list">
            {OSS.map(([name, use]) => (
              <li key={name}>
                <span>{name}</span>
                <span className="small">{use}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
