"use client";

import { motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { NAME, PRACTICE_URL } from "@/lib/site";

const LINKS = [
  ["#try", "Try it"],
  ["#how", "How it works"],
  ["#trail", "Trail Map"],
  ["#trust", "Trust"],
  ["#progress", "Progress"],
  ["#stack", "Stack"],
];

export default function Header() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.3 });
  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <a href="#top" className="hdr-mark">{NAME}</a>
        <div className="hdr-right">
          <nav aria-label="Sections">
            {LINKS.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <a href={PRACTICE_URL} className="hdr-cc">
            Practice
          </a>
          <Link href="/comprehension" className="hdr-cc">
            Code reading
          </Link>
          <Link href="/interview" className="hdr-ai">
            <span className="hdr-blob" aria-hidden />
            AI interview
          </Link>
        </div>
      </div>
      <motion.div className="hdr-bar" style={{ scaleX }} />
    </header>
  );
}
