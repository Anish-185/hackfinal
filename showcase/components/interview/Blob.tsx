"use client";

import { useEffect, useRef } from "react";

export type AgentState = "idle" | "listening" | "thinking" | "speaking";

/** Shared, mutable signal the page writes and the blob reads every frame. */
export type BlobSignal = { level: number; pulses: number };

type Params = { amp: number; speed: number; scale: number; glow: number; tint: number };

// Per-state targets; the live values ease toward them, so state changes morph.
function target(state: AgentState, level: number): Params {
  switch (state) {
    case "listening":
      return { amp: 0.05 + level * 0.24, speed: 0.9 + level * 1.2, scale: 0.94 + level * 0.14, glow: 0.35 + level * 0.5, tint: 1 };
    case "speaking":
      return { amp: 0.07 + level * 0.2, speed: 1.4, scale: 1 + level * 0.1, glow: 0.45 + level * 0.45, tint: 1 };
    case "thinking":
      return { amp: 0.035, speed: 2.2, scale: 0.84, glow: 0.2, tint: 0.35 };
    default:
      return { amp: 0.04, speed: 0.45, scale: 0.9, glow: 0.22, tint: 0.8 };
  }
}

// Three overlapping liquid layers drawn additively, plus ripples on each spoken word
// or loud syllable. Canvas 2D only; draws while on screen.
const LAYERS = [
  { ph: 0, rot: 0.12, off: 0.05, a: 0.55, c0: [201, 245, 227], c1: [63, 211, 160] },
  { ph: 2.1, rot: -0.09, off: 0.07, a: 0.45, c0: [120, 230, 190], c1: [14, 122, 92] },
  { ph: 4.2, rot: 0.06, off: 0.04, a: 0.4, c0: [63, 211, 160], c1: [10, 70, 54] },
];

const MUTED = [147, 161, 153];

function mix(c: number[], t: number): string {
  return c.map((v, i) => Math.round(MUTED[i] + (v - MUTED[i]) * t)).join(",");
}

export default function Blob({ state, signal }: { state: AgentState; signal: BlobSignal }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p: Params = { ...target("idle", 0) };
    const ripples: { born: number }[] = [];
    let seenPulses = signal.pulses;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const s = c.clientWidth;
      c.width = s * dpr;
      c.height = s * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const shape = (cx: number, cy: number, R: number, ph: number) => {
      ctx.beginPath();
      const steps = 140;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const wob =
          Math.sin(a * 3 + t * 1.3 + ph) * 0.5 +
          Math.sin(a * 5 - t * 1.7 + ph * 1.6) * 0.3 +
          Math.sin(a * 2 + t * 0.6 - ph) * 0.35 +
          Math.sin(a * 7 + t * 2.9 + ph) * 0.12 * signal.level;
        const r = R * (1 + wob * p.amp);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      const goal = target(st, signal.level);
      const k = reduce ? 1 : 1 - Math.pow(0.002, dt);
      for (const key of Object.keys(p) as (keyof Params)[]) p[key] += (goal[key] - p[key]) * k;
      t += dt * p.speed;

      if (signal.pulses !== seenPulses) {
        seenPulses = signal.pulses;
        if (!reduce && ripples.length < 6) ripples.push({ born: now });
      }

      const s = c.clientWidth;
      const cx = s / 2;
      const cy = s / 2;
      const R = s * 0.26 * p.scale;
      ctx.clearRect(0, 0, s, s);

      // Halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2);
      halo.addColorStop(0, `rgba(${mix([63, 211, 160], p.tint)}, ${0.1 + p.glow * 0.3})`);
      halo.addColorStop(1, "rgba(63, 211, 160, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, s, s);

      // Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const age = (now - ripples[i].born) / 1400;
        if (age >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, R * (1.05 + age * 0.75), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(63, 211, 160, ${0.35 * (1 - age)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Liquid layers
      ctx.globalCompositeOperation = "lighter";
      for (const L of LAYERS) {
        const ang = t * L.rot * 4 + L.ph;
        const ox = cx + Math.cos(ang) * R * L.off;
        const oy = cy + Math.sin(ang) * R * L.off;
        shape(ox, oy, R, L.ph);
        const g = ctx.createRadialGradient(ox - R * 0.3, oy - R * 0.35, R * 0.05, ox, oy, R * 1.15);
        g.addColorStop(0, `rgba(${mix(L.c0, p.tint)}, ${L.a})`);
        g.addColorStop(1, `rgba(${mix(L.c1, p.tint)}, ${L.a * 0.5})`);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // Thinking: three dots on an orbit.
      if (st === "thinking") {
        for (let i = 0; i < 3; i++) {
          const a = t * 1.4 + (i * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * R * 1.32, cy + Math.sin(a) * R * 1.32, 3.5, 0, Math.PI * 2);
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
    raf = requestAnimationFrame(draw);
    const redraw = () => requestAnimationFrame(draw);
    c.addEventListener("redraw", redraw);
    window.addEventListener("resize", resize);
    return () => {
      c.removeEventListener("redraw", redraw);
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [signal]);

  // Reduced motion: no loop, so redraw once on each state change.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      canvas.current?.dispatchEvent(new Event("redraw"));
    }
  }, [state]);

  return <canvas ref={canvas} className="iv-blob" aria-hidden />;
}
