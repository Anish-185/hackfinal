"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import Meander from "./Meander";
import { gsap, prefersReducedMotion } from "@/lib/olympus/motion";

export const ROUTE_TITLES: Record<string, string> = {
  "/": "Olympus",
  "/ascend": "The Offering",
  "/trials": "Trials of Athena",
  "/labyrinth": "The Labyrinth",
  "/oracle": "The Oracle",
  "/verdict": "The Verdict",
};

const NIGHT_ROUTES = new Set(["/oracle"]);

type Nav = { navigate: (href: string) => void };
const NavContext = createContext<Nav>({ navigate: () => {} });
export const useNav = () => useContext(NavContext);

/**
 * Chrome shared by every themed page: paper grain, the custom cursor and the curtain
 * transition between routes (cobalt panel rises, names the destination, then lifts).
 */
export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const [title, setTitle] = useState("");

  const navigate = useCallback(
    (href: string) => {
      const path = href.split(/[?#]/)[0];
      if (path === pathname) return;
      if (prefersReducedMotion() || !curtain.current) {
        router.push(href);
        return;
      }
      setTitle(ROUTE_TITLES[path] ?? "");
      pending.current = true;
      gsap
        .timeline()
        // y: 0 drops the pixel offset GSAP reads from the CSS translateY(100%); yPercent drives it.
        .set(curtain.current, { y: 0, yPercent: 100, pointerEvents: "auto" })
        .to(curtain.current, { yPercent: 0, duration: 0.75, ease: "expo.inOut" })
        .fromTo(".curtain-title", { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, "-=0.3")
        .add(() => router.push(href));
    },
    [pathname, router],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pending.current || !curtain.current) return;
    pending.current = false;
    gsap
      .timeline({ delay: 0.25 })
      .to(".curtain-title", { yPercent: -40, opacity: 0, duration: 0.4, ease: "power2.in" })
      .to(curtain.current, { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, "-=0.1")
      .set(curtain.current, { pointerEvents: "none" });
  }, [pathname]);

  const night = NIGHT_ROUTES.has(pathname);

  return (
    <NavContext.Provider value={{ navigate }}>
      <div className={`oly ${night ? "oly-night" : ""}`}>
        {children}
        <div className="oly-grain" aria-hidden="true" />
        <div ref={curtain} className="curtain" aria-hidden="true">
          <div className="curtain-key" style={{ top: 28 }}>
            <Meander height={16} />
          </div>
          <p className="curtain-title">{title}</p>
          <div className="curtain-key" style={{ bottom: 28 }}>
            <Meander height={16} />
          </div>
        </div>
        <Cursor />
      </div>
    </NavContext.Provider>
  );
}

/** A link that plays the curtain transition. Modifier-clicks open normally. */
export function TLink({ href, onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useNav();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}

/** Dot + lagging ring; grows over links and shows data-cursor labels. Fine pointers only. */
function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) {
      root.current?.classList.add("is-hidden");
      return;
    }
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.08 });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor], input, textarea, label");
      const text = el?.dataset.cursor ?? "";
      root.current?.classList.toggle("is-hover", !!el && !text);
      root.current?.classList.toggle("has-label", !!text);
      setLabel(text);
    };
    const leave = () => root.current?.classList.add("is-hidden");
    const enter = () => root.current?.classList.remove("is-hidden");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("pointerenter", enter);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.removeEventListener("pointerenter", enter);
    };
  }, []);

  return (
    <div ref={root} className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor-ring">
        <span>{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
