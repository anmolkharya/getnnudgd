"use client";

import { Children, createContext, isValidElement, useContext, type ElementType, type ReactNode } from "react";

/** Extra delay (seconds) contributed by enclosing <Stagger>s. */
const StaggerDelayContext = createContext(0);

/** Total delay (s) contributed by all enclosing <Stagger>s. */
export function useStaggerDelay(): number {
  return useContext(StaggerDelayContext);
}

export interface StaggerProps {
  children: ReactNode;
  /** Seconds added per direct child index. Default `0.08`. */
  step?: number;
  /** Base delay in seconds for the first child. Default `0`. */
  delay?: number;
  /** Wrapper element. Default `"div"`. */
  as?: ElementType;
  className?: string;
}

/**
 * Delays accumulate per DIRECT child index: child `i` gets
 * `parentStagger + delay + i * step` seconds, and every <Reveal> anywhere
 * inside that child adds this to its own `delay` (so a Reveal inside child 3
 * with `delay={0.1}` waits `0.1 + 3 * step`). Nested Staggers add up.
 * Null/boolean children are skipped and do not consume an index.
 * Renders a wrapper element (style it as a grid or flex row via `className`).
 */
export function Stagger({ children, step = 0.08, delay = 0, as: Tag = "div", className }: StaggerProps) {
  const parent = useContext(StaggerDelayContext);
  const items = Children.toArray(children).map((child, i) => (
    <StaggerDelayContext.Provider
      key={isValidElement(child) && child.key !== null ? child.key : i}
      value={parent + delay + i * step}
    >
      {child}
    </StaggerDelayContext.Provider>
  ));
  return <Tag className={className}>{items}</Tag>;
}
