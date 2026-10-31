import { PHASES, STATUS_LABEL, FACTS, type Status } from "@/lib/site";
import { Reveal, Item } from "./Reveal";
import Chip from "./Chip";
import Counter from "./Counter";

function count(s: Status) {
  return PHASES.flatMap((p) => p.items).filter((i) => i.status === s).length;
}

export default function Progress() {
  const all = PHASES.flatMap((p) => p.items).length;
  return (
    <section className="section" id="progress">
      <div className="wrap">
        <div className="grid prog-top">
          <div className="prog-intro">
            <p className="label">Progress</p>
            <h2 className="h2">Where we actually are.</h2>
            <p>
              Six phases, each with an exit test that has to pass before the next one starts. Straight from{" "}
              <code>docs/PROGRESS.md</code> as of today.
            </p>
          </div>
          <dl className="prog-counts">
            {(["built", "progress", "planned"] as Status[]).map((s) => (
              <div key={s}>
                <dt><Chip s={s} /></dt>
                <dd className="display"><Counter to={count(s)} /></dd>
              </div>
            ))}
            <div>
              <dt className="small">of {all} build prompts</dt>
            </div>
          </dl>
        </div>

        <Reveal as="ol" className="phases" amount={0.1}>
          {PHASES.map((p) => {
            const done = p.items.filter((i) => i.status === "built").length;
            const state = done === p.items.length ? "built" : p.items.some((i) => i.status !== "planned") ? "progress" : "planned";
            return (
              <Item as="li" key={p.n} className={`phase phase-${state}`}>
                <div className="phase-n display">{p.n}</div>
                <h3 className="h3">{p.title}</h3>
                <p className="small">{p.exit}</p>
                <div className="phase-bar" aria-label={`${done} of ${p.items.length} done`}>
                  {p.items.map((i) => (
                    <span key={i.id} data-s={i.status} title={`${i.id} ${i.name}: ${STATUS_LABEL[i.status]}`} />
                  ))}
                </div>
                <ul className="phase-items">
                  {p.items.map((i) => (
                    <li key={i.id} data-s={i.status}>
                      <span>{i.id}</span> {i.name}
                    </li>
                  ))}
                </ul>
              </Item>
            );
          })}
        </Reveal>

        <p className="small prog-foot">
          Featherless spend so far: about ${FACTS.llmSpendUsd.toFixed(5)} (two logged checks). Everything that can be
          computed is plain code, every LLM response is cached in Redis, and tests mock the API. The DSA bank has{" "}
          {FACTS.dsaProblems} problem today ({FACTS.hiddenDsa} hidden cases); P2.6, in progress, fills it out.
        </p>
      </div>
    </section>
  );
}
