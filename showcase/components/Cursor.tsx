"use client";

import { useEffect, useRef } from "react";

// A dot that follows the pointer exactly and a ring that trails it. Over links and
// buttons the ring opens up; over [data-cursor] it shows that word. Drawn with
// mix-blend-mode: difference so it reads on parchment and on the night sections.
// Mouse pointers only; touch and reduced motion keep the system cursor.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("has-cursor");
    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = (e.target as Element).closest?.("a, button, [role=tab], [data-cursor]");
      const word = t?.getAttribute("data-cursor") ?? "";
      ring.current!.dataset.state = t ? (word ? "word" : "link") : "";
      label.current!.textContent = word;
    };
    const tick = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.current!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.current!.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      x = y = -100;
    };
    const down = () => ring.current!.classList.add("down");
    const up = () => ring.current!.classList.remove("down");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden>
      <div className="cursor-ring" ref={ring}>
        <span ref={label} />
      </div>
      <div className="cursor-dot" ref={dot} />
    </div>
  );
}
