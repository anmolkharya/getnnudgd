"use client";

import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { useStaggerDelay } from "./Stagger";
import { useInView } from "./useInView";
import { useHydrated, usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./motion.module.css";

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
 * Crawler / no-JS safety: the server HTML carries `data-reveal="ssr"`, which is
 * only hidden under `@media (scripting: enabled)` and auto-shows after 2.5s if
 * hydration never happens. Under prefers-reduced-motion it renders the final
 * state with no transition.
 */
export function Reveal({
  children,
  y = 24,
  blur = 0,
  delay = 0,
  duration = 0.7,
  amount = 0.15,
  as: Tag = "div",
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, amount });
  const staggerDelay = useStaggerDelay();

  const state: RevealState = !hydrated ? "ssr" : reduced || inView ? "shown" : "armed";
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
