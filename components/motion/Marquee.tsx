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
  /** Stop the loop (wire to a WCAG 2.2.2 pause button). Default `false`. */
  paused?: boolean;
  /** Horizontal strip or vertical feed. Default `"x"`. */
  axis?: "x" | "y";
  /** Space between items in px (also used at the seam). Default `32`. */
  gap?: number;
  /** Classes for the outer clipping element (give it a height for `axis="y"`). */
  className?: string;
  /** Classes for each item group (e.g. alignment). */
  groupClassName?: string;
  /** Accessible name; the root becomes `role="group"` with this `aria-label`. */
  label?: string;
}

/**
 * Infinite CSS-keyframe loop. Renders as many copies of `children` as needed
 * to cover the viewport plus one (at least 2); every copy after the first is
 * `aria-hidden` + `inert`. The track moves by exactly one group's measured
 * extent (`--marquee-distance`), so the seam is invisible at any width.
 * Runs only while on-screen and not `paused`; pauses on hover/focus. Under
 * prefers-reduced-motion: no animation, one copy, x strips become a
 * keyboard-focusable horizontal scroller.
 */
export function Marquee({
  children,
  speed = 40,
  direction = "normal",
  pauseOnHover = true,
  paused = false,
  axis = "x",
  gap = 32,
  className,
  groupClassName,
  label,
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ root: 0, group: 0 });
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);

  useEffect(() => {
    const root = rootRef.current;
    const group = groupRef.current;
    if (!root || !group || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const r = root.getBoundingClientRect();
      const g = group.getBoundingClientRect();
      const next = axis === "x" ? { root: r.width, group: g.width } : { root: r.height, group: g.height };
      setSize((prev) => (prev.root === next.root && prev.group === next.group ? prev : next));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(group);
    return () => ro.disconnect();
  }, [axis]);

  const copies = reduced ? 1 : size.group > 0 ? Math.max(2, Math.ceil(size.root / size.group) + 1) : 2;
  const durationSeconds = size.group > 0 && speed > 0 ? size.group / speed : 30;

  const style = {
    "--marquee-duration": `${durationSeconds.toFixed(2)}s`,
    "--marquee-distance": size.group > 0 ? `-${size.group}px` : "-50%",
    "--marquee-gap": `${gap}px`,
  } as CSSProperties;

  const rootClass = [styles.marquee, axis === "x" ? styles.marqueeX : styles.marqueeY, className]
    .filter(Boolean)
    .join(" ");
  const groupClass = groupClassName ? `${styles.marqueeGroup} ${groupClassName}` : styles.marqueeGroup;
  const scrollable = reduced && axis === "x";

  return (
    <div
      ref={rootRef}
      className={rootClass}
      style={style}
      data-marquee=""
      data-running={String(inView && !reduced && !paused)}
      data-reduced={String(reduced)}
      data-direction={direction}
      data-pause-on-hover={String(pauseOnHover)}
      role={label ? "group" : undefined}
      aria-label={label}
      tabIndex={scrollable ? 0 : undefined}
    >
      <div className={styles.marqueeTrack}>
        {Array.from({ length: copies }, (_, i) =>
          i === 0 ? (
            <div key={i} ref={groupRef} className={groupClass} data-marquee-group="">
              {children}
            </div>
          ) : (
            <div key={i} className={groupClass} data-marquee-group="" aria-hidden="true" inert>
              {children}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
