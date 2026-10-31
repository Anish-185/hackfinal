"use client";

import { useEffect, useRef, useState } from "react";

// Canvas orb for the planned voice interviewer. Cycles through its four states with a
// simulated volume; draws only while on screen. Reduced motion: one still frame.
const STATES = ["idle", "listening", "thinking", "speaking"] as const;
type State = (typeof STATES)[number];
const CAPTION: Record<State, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export default function Orb() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>("idle");
  const stateRef = useRef<State>("idle");

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;
    let level = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const s = c.clientWidth;
      c.width = s * dpr;
      c.height = s * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const st = STATES[Math.floor(t / 3.2) % STATES.length];
      if (st !== stateRef.current) {
        stateRef.current = st;
        setState(st);
      }
      // Simulated volume per state, smoothed like an AnalyserNode reading.
      const target =
        st === "speaking" ? 0.55 + 0.45 * Math.abs(Math.sin(t * 7.1) * Math.sin(t * 2.3))
        : st === "listening" ? 0.25 + 0.3 * Math.abs(Math.sin(t * 5.3 + Math.sin(t * 1.7)))
        : st === "thinking" ? 0.15
        : 0.06;
      level += (target - level) * 0.12;

      const s = c.clientWidth;
      const cx = s / 2;
      const cy = s / 2;
      const R = s * 0.27 * (1 + level * 0.18);
      ctx.clearRect(0, 0, s, s);

      // Halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.9);
      halo.addColorStop(0, `rgba(63, 211, 160, ${0.18 + level * 0.25})`);
      halo.addColorStop(1, "rgba(63, 211, 160, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, s, s);

      // Body: a closed curve whose radius wobbles with the level.
      ctx.beginPath();
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const wob =
          Math.sin(a * 3 + t * 1.3) * 0.5 + Math.sin(a * 5 - t * 1.9) * 0.3 + Math.sin(a * 2 + t * 0.7) * 0.2;
        const r = R * (1 + wob * (0.025 + level * 0.11));
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.1);
      body.addColorStop(0, "#c9f5e3");
      body.addColorStop(0.45, "#3fd3a0");
      body.addColorStop(1, "#0e5c46");
      ctx.fillStyle = body;
      ctx.fill();

      // Thinking: three dots orbiting.
      if (st === "thinking") {
        for (let k = 0; k < 3; k++) {
          const a = t * 2.4 + (k * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * R * 1.35, cy + Math.sin(a) * R * 1.35, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = "#e3e8e4";
          ctx.fill();
        }
      }

      if (visible && !reduce) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    });
    io.observe(c);
    draw(start + 1000);
    window.addEventListener("resize", resize);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <figure className="orb">
      <canvas ref={canvas} aria-hidden />
      <figcaption>
        <span className="orb-state">{CAPTION[state]}</span>
        <span className="small">Simulated audio level. The real orb follows the mic or the TTS playback.</span>
      </figcaption>
    </figure>
  );
}
