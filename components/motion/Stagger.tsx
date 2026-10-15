"use client";

import { Children, createContext, isValidElement, useContext, type ElementType, type ReactNode } from "react";

/** Extra delay (seconds) contributed by an enclosing <Stagger>. */
const StaggerDelayContext = createContext(0);

export function useStaggerDelay(): number {
  return useContext(StaggerDelayContext);
}

export interface StaggerProps {
  children: ReactNode;
  /** Seconds added per direct child (child i gets `delay + i * step`). Default `0.08`. */
  step?: number;
  /** Base delay in seconds for the first child. Default `0`. */
  delay?: number;
  /** Wrapper element. Default `"div"`. */
  as?: ElementType;
  className?: string;
}

/**
 * Gives each direct child an incremental delay that every <Reveal> inside that
 * child adds to its own `delay`. Renders a wrapper element (style it as a grid
 * or flex row via `className`).
 */
export function Stagger({ children, step = 0.08, delay = 0, as: Tag = "div", className }: StaggerProps) {
  const parent = useContext(StaggerDelayContext);
  // toArray drops null/boolean children and keys the rest.
  const items = Children.toArray(children).map((child, i) => (
    <StaggerDelayContext.Provider key={isValidElement(child) && child.key !== null ? child.key : i} value={parent + delay + i * step}>
      {child}
    </StaggerDelayContext.Provider>
  ));
  return <Tag className={className}>{items}</Tag>;
}
