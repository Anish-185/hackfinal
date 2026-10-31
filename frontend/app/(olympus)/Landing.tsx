"use client";

// Landing: the product first. The hero is a pipeline window that plays once (portfolio in,
// verified report out); below it every feature in one sweep, each with a small mock of the
// real UI, then the scoring rules and the call to action. The engravings are texture only:
// at most one per section, never above their native size, at low opacity (Hermes-style).
import Link from "next/link";
import { SiteNav, BRAND } from "@/components/olympus/Chrome";
import Engraving from "@/components/olympus/Engraving";
import { IconCheck } from "@/components/olympus/Icons";
import { Btn } from "@/components/olympus/Kit";
import { TLink } from "@/components/olympus/Shell";

// The demo candidate and the numbers from a real `make e2e` run.
const PIPELINE: { step: string; title: string; detail: React.ReactNode }[] = [
  {
    step: "Portfolio",
    title: "Ananya Rao, backend developer",
    detail: (
      <span className="flex flex-wrap gap-1.5">
        {["résumé.pdf", "github.com/ananyarao", "LeetCode 214 solved", "Codeforces 1480"].map((s) => (
          <span key={s} className="pipe-chip">
            {s}
          </span>
        ))}
      </span>
    ),
  },
  {
    step: "Profile",
    title: "Read by rules, not guessed",
    detail: (
      <span className="mono text-[12.5px]">
        <K>domain</K> backend <K>runtime</K> python311 <K>tier</K> adept
      </span>
    ),
  },
  {
    step: "Tasks",
    title: "Built in her own stack, then validated",
    detail: (
      <span className="flex flex-col gap-1 text-[13px]">
        <span>
          Fix: expense list pages are wrong <span className="text-[var(--text-3)]">FastAPI, app/utils.py</span>
        </span>
        <span>
          Longest run of distinct characters <span className="text-[var(--text-3)]">sliding window</span>
        </span>
      </span>
    ),
  },
  {
    step: "Session",
    title: "60 minutes in a sealed sandbox",
    detail: <span className="mono text-[12.5px] text-[var(--text-2)]">no network, fresh container, hidden tests run apart</span>,
  },
  {
    step: "Interview",
    title: "AI voice interview about her own diff",
    detail: <span className="text-[13px] text-[var(--text-2)]">5 questions, 4 of 4 submission facts mentioned, not scored</span>,
  },
];

const FEATURES: { title: string; body: string; mock: React.ReactNode; wide?: boolean }[] = [
  {
    title: "One portfolio in",
    body: "Upload a résumé PDF or link GitHub, LeetCode and Codeforces. Everything becomes one JSON Resume portfolio.",
    wide: true,
    mock: <TopicBars />,
  },
  {
    title: "A profile from rules",
    body: "Domain, language, concepts and tier come from deterministic rules. A model only fills a gap.",
    mock: (
      <Code>
        <K>concepts</K> pagination, caching
        <br />
        <K>suggested</K> adept
        <br />
        <span className="text-[var(--text-3)]"># 165 solved, graphs at adept</span>
      </Code>
    ),
  },
  {
    title: "Tasks in the candidate's own stack",
    body: "A real seed repo is mutated into a bug or a missing feature in their language, plus an algorithm matched to the topics they have solved.",
    wide: true,
    mock: (
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["Novice", "1-file bug fix, easy algorithm"],
          ["Adept", "2–3 file feature, medium, hints on"],
          ["Master", "multi-file bug + speed budget, hard"],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl bg-[var(--parchment-3)]/60 p-3">
            <p className="display text-[22px]">{t}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-[var(--text-2)]">{d}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Every task certified",
    body: "Before anyone sees a task, a validation gate proves it is fair.",
    mock: (
      <ul className="space-y-1.5 text-[13px]">
        {["reference passes 65/65, three times", "starter fails a visible test", "statement doesn't leak the fix"].map((c) => (
          <li key={c} className="flex items-center gap-2">
            <Tick /> {c}
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "Sandboxed runs",
    body: "Code runs in a fresh container per run: no network, capped CPU, memory and time, non-root.",
    mock: (
      <Code>
        <span className="text-[var(--text-3)]">$</span> run visible
        <br />
        <span className="text-[var(--pass)]">3 passed</span> in 2.6 s
      </Code>
    ),
  },
  {
    title: "Hints that never solve it",
    body: "Adept and Master get an assistant with a hint ladder that rises only after a run. Using it shows up as AI efficiency.",
    mock: (
      <div className="flex gap-1.5 text-[12px]">
        {["L1 concept", "L2 function", "L3 line"].map((l, i) => (
          <span key={l} className={`pipe-chip ${i === 0 ? "!text-[var(--ink-hi)]" : ""}`}>
            {l}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "Code reading",
    body: "A real repository with real issues: analyse it, debug it and say how you'd make it faster, with a guide that points but never walks.",
    mock: <p className="mono text-[12.5px] text-[var(--text-2)]">#42 cache returns stale totals</p>,
  },
  {
    title: "AI voice interview",
    body: "Questions from the recruiter's role, the candidate's project and their own diff. One follow-up each, never scored.",
    mock: (
      <div className="flex items-center gap-3 text-[13px]">
        <span className="voice-dot" aria-hidden="true" />
        <span className="text-[var(--text-2)]">&ldquo;Why did paginate need a new offset?&rdquo;</span>
      </div>
    ),
  },
  {
    title: "A report you can re-run",
    body: "Score from hidden tests only. Re-grade gives the identical number. The report adds a Trail Map of how they navigated the code, a portfolio claim check, integrity notes and the interview transcript, none of which changes the score.",
    wide: true,
    mock: (
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="display text-[56px] leading-none text-[var(--gold-bright)]">100</p>
          <p className="text-[12.5px] text-[var(--text-2)]">Strong</p>
        </div>
        <ul className="space-y-1 text-[13px]">
          <li className="flex items-center gap-2">
            <Tick /> hidden tests 92 of 92
          </li>
          <li className="flex items-center gap-2">
            <Tick /> re-grade identical
          </li>
          <li className="flex items-center gap-2">
            <Tick /> claims checked: pagination, sliding window
          </li>
        </ul>
      </div>
    ),
  },
];

const RULES = [
  ["Models never score", "Correctness comes only from test results and published formulas."],
  ["Hidden stays hidden", "Reference solutions and hidden tests never reach the browser or any model."],
  ["Sealed runs", "Fresh container per run, no network, CPU, memory and time limits."],
  ["Reproducible", "The same events and snapshots always give the same score."],
];

export default function Landing() {
  return (
    <div className="landing">
      <SiteNav />

      {/* Hero: the product, played once. */}
      <section className="relative overflow-hidden px-[var(--gutter)] pb-20 pt-36 md:pt-40">
        <div className="hero-glow" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[8%] top-24 hidden w-[466px] opacity-[0.07] lg:block" aria-hidden="true">
          <Engraving name="starchart" className="w-full" />
        </div>
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
          <div>
            <h1 className="display text-[clamp(52px,7.2vw,104px)] leading-[0.95] text-[var(--text)]">
              Your portfolio becomes the assessment.
            </h1>
            <p className="mt-7 max-w-[520px] text-[18px] leading-relaxed text-[var(--text-2)]">
              {BRAND} reads a candidate&apos;s résumé, GitHub, LeetCode and Codeforces, builds a 60-minute test in their own
              stack, and scores it with hidden tests, never with a language model.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Btn href="/ascend">Start with a portfolio</Btn>
              <a href="#features" className="btn btn-ghost">
                <span className="btn-label">
                  <span>See every feature</span>
                  <span aria-hidden="true">See every feature</span>
                </span>
              </a>
            </div>
          </div>

          <figure className="pipe" aria-label="How a portfolio becomes a report">
            <div className="pipe-bar">
              <span className="pipe-lights" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>candidate pipeline</span>
            </div>
            <ol className="pipe-rows">
              {PIPELINE.map((row, i) => (
                <li key={row.step} className="pipe-row" style={{ "--i": i } as React.CSSProperties}>
                  <span className="pipe-step">{row.step}</span>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-medium text-[var(--text)]">{row.title}</p>
                    <div className="mt-1.5">{row.detail}</div>
                  </div>
                </li>
              ))}
              <li className="pipe-row pipe-verdict" style={{ "--i": PIPELINE.length } as React.CSSProperties}>
                <span className="pipe-step">Report</span>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="display text-[44px] leading-none text-[var(--gold-bright)]">100</span>
                  <span className="text-[14.5px] font-medium">Strong</span>
                  <span className="text-[13px] text-[var(--text-2)]">hidden tests 92 of 92, re-grade identical</span>
                </div>
              </li>
            </ol>
          </figure>
        </div>
      </section>

      {/* How it works: the real sequence a candidate goes through. */}
      <section id="how" className="border-y border-[var(--line)] bg-[var(--parchment-2)]/50 px-[var(--gutter)] py-14">
        <ol className="mx-auto grid max-w-[1320px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Upload", "Résumé and public profiles become one portfolio.", "/ascend"],
            ["Solve", "One task in your stack, one algorithm, 60 minutes.", "/trials"],
            ["Explain", "Read real code, then a short AI voice interview.", "/oracle"],
            ["Report", "A score from tests, plus how you got there.", "/verdict"],
          ].map(([t, d, href], i) => (
            <li key={t} className="flex gap-4">
              <span className="display text-[34px] leading-none text-[var(--ink)]">{i + 1}</span>
              <div>
                <TLink href={href} className="text-[17px] font-medium hover:text-[var(--ink-hi)]">
                  {t}
                </TLink>
                <p className="mt-1 text-[14.5px] leading-relaxed text-[var(--text-2)]">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Every feature in one sweep. */}
      <section id="features" className="px-[var(--gutter)] py-24 md:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-12 grid gap-6 md:grid-cols-[minmax(0,1fr)_420px] md:items-end">
            <h2 className="display text-[clamp(40px,5vw,72px)] leading-[1]">Everything it does, on one screen.</h2>
            <p className="text-[16px] leading-relaxed text-[var(--text-2)]">
              From the first upload to the recruiter&apos;s report. Each panel shows what the candidate or recruiter actually
              sees.
            </p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className={`feature ${f.wide ? "feature-wide" : ""}`}>
                <h3 className="text-[18px] font-medium">{f.title}</h3>
                <p className="mt-2 max-w-[520px] text-[14.5px] leading-relaxed text-[var(--text-2)]">{f.body}</p>
                <div className="relative mt-6">{f.mock}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring rules. */}
      <section id="rules" className="relative overflow-hidden border-t border-[var(--line)] px-[var(--gutter)] py-24">
        <div className="relative mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[420px_minmax(0,1fr)]">
          <h2 className="display text-[clamp(36px,4vw,56px)] leading-[1.02]">Four rules, written into the code.</h2>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {RULES.map(([t, d]) => (
              <div key={t} className="border-t border-[var(--line-strong)] pt-4">
                <dt className="text-[16px] font-medium">{t}</dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--text-2)]">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Call to action and footer. */}
      <section className="relative overflow-hidden border-t border-[var(--line)] px-[var(--gutter)] pt-24">
        <div className="pointer-events-none absolute bottom-0 left-1/2 w-[min(1276px,100%)] -translate-x-1/2 opacity-[0.08]" aria-hidden="true">
          <Engraving name="panorama" className="w-full" />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[var(--parchment)] to-transparent" />
        </div>
        <div className="relative mx-auto flex max-w-[1320px] flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="display text-[clamp(40px,5vw,72px)] leading-[1]">See it with a real portfolio.</h2>
            <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-[var(--text-2)]">
              Upload one, or try a practice problem first. About ninety minutes from upload to report.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Btn href="/ascend">Start with a portfolio</Btn>
            <Link href="/practice" className="btn btn-ghost">
              <span className="btn-label">
                <span>Try a practice problem</span>
                <span aria-hidden="true">Try a practice problem</span>
              </span>
            </Link>
          </div>
        </div>
        <footer className="relative mx-auto mt-24 flex max-w-[1320px] flex-wrap items-center justify-between gap-6 border-t border-[var(--line)] py-8 text-[13px] text-[var(--text-3)]">
          <span className="display text-[22px] text-[var(--text)]">{BRAND}</span>
          <nav className="flex flex-wrap gap-6">
            {[
              ["/ascend", "Upload"],
              ["/trials", "Assessment"],
              ["/labyrinth", "Code reading"],
              ["/oracle", "Interview"],
              ["/verdict", "Report"],
            ].map(([href, label]) => (
              <TLink key={href} href={href} className="hover:text-[var(--text)]">
                {label}
              </TLink>
            ))}
          </nav>
          <span>HFT26 Team 41. Scores come from tests, never from a model.</span>
        </footer>
      </section>
    </div>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--ink)]">{children} </span>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <div className="mono rounded-xl bg-[var(--night)] p-4 text-[12.5px] leading-[1.8] text-[var(--text)]">{children}</div>;
}

function Tick() {
  return (
    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--pass)]/20 text-[var(--pass)]">
      <IconCheck size={10} strokeWidth={2.4} />
    </span>
  );
}

function TopicBars() {
  const topics: [string, number][] = [
    ["arrays", 48],
    ["hashing", 35],
    ["two pointers", 22],
    ["trees", 19],
    ["sliding window", 14],
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_1.2fr]">
      <ul className="space-y-2 text-[13px]">
        {[
          ["Résumé", "2 pages, 3 projects"],
          ["GitHub", "inventory-service, report-builder"],
          ["Codeforces", "rating 1480"],
        ].map(([k, v]) => (
          <li key={k} className="flex justify-between gap-4 border-b border-[var(--line)] pb-2">
            <span className="text-[var(--text-3)]">{k}</span>
            <span className="truncate">{v}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        {topics.map(([t, n]) => (
          <div key={t} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-[12.5px]">
            <span className="text-[var(--text-2)]">{t}</span>
            <span className="h-1.5 rounded-full bg-[var(--parchment-3)]">
              <span className="block h-1.5 rounded-full bg-[var(--ink)]" style={{ width: `${(n / 48) * 100}%` }} />
            </span>
            <span className="mono text-right text-[var(--text-3)]">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
