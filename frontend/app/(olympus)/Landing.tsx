"use client";

import { useRef } from "react";
import { BRAND, SiteNav } from "@/components/olympus/Chrome";
import Engraving from "@/components/olympus/Engraving";
import { IconArrowDown, IconCheck, Star } from "@/components/olympus/Icons";
import { Btn, FadeIn, RevealText, SmoothScroll } from "@/components/olympus/Kit";
import Meander from "@/components/olympus/Meander";
import { TLink } from "@/components/olympus/Shell";
import type { EngravingName } from "@/lib/olympus/engravings";
import { gsap, ScrollTrigger, SplitText, useGsap } from "@/lib/olympus/motion";

// Deterministic star field (same on server and client).
function starField(n: number, seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, () => ({ x: rnd() * 100, y: rnd() * 100, r: 0.6 + rnd() * 1.6, d: rnd() * 6 }));
}
const STARS = starField(90, 7);

const TRIALS: {
  numeral: string;
  title: string;
  kicker: string;
  body: string;
  points: string[];
  art: EngravingName;
  night?: boolean;
}[] = [
  {
    numeral: "I",
    title: "The Offering",
    kicker: "Upload",
    body: "Lay your scrolls at the gate: résumé, GitHub, LeetCode, Codeforces and portfolio. Nothing more is asked of you.",
    points: ["PDF résumé", "Public profiles only", "JSON Resume compatible"],
    art: "scroll",
  },
  {
    numeral: "II",
    title: "Trials of Athena",
    kicker: "Personalised assessment",
    body: "A bug in a codebase shaped like yours and an algorithm matched to what you've solved. Hermes summarises and hints, at a visible cost.",
    points: ["Your stack, your concepts", "Hidden tests in a sandbox", "Hint ladder, never answers"],
    art: "athena",
  },
  {
    numeral: "III",
    title: "The Labyrinth",
    kicker: "Code comprehension",
    body: "A real repository with real issues. Analyse it, debug it, and say how you'd make it faster. Ariadne holds the thread if you lose your way.",
    points: ["Analyse · debug · optimise", "Issue tracker", "Ariadne, the guarded guide"],
    art: "minotaur",
  },
  {
    numeral: "IV",
    title: "The Oracle",
    kicker: "Voice interview",
    body: "Ten minutes with an AI interviewer who has read your work and your submission. Speak freely; the Oracle listens, asks and follows up.",
    points: ["Ten minutes, eight questions", "Live captions", "Shown, never scored"],
    art: "sun",
    night: true,
  },
  {
    numeral: "V",
    title: "The Verdict",
    kicker: "Report",
    body: "A deterministic report: correctness from visible and hidden tests, AI efficiency, comprehension and the interview — reproducible to the decimal.",
    points: ["Same work, same score", "Re-grade any time", "Download as PDF"],
    art: "nike",
  },
];

const LAWS = [
  { title: "No oracle decides your score", body: "Language models never judge correctness. Scores come only from test results and published formulas." },
  { title: "What is hidden stays hidden", body: "Reference solutions and hidden tests never leave the backend — not to the browser, not into any model." },
  { title: "Every run in a sealed vault", body: "Your code runs in a fresh container: no network, capped CPU and memory, a non-root user." },
  { title: "Same deeds, same verdict", body: "The same events and snapshots always produce the same score. Re-grade it yourself." },
];

const PANTHEON: { name: string; role: string; body: string; guard: string; art: EngravingName }[] = [
  {
    name: "Hermes",
    role: "Messenger · summaries & hints",
    body: "Condenses a task into four lines and climbs a three-step hint ladder — nudge, direction, approach — when you ask.",
    guard: "Never writes your fix",
    art: "hermes-bust",
  },
  {
    name: "Ariadne",
    role: "Thread-keeper · repository guide",
    body: "A chat companion inside the Labyrinth. Ask where a request flows, why a cache misbehaves, how to prove a bug.",
    guard: "Points the way, never walks it",
    art: "muse-bust",
  },
  {
    name: "Pythia",
    role: "The Oracle · voice interviewer",
    body: "Speaks, listens and follows up on your own portfolio and submission, with captions and a hard ten-minute limit.",
    guard: "Shown in the report, never scored",
    art: "pythia-bust",
  },
];

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(root, (reduced) => {
    // ---- Preloader → hero intro ----
    const seen = (() => {
      try {
        return sessionStorage.getItem("arete.seen") === "1";
      } catch {
        return false;
      }
    })();
    try {
      sessionStorage.setItem("arete.seen", "1");
    } catch {}

    const intro = gsap.timeline({ paused: true });
    intro
      .from(".hero-line > span", { yPercent: 115, rotate: 3, duration: 1.5, stagger: 0.12, ease: "expo.out" })
      .from(".hero-fade", { y: 30, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out" }, "-=1.1")
      .from(".hero-atlas", { y: 120, opacity: 0, duration: 1.8, ease: "expo.out" }, "-=1.5")
      .from(".hero-chart", { scale: 0.6, opacity: 0, rotate: -40, duration: 2.2, ease: "expo.out" }, "<")
      .from(".hero-pegasus", { x: 260, y: -60, opacity: 0, duration: 2, ease: "expo.out" }, "<0.2")
      .from(".hero-ring", { scale: 0.8, opacity: 0, duration: 1.6, stagger: 0.1, ease: "expo.out" }, "<");

    if (reduced) {
      gsap.set(".preloader", { display: "none" });
      intro.progress(1);
      return;
    }

    const counter = { v: 0 };
    gsap
      .timeline({ onComplete: () => gsap.set(".preloader", { display: "none" }) })
      .from(".pre-letter", { yPercent: 110, duration: 0.9, stagger: 0.05, ease: "expo.out" })
      .to(counter, {
        v: 100,
        duration: seen ? 0.6 : 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
          const el = document.querySelector(".pre-count");
          if (el) el.textContent = String(Math.round(counter.v)).padStart(3, "0");
        },
      }, "<")
      .to(".pre-bar", { scaleX: 1, duration: seen ? 0.6 : 1.5, ease: "power2.inOut" }, "<")
      .to(".pre-letter", { yPercent: -110, duration: 0.6, stagger: 0.03, ease: "expo.in" })
      .to(".preloader", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.2")
      .add(() => intro.play(), "-=0.55");

    // ---- Hero: mouse depth + scroll parallax ----
    const depthEls = gsap.utils.toArray<HTMLElement>("[data-depth]");
    const movers = depthEls.map((el) => ({
      d: parseFloat(el.dataset.depth ?? "0"),
      x: gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" }),
    }));
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => {
        m.x(-nx * m.d * 70);
        m.y(-ny * m.d * 50);
      });
    };
    window.addEventListener("pointermove", onMove);

    const heroScroll = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to(".hero-atlas-inner", { yPercent: 18, ease: "none", scrollTrigger: heroScroll });
    gsap.to(".hero-chart-inner", { rotate: 70, scale: 1.15, ease: "none", scrollTrigger: heroScroll });
    gsap.to(".hero-pegasus-inner", { xPercent: -60, yPercent: -70, ease: "none", scrollTrigger: heroScroll });
    gsap.to(".hero-copy", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: heroScroll });

    // ---- Marquee driven by scroll velocity ----
    const loop = gsap.to(".marquee-track", { xPercent: -100, duration: 26, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: ".marquee-band",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        // Faster while scrolling, reversed when scrolling up, easing back to cruise speed.
        const boost = 1 + Math.min(5, Math.abs(self.getVelocity()) / 400);
        gsap.to(loop, {
          timeScale: self.direction * boost,
          duration: 0.25,
          overwrite: true,
          onComplete: () => void gsap.to(loop, { timeScale: self.direction, duration: 1.2 }),
        });
      },
    });

    // ---- Manifesto words light up ----
    const words = SplitText.create(".manifesto-text", { type: "words" });
    gsap.fromTo(words.words, { opacity: 0.13 }, {
      opacity: 1,
      stagger: 0.12,
      ease: "none",
      scrollTrigger: { trigger: ".manifesto", start: "top 70%", end: "bottom 65%", scrub: 0.6 },
    });
    gsap.from(".manifesto-pill", {
      scale: 0,
      rotate: -25,
      stagger: 0.2,
      ease: "back.out(2)",
      scrollTrigger: { trigger: ".manifesto", start: "top 60%", end: "bottom 70%", scrub: 0.6 },
    });

    // ---- Five trials: pinned horizontal track on wide screens ----
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const track = document.querySelector<HTMLElement>(".trials-track");
      if (!track) return;
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { trigger: ".trials-pin", start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
      });
      gsap.to(".trials-progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".trials-pin", start: "top top", end: () => `+=${distance()}`, scrub: true } });
      gsap.utils.toArray<HTMLElement>(".trial-art").forEach((el) => {
        gsap.fromTo(el, { xPercent: 18, rotate: 4 }, {
          xPercent: -18,
          rotate: -4,
          ease: "none",
          scrollTrigger: { trigger: el.closest(".trial-card"), containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        });
      });
    });

    // ---- Forge: steps highlight as the tablets pass ----
    gsap.utils.toArray<HTMLElement>(".forge-tablet").forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        toggleClass: { targets: `.forge-step-${i}`, className: "is-on" },
      });
    });
    gsap.from(".tier-col", {
      yPercent: 40,
      opacity: 0,
      stagger: 0.15,
      duration: 1.4,
      ease: "expo.out",
      scrollTrigger: { trigger: ".tier-cols", start: "top 85%" },
    });
    gsap.utils.toArray<HTMLElement>(".bar-fill").forEach((el) => {
      gsap.from(el, { scaleX: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });

    // ---- Laws: shield turns with scroll ----
    gsap.fromTo(".laws-shield", { rotate: -30, scale: 0.85 }, { rotate: 30, scale: 1.05, ease: "none", scrollTrigger: { trigger: ".laws", start: "top bottom", end: "bottom top", scrub: true } });

    // ---- Stats count up ----
    gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
      const to = parseFloat(el.dataset.count ?? "0");
      const o = { v: 0 };
      gsap.to(o, {
        v: to,
        duration: 2.2,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => (el.textContent = String(Math.round(o.v))),
      });
    });

    // ---- Finale ----
    gsap.fromTo(".finale-panorama", { yPercent: 25 }, { yPercent: -5, ease: "none", scrollTrigger: { trigger: ".finale", start: "top bottom", end: "bottom bottom", scrub: true } });
    gsap.from(".finale-word > span", {
      yPercent: 110,
      duration: 1.6,
      stagger: 0.06,
      ease: "expo.out",
      scrollTrigger: { trigger: ".finale", start: "top 60%" },
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      words.revert();
      mm.revert();
    };
  });

  return (
    <div ref={root}>
      <SmoothScroll />
      <Preloader />
      <SiteNav />

      {/* ------------------------------------------------------------ Hero */}
      <section className="hero relative min-h-[100svh] overflow-hidden px-[var(--gutter)] pt-32 pb-10">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div data-depth="0.25" className="absolute right-[-12vw] top-[2vh] w-[min(78vw,1040px)] md:right-[-6vw]">
            <div className="hero-chart">
              <div className="hero-chart-inner">
                <div className="spin-slow">
                  <Engraving name="starchart" className="w-full opacity-[0.09]" />
                </div>
              </div>
            </div>
          </div>
          <svg data-depth="0.4" className="hero-ring absolute right-[4vw] top-[12vh] hidden h-[min(64vw,820px)] w-[min(64vw,820px)] md:block" viewBox="0 0 400 400">
            <g className="spin-mid" style={{ transformOrigin: "200px 200px" }}>
              <circle cx="200" cy="200" r="196" fill="none" stroke="var(--ink)" strokeOpacity="0.22" strokeDasharray="1 7" />
              {Array.from({ length: 12 }, (_, i) => (
                <text key={i} x="200" y="16" textAnchor="middle" fontSize="9" fill="var(--ink)" fillOpacity="0.45" fontFamily="var(--mono)" transform={`rotate(${i * 30} 200 200)`}>
                  {["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ"][i]}
                </text>
              ))}
            </g>
            <circle cx="200" cy="200" r="150" fill="none" stroke="var(--gold)" strokeOpacity="0.45" strokeWidth="0.75" />
            <ellipse cx="200" cy="200" rx="178" ry="60" fill="none" stroke="var(--ink)" strokeOpacity="0.16" transform="rotate(-18 200 200)" />
          </svg>
          <div data-depth="0.7" className="absolute bottom-[-2vh] right-[6vw] hidden w-[min(46vw,430px)] md:block md:right-[17vw]">
            <div className="hero-atlas">
              <div className="hero-atlas-inner">
                <Engraving name="atlas" className="w-full" label="Atlas carrying the celestial sphere" />
              </div>
            </div>
          </div>
          <div data-depth="1.1" className="absolute right-[-4vw] top-[14vh] w-[min(40vw,460px)]">
            <div className="hero-pegasus">
              <div className="hero-pegasus-inner">
                <Engraving name="pegasus-flight" className="w-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="hero-copy relative z-10 mx-auto flex min-h-[calc(100svh-10.5rem)] max-w-[1600px] flex-col justify-between">
          <div>
            <p className="eyebrow hero-fade mb-8 flex items-center gap-3">
              <span className="inline-block h-px w-10 bg-[var(--ink)]" />
              Portfolio-forged technical assessment
            </p>
            <h1 className="display text-[clamp(68px,12.4vw,224px)] text-[var(--text)]">
              <span className="split-line hero-line">
                <span className="inline-block">Prove your</span>
              </span>
              <span className="split-line hero-line">
                <span className="inline-block">
                  <em className="text-[var(--ink)]">{BRAND}</em>
                  <span className="text-[var(--ink)]">.</span>
                </span>
              </span>
            </h1>
          </div>

          <div className="mt-10 grid items-end gap-10 md:grid-cols-[minmax(0,520px)_1fr]">
            <div>
              <p className="hero-fade mb-3 font-[family-name:var(--display)] text-[19px] italic text-[var(--text-2)]">
                a·re·té <span className="not-italic">(n.)</span> — excellence; living up to one&apos;s full potential.
              </p>
              <p className="hero-fade max-w-[520px] text-[17px] leading-relaxed text-[var(--text-2)]">
                Hand us your résumé, GitHub, LeetCode and Codeforces. We forge a sixty-minute trial in your own stack, a real
                repository to untangle and a ten-minute audience with the Oracle — then let the tests, not a language model,
                deliver the verdict.
              </p>
              <div className="hero-fade mt-8 flex flex-wrap items-center gap-3">
                <Btn href="/ascend">Begin the ascent</Btn>
                <Btn variant="ghost" icon={<IconArrowDown size={14} />} onClick={() => document.getElementById("trials")?.scrollIntoView({ behavior: "smooth" })}>
                  See the five trials
                </Btn>
              </div>
            </div>
            <div className="hero-fade hidden justify-self-end md:block">
              <ScrollBadge />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Marquee */}
      <section className="marquee-band relative z-10 -mx-4 my-10 -rotate-2 bg-[var(--ink)] py-5 text-[var(--parchment)]" aria-label="What we read">
        <Meander className="mb-4 text-[var(--parchment)] opacity-40" height={14} />
        <div className="marquee display text-[clamp(44px,7vw,112px)] italic leading-none">
          {[0, 1].map((k) => (
            <div key={k} className="marquee-track" aria-hidden={k === 1}>
              {["Résumé", "GitHub", "LeetCode", "Codeforces", "Portfolio", "Résumé", "GitHub", "LeetCode", "Codeforces", "Portfolio"].map((w, i) => (
                <span key={i} className="flex items-center gap-[0.5em]">
                  {w}
                  <Star className="text-[var(--gold-bright)]" />
                </span>
              ))}
            </div>
          ))}
        </div>
        <Meander className="mt-4 text-[var(--parchment)] opacity-40" height={14} />
      </section>

      {/* ------------------------------------------------------------ Manifesto */}
      <section className="manifesto mx-auto max-w-[1400px] px-[var(--gutter)] py-[18vh]">
        <p className="eyebrow mb-10">Ⅱ · Why {BRAND}</p>
        <p className="manifesto-text display text-[clamp(34px,5.4vw,84px)] leading-[1.04]" style={{ fontWeight: 400 }}>
          Résumés boast. Interviews guess.{" "}
          <Pill name="medusa" /> {BRAND} does neither. It reads the record you have already written, forges a trial in{" "}
          <em>your own stack</em> <Pill name="athena-helm-bust" />, runs every line in a sealed sandbox, and lets{" "}
          <em>hidden tests</em> deliver the verdict <Pill name="wreath" />
        </p>
      </section>

      {/* ------------------------------------------------------------ Five trials */}
      <section id="trials" className="trials-pin relative overflow-hidden">
        <div className="trials-track flex flex-col gap-6 px-[var(--gutter)] pb-16 md:h-[100svh] md:w-max md:flex-row md:items-center md:gap-8 md:pb-0">
          <div className="flex w-full shrink-0 flex-col justify-center md:w-[38vw] md:pr-10">
            <p className="eyebrow mb-6">Ⅲ · The journey</p>
            <RevealText as="h2" className="display text-[clamp(52px,7vw,124px)]">
              The five <em className="text-[var(--ink)]">trials</em>
            </RevealText>
            <p className="mt-8 max-w-[440px] text-[17px] leading-relaxed text-[var(--text-2)]">
              One path, five rooms. Each tests something a résumé can only claim: that you can read, repair, reason and explain.
            </p>
            <p className="eyebrow mt-10 hidden items-center gap-3 md:flex">
              Scroll <span className="inline-block h-px w-16 bg-[var(--ink)]" />
            </p>
          </div>
          {TRIALS.map((t) => (
            <TrialCard key={t.numeral} {...t} />
          ))}
          <div className="hidden w-[10vw] shrink-0 md:block" />
        </div>
        <div className="absolute inset-x-[var(--gutter)] bottom-8 hidden h-px bg-[var(--line)] md:block">
          <div className="trials-progress h-px origin-left scale-x-0 bg-[var(--ink)]" />
        </div>
      </section>

      {/* ------------------------------------------------------------ Forge */}
      <section id="forge" className="mx-auto max-w-[1600px] px-[var(--gutter)] py-[16vh]">
        <div className="grid gap-16 md:grid-cols-[1fr_1.1fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <p className="eyebrow mb-6">Ⅳ · How it&apos;s forged</p>
            <RevealText as="h2" className="display text-[clamp(44px,5.4vw,92px)]">
              Forged from your record, <em className="text-[var(--ink)]">not</em> fetched from a bank.
            </RevealText>
            <ol className="mt-12 space-y-1">
              {[
                ["Read", "Your profiles become a JSON Resume portfolio: stack, projects, problems solved by topic."],
                ["Profile", "Deterministic rules pick your domain, runtime, concepts and tier. A model only fills gaps."],
                ["Build & validate", "A seed repo is mutated in your stack; every task passes a validation gate before you see it."],
              ].map(([title, body], i) => (
                <li key={title} className={`forge-step forge-step-${i} border-t border-[var(--line)] py-5`}>
                  <div className="flex items-baseline gap-5">
                    <span className="numeral text-[22px] text-[var(--ink)]">{["i", "ii", "iii"][i]}.</span>
                    <div>
                      <p className="text-[19px] font-medium">{title}</p>
                      <p className="forge-step-body mt-1 max-w-[440px] text-[15px] leading-relaxed text-[var(--text-2)]">{body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-8">
            <ForgeInputs />
            <ForgeProfile />
            <ForgeTiers />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Laws */}
      <section id="laws" className="laws relative overflow-hidden bg-[var(--ink-deep)] px-[var(--gutter)] py-[16vh] text-[var(--moon)]">
        <Meander className="absolute inset-x-0 top-6 text-[var(--moon)] opacity-25" height={14} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[min(80vw,720px)] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
          <div className="laws-shield">
            <Engraving name="medusa" className="w-full opacity-[0.12]" style={{ color: "var(--moon)" }} />
          </div>
        </div>
        <div className="relative mx-auto max-w-[1400px]">
          <p className="eyebrow mb-6">Ⅴ · Integrity</p>
          <RevealText as="h2" className="display max-w-[900px] text-[clamp(44px,5.6vw,96px)]">
            The laws of <em style={{ color: "var(--gold-bright)" }}>Olympus</em>
          </RevealText>
          <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-[rgba(233,228,212,0.7)]">
            Medusa&apos;s gaze cannot be flattered. Neither can the grader. Four rules are written into the code, not the brochure.
          </p>
          <div className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-[rgba(233,228,212,0.14)] bg-[rgba(233,228,212,0.14)] md:grid-cols-2">
            {LAWS.map((law, i) => (
              <FadeIn key={law.title} delay={i * 0.08}>
                <article className="group relative h-full overflow-hidden bg-[var(--ink-deep)] p-8 transition-colors duration-700 hover:bg-[#1a2a86] md:p-12">
                  <span className="numeral absolute right-8 top-6 text-[64px] leading-none text-[rgba(233,228,212,0.08)] transition-colors duration-700 group-hover:text-[rgba(226,194,134,0.35)]">
                    {["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"][i]}
                  </span>
                  <h3 className="display max-w-[80%] text-[clamp(28px,2.6vw,40px)] leading-[1.05]">{law.title}</h3>
                  <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-[rgba(233,228,212,0.68)]">{law.body}</p>
                  <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-[var(--gold-bright)] transition-transform duration-700 group-hover:scale-x-100" />
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Pantheon */}
      <section id="pantheon" className="mx-auto max-w-[1600px] px-[var(--gutter)] py-[16vh]">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow mb-6">Ⅵ · Your guides</p>
            <RevealText as="h2" className="display text-[clamp(44px,5.6vw,96px)]">
              A guarded <em className="text-[var(--ink)]">pantheon</em>
            </RevealText>
          </div>
          <p className="max-w-[420px] text-[16px] leading-relaxed text-[var(--text-2)]">
            Three AI companions, each with one job and one rule. Every hint and message is logged, and none of them ever sees a hidden
            test.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PANTHEON.map((g, i) => (
            <FadeIn key={g.name} delay={i * 0.1}>
              <GodCard {...g} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Stats */}
      <section className="mx-auto max-w-[1600px] px-[var(--gutter)] pb-[14vh]">
        <Meander className="mb-12 opacity-50" height={14} />
        <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4">
          {[
            ["60", "minutes in the Trials"],
            ["101", "vetted algorithm problems"],
            ["3", "tiers: Novice · Adept · Master"],
            ["0", "scores decided by a model"],
          ].map(([n, label], i) => (
            <div key={label} className={`px-2 md:px-8 ${i > 0 ? "md:border-l md:border-[var(--line)]" : ""}`}>
              <p className="display text-[clamp(64px,8vw,132px)] text-[var(--ink)] tabular-nums" data-count={n}>
                {n}
              </p>
              <p className="mt-2 max-w-[200px] text-[14px] text-[var(--text-2)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Finale */}
      <section className="finale relative overflow-hidden bg-[var(--night)] text-[var(--moon)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-[var(--moon)]"
              style={{ left: `${s.x}%`, top: `${s.y * 0.7}%`, width: s.r, height: s.r, animation: `oly-twinkle ${3 + s.d}s ease-in-out ${s.d}s infinite` }}
            />
          ))}
        </div>
        <div className="relative mx-auto flex max-w-[1600px] flex-col items-center px-[var(--gutter)] pt-[18vh] text-center">
          <p className="eyebrow mb-8">Ⅶ · Your turn</p>
          <h2 className="display text-[clamp(96px,19vw,330px)]" aria-label="Ascend.">
            <span className="finale-word split-line" aria-hidden="true">
              {"Ascend.".split("").map((ch, i) => (
                <span key={i} className="inline-block italic">
                  {ch}
                </span>
              ))}
            </span>
          </h2>
          <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-[rgba(233,228,212,0.7)]">
            Five rounds, about ninety minutes, one honest report. Bring your scrolls.
          </p>
          <div className="mt-10">
            <Btn href="/ascend" variant="moon">
              Begin the ascent
            </Btn>
          </div>
        </div>
        <div className="relative mt-[8vh] h-[clamp(240px,34vw,520px)] overflow-hidden" aria-hidden="true">
          <div className="finale-panorama absolute inset-x-[-4vw] top-0">
            <Engraving
              name="panorama"
              className="w-full"
              style={{ color: "var(--moon)", opacity: 0.5 }}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--night)] to-transparent" />
        </div>
        <footer className="relative border-t border-[rgba(233,228,212,0.12)] px-[var(--gutter)] py-10">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-6 text-[13px] text-[rgba(233,228,212,0.6)]">
            <span className="display text-[24px] text-[var(--moon)]" style={{ fontWeight: 500 }}>
              {BRAND}
            </span>
            <nav className="flex flex-wrap gap-6">
              {[
                ["/ascend", "Offering"],
                ["/trials", "Trials"],
                ["/labyrinth", "Labyrinth"],
                ["/oracle", "Oracle"],
                ["/verdict", "Verdict"],
              ].map(([href, label]) => (
                <TLink key={href} href={href} className="transition-colors hover:text-[var(--moon)]">
                  {label}
                </TLink>
              ))}
            </nav>
            <span>HFT26 · Team 41 · JL — scores come from tests, never from a model.</span>
          </div>
        </footer>
      </section>
    </div>
  );
}

function Preloader() {
  return (
    <div className="preloader fixed inset-0 z-[160] flex flex-col justify-between bg-[var(--parchment)] p-[var(--gutter)]" aria-hidden="true">
      <Meander className="opacity-40" height={14} />
      <div className="flex flex-col items-center">
        <Engraving name="wreath" className="mb-6 w-24 text-[var(--ink)]" />
        <p className="display flex overflow-hidden text-[clamp(64px,12vw,180px)] text-[var(--ink)]">
          {BRAND.split("").map((ch, i) => (
            <span key={i} className="pre-letter inline-block italic">
              {ch}
            </span>
          ))}
        </p>
      </div>
      <div>
        <div className="mb-4 flex items-end justify-between">
          <span className="eyebrow">Ascending Olympus</span>
          <span className="pre-count mono text-[13px] tabular-nums text-[var(--ink)]">000</span>
        </div>
        <div className="h-px bg-[var(--line)]">
          <div className="pre-bar h-px origin-left scale-x-0 bg-[var(--ink)]" />
        </div>
      </div>
    </div>
  );
}

function ScrollBadge() {
  return (
    <div className="relative grid h-[132px] w-[132px] place-items-center" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="spin-mid absolute inset-0 h-full w-full">
        <defs>
          <path id="badge-circle" d="M50 50 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0" />
        </defs>
        <text fontSize="7.4" letterSpacing="2.6" fill="var(--ink)" fontFamily="var(--mono)">
          <textPath href="#badge-circle">SCROLL TO ASCEND ✦ FIVE TRIALS ✦ ONE VERDICT ✦</textPath>
        </text>
      </svg>
      <Engraving name="star" className="w-8 text-[var(--ink)]" />
    </div>
  );
}

function Pill({ name }: { name: EngravingName }) {
  return (
    <span className="manifesto-pill relative -top-[0.08em] mx-[0.08em] inline-flex h-[0.86em] w-[1.5em] items-center justify-center overflow-hidden rounded-full bg-[var(--parchment-2)] align-middle shadow-[inset_0_0_0_1px_var(--line-strong)]">
      <Engraving name={name} className="h-[0.7em] w-auto text-[var(--ink)]" />
    </span>
  );
}

function TrialCard({ numeral, title, kicker, body, points, art, night }: (typeof TRIALS)[number]) {
  return (
    <article
      className={`trial-card engr-host group relative flex w-full shrink-0 flex-col justify-between overflow-hidden rounded-[28px] p-8 transition-transform duration-700 hover:-translate-y-2 md:h-[76svh] md:w-[min(64vw,820px)] md:p-12 ${
        night ? "bg-[var(--night-2)] text-[var(--moon)]" : "bg-[var(--parchment-2)]"
      }`}
      style={{ boxShadow: night ? "none" : "inset 0 0 0 1px var(--line)" }}
      data-cursor="Trial"
    >
      <div className="relative z-10 flex items-start justify-between gap-6">
        <div>
          <p className={`eyebrow mb-4 ${night ? "" : ""}`}>{kicker}</p>
          <h3 className="display text-[clamp(44px,4.8vw,84px)]">{title}</h3>
        </div>
        <span
          className="numeral text-[clamp(80px,9vw,150px)] leading-[0.8]"
          style={{ color: "transparent", WebkitTextStroke: `1px ${night ? "rgba(233,228,212,0.45)" : "var(--ink)"}` }}
        >
          {numeral}
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-[-4%] right-[4%] w-[46%] md:w-[38%]" aria-hidden="true">
        <div className="trial-art">
          <Engraving name={art} sheen={!night} className="w-full" style={night ? { color: "var(--gold-bright)" } : undefined} />
        </div>
      </div>
      <div className="relative z-10 mt-10 max-w-[52%] md:mt-0">
        <p className={`text-[16px] leading-relaxed ${night ? "text-[rgba(233,228,212,0.75)]" : "text-[var(--text-2)]"}`}>{body}</p>
        <ul className="mt-6 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-[14px]">
              <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: night ? "var(--gold-bright)" : "var(--ink)", color: night ? "var(--night)" : "var(--parchment)" }}>
                <IconCheck size={11} strokeWidth={2.2} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Tablet({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="forge-tablet rounded-[24px] bg-[rgba(255,253,247,0.6)] p-7 shadow-[inset_0_0_0_1px_var(--line)] md:p-9">
      <p className="eyebrow mb-6 flex items-center gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)]" />
        {label}
      </p>
      {children}
    </div>
  );
}

function ForgeInputs() {
  const topics: [string, number][] = [
    ["arrays", 48],
    ["hashing", 35],
    ["two pointers", 22],
    ["trees", 19],
    ["graphs", 16],
    ["sliding window", 14],
  ];
  return (
    <Tablet label="What we read">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 text-[14px]">
          {[
            ["Résumé", "sriram-cv.pdf · 2 pages"],
            ["GitHub", "expense-tracker · fastapi-auth · 14 repos"],
            ["Codeforces", "rating 1480 · specialist"],
            ["Portfolio", "sriram.dev"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col border-b border-[var(--line)] pb-3">
              <span className="eyebrow !text-[10px]">{k}</span>
              <span className="mt-1">{v}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="eyebrow mb-3 !text-[10px]">LeetCode · solved by topic</p>
          <div className="space-y-2.5">
            {topics.map(([t, n]) => (
              <div key={t} className="text-[13px]">
                <div className="mb-1 flex justify-between">
                  <span>{t}</span>
                  <span className="mono text-[var(--text-3)]">{n}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--parchment-3)]">
                  <div className="bar-fill h-1.5 origin-left rounded-full bg-[var(--ink)]" style={{ width: `${(n / 48) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Tablet>
  );
}

function ForgeProfile() {
  return (
    <Tablet label="Your profile · deterministic rules">
      <div className="mono rounded-2xl bg-[var(--night-2)] p-6 text-[13px] leading-[1.9] text-[var(--moon)]">
        <p>
          <span className="text-[#8fa2ff]">domain</span> <span className="opacity-40">→</span> <span className="text-[var(--gold-bright)]">&quot;backend&quot;</span>
        </p>
        <p>
          <span className="text-[#8fa2ff]">runtime</span> <span className="opacity-40">→</span> <span className="text-[var(--gold-bright)]">&quot;python311&quot;</span>
        </p>
        <p>
          <span className="text-[#8fa2ff]">concepts</span> <span className="opacity-40">→</span> [pagination, caching, auth, reporting]
        </p>
        <p>
          <span className="text-[#8fa2ff]">suggested_tier</span> <span className="opacity-40">→</span>{" "}
          <span className="text-[var(--gold-bright)]">&quot;adept&quot;</span>
        </p>
        <p className="mt-2 opacity-50"># 2 projects, 165 solved and an adept topic (graphs) → adept</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {["reference passes 3/3", "starter fails 3/8 visible", "leak check clean", "AI solve-rate probed"].map((c) => (
          <span key={c} className="chip">
            <IconCheck size={12} /> {c}
          </span>
        ))}
      </div>
    </Tablet>
  );
}

function ForgeTiers() {
  const tiers: { name: string; art: EngravingName; h: string; body: string }[] = [
    { name: "Novice", art: "column-2", h: "62%", body: "1-file bug fix · easy algorithm" },
    { name: "Adept", art: "column-ionic", h: "80%", body: "2–3 file feature · medium · Hermes on" },
    { name: "Master", art: "column-1", h: "100%", body: "multi-file bug + perf budget · hard" },
  ];
  return (
    <Tablet label="Three tiers, rising">
      <div className="tier-cols grid h-[300px] grid-cols-3 items-end gap-4">
        {tiers.map((t) => (
          <div key={t.name} className="tier-col engr-host flex h-full flex-col items-center justify-end text-center">
            <div className="flex w-full flex-1 items-end justify-center">
              <Engraving name={t.art} sheen className="w-auto max-w-[110px]" style={{ height: t.h }} />
            </div>
            <p className="display mt-4 text-[28px]">{t.name}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-[var(--text-2)]">{t.body}</p>
          </div>
        ))}
      </div>
    </Tablet>
  );
}

function GodCard({ name, role, body, guard, art }: (typeof PANTHEON)[number]) {
  const card = useRef<HTMLElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el.querySelector(".god-art"), { rotateY: x * 18, rotateX: -y * 14, x: x * 16, duration: 0.8, ease: "power3.out" });
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => gsap.to(card.current?.querySelector(".god-art") ?? null, { rotateY: 0, rotateX: 0, x: 0, duration: 1.2, ease: "elastic.out(1,0.5)" });
  return (
    <article
      ref={card}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="engr-host group relative overflow-hidden rounded-[26px] bg-[var(--parchment-2)] p-8 shadow-[inset_0_0_0_1px_var(--line)]"
      style={{ perspective: 900 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(35,55,165,0.1), transparent 60%)" }}
      />
      <div className="relative flex h-[300px] items-center justify-center">
        <div className="god-art w-[62%]" style={{ transformStyle: "preserve-3d" }}>
          <Engraving name={art} sheen className="w-full" label={`${name}, engraved bust`} />
        </div>
      </div>
      <div className="relative mt-6 border-t border-[var(--line)] pt-6">
        <h3 className="display text-[44px] leading-none">{name}</h3>
        <p className="eyebrow mt-3">{role}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-2)]">{body}</p>
        <p className="chip chip-gold mt-5">{guard}</p>
      </div>
    </article>
  );
}
