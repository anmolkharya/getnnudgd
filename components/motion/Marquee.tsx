"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useInView } from "./useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./motion.module.css";

export interface MarqueeProps {
  children: ReactNode;
  /** Scroll speed in px per second. Default `40`. */
  speed?: number;
  /** `"normal"` = leftwards (x) / upwards (y); `"reverse"` = the opposite. Default `"normal"`. */
  direction?: "normal" | "reverse";
  /** Pause while the pointer is over the strip. Default `true`. (Always pauses on focus-within.) */
  pauseOnHover?: boolean;
  /** Horizontal strip or vertical feed. Default `"x"`. */
  axis?: "x" | "y";
  /** Space between items in px (also used at the seam). Default `32`. */
  gap?: number;
  /** Classes for the outer clipping element (set height for `axis="y"`). */
  className?: string;
  /** Classes for each item group (e.g. alignment). */
  groupClassName?: string;
  /** Accessible name for the strip, rendered as `aria-label` on a `role="region"`. */
  label?: string;
}

/**
 * Infinite CSS-keyframe loop. Children are rendered twice; the second copy is
 * `aria-hidden` and `inert`. The track animates -50% for a seamless loop.
 * Runs only while on-screen; never runs under prefers-reduced-motion (the
 * duplicate is dropped and horizontal strips become scrollable).
 */
export function Marquee({
  children,
  speed = 40,
  direction = "normal",
  pauseOnHover = true,
  axis = "x",
  gap = 32,
  className,
  groupClassName,
  label,
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [extent, setExtent] = useState(0);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.target.getBoundingClientRect();
      setExtent(axis === "x" ? box.width : box.height);
    });
    ro.observe(group);
    return () => ro.disconnect();
  }, [axis]);

  const durationSeconds = extent > 0 && speed > 0 ? extent / speed : 30;
  const style = {
    "--marquee-duration": `${durationSeconds.toFixed(2)}s`,
    "--marquee-gap": `${gap}px`,
  } as CSSProperties;

  const rootClass = [styles.marquee, axis === "x" ? styles.marqueeX : styles.marqueeY, className]
    .filter(Boolean)
    .join(" ");
  const groupClass = groupClassName ? `${styles.marqueeGroup} ${groupClassName}` : styles.marqueeGroup;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      style={style}
      data-marquee=""
      data-running={String(inView && !reduced)}
      data-reduced={String(reduced)}
      data-direction={direction}
      data-pause-on-hover={String(pauseOnHover)}
      role={label ? "region" : undefined}
      aria-label={label}
    >
      <div className={styles.marqueeTrack}>
        <div ref={groupRef} className={groupClass} data-marquee-group="">
          {children}
        </div>
        {reduced ? null : (
          <div className={groupClass} data-marquee-group="" aria-hidden="true" inert>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
