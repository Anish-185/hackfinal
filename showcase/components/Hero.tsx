"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { NAME } from "@/lib/site";

// The one load-time sequence on the page: a real portfolio fixture is read (keywords
// light up), becomes a profile, then becomes a task. All three are repo data.
const STEPS = 6;

export default function Hero() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const { scrollY } = useScroll();
  const drift = useTransform(scrollY, [0, 800], [0, -90]);

  useEffect(() => {
    if (reduce) {
      setStep(STEPS);
      return;
    }
    const timers = [500, 900, 1300, 1700, 2500, 3500].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const hl = (n: number) => (step >= n ? "hl on" : "hl");

  return (
    <section className="hero" id="top">
      <div className="wrap">
        <motion.h1
          className="display hero-name"
          style={{ y: reduce ? 0 : drift }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {NAME}
        </motion.h1>

        <div className="grid hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="hero-promise">
              A coding assessment built from the candidate&apos;s own portfolio, and graded only by tests.
            </p>
            <p className="hero-sub">
              Upload a portfolio. Get a 60-minute task in the candidate&apos;s stack and domain, checked in a
              sandbox before anyone sees it. They solve it in an isolated IDE; the score comes from test results
              and fixed formulas, and you can recompute it.
            </p>
            <p className="small">
              Built during CBIT Hacktoberfest &apos;26. Every part below is marked built, in progress or planned.
            </p>
          </motion.div>

          <div className="specimen" aria-label="A portfolio becoming a profile, then a task">
            <div className={`sheet sheet-1 ${step >= 1 ? "in" : ""}`}>
              <div className="sheet-tab">portfolio.json <span>contracts/fixtures</span></div>
              <pre className="sheet-code">{`"skills": [
  { "name": "Backend",
    "keywords": ["Python", `}<b className={hl(2)}>&quot;FastAPI&quot;</b>{`,
                 `}<b className={hl(2)}>&quot;SQLAlchemy&quot;</b>{`] },
  { "name": "Testing",
    "keywords": [`}<b className={hl(3)}>&quot;pytest&quot;</b>{`, "Hypothesis"] }
],
"assessment": { "dsaTopicsSolved": {
  `}<b className={hl(3)}>&quot;hashing&quot;: 35</b>{`, `}<b className={hl(3)}>&quot;sliding_window&quot;: 14</b>{`
} }`}</pre>
            </div>

            <div className={`sheet sheet-2 ${step >= 4 ? "in" : ""}`}>
              <div className="sheet-tab">profile <span>backend/profiler, rules only</span></div>
              <dl className="sheet-kv">
                <dt>domain</dt><dd>backend</dd>
                <dt>runtime</dt><dd>python311</dd>
                <dt>concepts</dt><dd>caching, reporting, validation</dd>
                <dt>tier</dt><dd>master <span>165 solved, 3 projects</span></dd>
              </dl>
            </div>

            <div className={`sheet sheet-3 ${step >= 5 ? "in" : ""}`}>
              <div className="sheet-tab">task: reporting <span>make remove-feature</span></div>
              <pre className="sheet-code">{`def compute_monthly_report(session, user_id, year, month):
    """Cents spent per category in one calendar month."""
`}<span className="del">{`-   start, end = month_bounds(year, month)`}</span><span className="add">{`+   raise NotImplementedError(
+       "TODO: Cents spent per category in one calendar month.")`}</span></pre>
              <p className={`sheet-foot ${step >= 6 ? "on" : ""}`}>
                Stubbed in 3 files. On the starter, 5 of 7 reporting tests fail and all 34 unrelated tests still pass.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
