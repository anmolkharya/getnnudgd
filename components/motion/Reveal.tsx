"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { useStaggerDelay } from "./Stagger";
import { useInView } from "./useInView";
import { useHydrated, usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./motion.module.css";

/** Must match the `reveal-failsafe` animation delay in motion.module.css. */
const FAILSAFE_MS = 2500;

export interface RevealProps {
  children: ReactNode;
  /** Upward travel in px. Default `24`. */
  y?: number;
  /** Start blur in px (0 = fade only). Default `0`. */
  blur?: number;
  /** Delay in seconds (added to any <Stagger> delay). Default `0`. */
  delay?: number;
  /** Transition duration in seconds. Default `0.7`. */
  duration?: number;
  /** Fraction of the element visible before it reveals. Default `0.15`. */
  amount?: number;
  /**
   * Never hide the content (renders `data-reveal="shown"` from the server on).
   * Use for anything above the fold.
   */
  eager?: boolean;
  /** Element to render. Default `"div"`. */
  as?: ElementType;
  className?: string;
  id?: string;
}

type RevealState = "ssr" | "armed" | "shown";

/**
 * Fades (and optionally un-blurs) its content up into place once, the first
 * time it scrolls into view.
 *
 * NEVER wrap the LCP element (hero headline / hero image) in a hiding Reveal:
 * it delays Largest Contentful Paint until hydration. Use `eager` above the
 * fold, or no Reveal at all.
 *
 * Crawler / no-JS safety: the server HTML carries `data-reveal="ssr"`, which is
 * hidden only under `@media (scripting: enabled)` and auto-shows after 2.5s
 * (`reveal-failsafe`) if hydration never happens. `@media (scripting)` is
 * supported in Chrome/Edge 120+, Safari 17+, Firefox 113+; older browsers
 * ignore the block and simply show the content (no animation). If hydration
 * lands after the failsafe already showed the content, it stays shown (no
 * re-hide flicker). Under prefers-reduced-motion the final state renders with
 * no transition.
 */
export function Reveal({
  children,
  y = 24,
  blur = 0,
  delay = 0,
  duration = 0.7,
  amount = 0.15,
  eager = false,
  as: Tag = "div",
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, amount });
  const staggerDelay = useStaggerDelay();
  const [failsafeFired, setFailsafeFired] = useState(false);

  // Runs after the hydration commit, while the DOM still says "ssr": if the
  // CSS failsafe has already revealed the content, keep it revealed.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.reveal !== "ssr") return;
    const now = document.timeline?.currentTime;
    const elapsed = typeof now === "number" ? now : 0;
    const finished =
      typeof el.getAnimations === "function" &&
      el.getAnimations().some((a) => a.playState === "finished");
    if (elapsed >= FAILSAFE_MS || finished) {
      // One-off sync with what the browser already painted.
      setFailsafeFired(true);
    }
  }, []);

  const state: RevealState = eager
    ? "shown"
    : !hydrated
      ? "ssr"
      : reduced || inView || failsafeFired
        ? "shown"
        : "armed";
  const totalDelayMs = Math.round((delay + staggerDelay) * 1000);

  const style = {
    "--reveal-y": `${y}px`,
    "--reveal-blur": `${blur}px`,
    transitionDuration: `${Math.round(duration * 1000)}ms`,
    transitionDelay: `${totalDelayMs}ms`,
  } as CSSProperties;

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={state}
      className={className ? `${styles.reveal} ${className}` : styles.reveal}
      style={style}
    >
      {children}
    </Tag>
  );
}
