"use client";

import { motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { NAME } from "@/lib/site";

const LINKS = [
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
