"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { STAGES } from "@/lib/site";
import { ARTIFACTS } from "./Artifacts";
import Chip from "./Chip";

// Desktop: a tall track with a sticky frame; scroll position picks the active stage.
// Phones: the same stages as a plain list with each artifact inline.
export default function Pipeline() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(STAGES.length - 1, Math.max(0, Math.floor(v * STAGES.length))));
  });

  const Art = ARTIFACTS[STAGES[active].id];

  return (
    <section className="section pipe" id="how">
      <div className="wrap">
        <p className="label">How it works</p>
        <h2 className="h2 pipe-title">Seven steps from a JSON file to a score you can recompute.</h2>
      </div>

      <div className="pipe-track" ref={track} style={{ height: `${STAGES.length * 70}vh` }}>
        <div className="pipe-sticky">
          <div className="wrap grid pipe-grid">
            <ol className="pipe-list">
              <motion.span className="pipe-rail" style={{ scaleY: scrollYProgress }} aria-hidden />
              {STAGES.map((s, i) => (
                <li key={s.id} className={i === active ? "on" : i < active ? "past" : ""}>
                  <span className="pipe-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pipe-name">{s.title}</span>
                </li>
              ))}
            </ol>
            <div className="pipe-panel" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={STAGES[active].id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="pipe-head">
                    <h3 className="h3">{STAGES[active].title}</h3>
                    <Chip s={STAGES[active].status} />
                  </div>
                  <p>{STAGES[active].body}</p>
                  <Art />
                  <p className="small pipe-note">{STAGES[active].note}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <ol className="wrap pipe-mobile">
        {STAGES.map((s, i) => {
          const A = ARTIFACTS[s.id];
          return (
            <li key={s.id}>
              <div className="pipe-head">
                <h3 className="h3">
                  <span className="pipe-n">{String(i + 1).padStart(2, "0")}</span> {s.title}
                </h3>
                <Chip s={s.status} />
              </div>
              <p>{s.body}</p>
              <A />
              <p className="small pipe-note">{s.note}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
