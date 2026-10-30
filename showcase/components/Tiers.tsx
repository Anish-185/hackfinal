import { Reveal, Item } from "./Reveal";
import Chip from "./Chip";
import type { Status } from "@/lib/site";

type Tier = {
  name: string;
  task: string;
  builder: string;
  builderStatus: Status;
  dsa: string;
  assistant: string;
  score: string;
};

const TIERS: Tier[] = [
  {
    name: "Novice",
    task: "Find and fix one bug in one file.",
    builder: "Mutation engine: six LibCST operators, kept only if the sandbox shows the bug breaks a concept test.",
    builderStatus: "built",
    dsa: "Easy, from claimed topics",
    assistant: "None",
    score: "Mean correctness",
  },
  {
    name: "Adept",
    task: "Build back a feature that was stubbed out across 2–3 files.",
    builder: "Feature removal: signatures and docstrings stay, bodies become NotImplementedError.",
    builderStatus: "built",
    dsa: "Medium, from claimed topics",
    assistant: "Guarded hints",
    score: "0.8 × correctness + 20 × AI efficiency",
  },
  {
    name: "Master",
    task: "Debug across files and meet a performance budget.",
    builder: "Bug plus performance regression, calibrated on the demo machine.",
    builderStatus: "planned",
    dsa: "Medium or hard",
    assistant: "Guarded hints",
    score: "Same, with perf_factor: 1.0 in budget, down to 0.5 at 3×",
  },
];

const ROWS: [keyof Tier, string][] = [
  ["task", "Domain task"],
  ["dsa", "DSA task"],
  ["assistant", "AI assistant"],
  ["score", "Final score"],
];

export default function Tiers() {
  return (
    <section className="section" id="tiers">
      <div className="wrap">
        <div className="grid">
          <div className="tiers-intro">
            <p className="label">Three tiers</p>
            <h2 className="h2">Same 60 minutes. What changes is the size of the problem.</h2>
            <p className="muted">
              One domain task (about 35 minutes) and one DSA task (about 25), always in the candidate&apos;s stack.
              The recruiter picks the tier; the profiler suggests one from projects and solved counts.
            </p>
          </div>
        </div>

        <Reveal className="tiers" amount={0.15}>
          <div className="tiers-head" aria-hidden>
            <span />
            {TIERS.map((t) => (
              <span key={t.name} className="tiers-name">{t.name}</span>
            ))}
          </div>
          {ROWS.map(([key, label]) => (
            <Item key={key} className="tiers-row">
              <span className="tiers-label">{label}</span>
              {TIERS.map((t) => (
                <span key={t.name} className="tiers-cell">
                  <span className="tiers-mobile-name">{t.name}</span>
                  {t[key]}
                </span>
              ))}
            </Item>
          ))}
          <Item className="tiers-row">
            <span className="tiers-label">Task builder</span>
            {TIERS.map((t) => (
              <span key={t.name} className="tiers-cell">
                <span className="tiers-mobile-name">{t.name}</span>
                {t.builder}
                <span className="tiers-chip"><Chip s={t.builderStatus} /></span>
              </span>
            ))}
          </Item>
        </Reveal>
      </div>
    </section>
  );
}
