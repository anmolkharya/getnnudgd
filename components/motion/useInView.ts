"use client";

import { useEffect, useState, type RefObject } from "react";
import { useHydrated } from "./usePrefersReducedMotion";

export interface UseInViewOptions {
  /** Stop observing after the first time the element enters the viewport. Default `false`. */
  once?: boolean;
  /** Fraction (0–1) of the element that must be visible. Default `0`. */
  amount?: number;
  /** IntersectionObserver rootMargin, e.g. `"0px 0px -10% 0px"`. Default `"0px"`. */
  rootMargin?: string;
}

/**
 * `true` while `ref.current` intersects the viewport. SSR-safe (`false` on the
 * server). When IntersectionObserver is unavailable it reports `true` so content
 * is never stuck hidden.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = false, amount = 0, rootMargin = "0px" }: UseInViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);
  const hydrated = useHydrated();
  const supported = hydrated && typeof IntersectionObserver !== "undefined";

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: amount, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, amount, rootMargin]);

  if (hydrated && !supported) return true;
  return inView;
}
