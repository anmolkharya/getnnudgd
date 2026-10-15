"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, registerGsap } from "./gsap";
import { useMediaQuery, usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type ScrollTarget = string | HTMLElement | number;

export interface SmoothScrollToOptions {
  /** Pixels to offset the destination by (e.g. negative sticky-header height). Default `0`. */
  offset?: number;
  /** Jump without animating. */
  immediate?: boolean;
}

export type SmoothScrollTo = (target: ScrollTarget, options?: SmoothScrollToOptions) => void;

interface SmoothScrollContextValue {
  /** `null` when smooth scrolling is disabled (reduced motion, touch, SSR). */
  lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({ lenis: null });

export interface SmoothScrollProps {
  children: ReactNode;
  /** Lenis interpolation (0–1, lower = smoother). Default `0.1`. */
  lerp?: number;
}

/**
 * Wraps a page in Lenis smooth scrolling driven by the GSAP ticker, keeping
 * ScrollTrigger in sync. Disabled (native scroll) under prefers-reduced-motion
 * and on coarse pointers / touch. In-page `<a href="#id">` links are routed
 * through Lenis automatically; use `useSmoothScrollTo()` for programmatic
 * scrolling. Mount once, high in the landing page tree.
 */
export function SmoothScroll({ children, lerp = 0.1 }: SmoothScrollProps) {
  const reduced = usePrefersReducedMotion();
  const coarse = useMediaQuery("(pointer: coarse)");
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const enabled = !reduced && !coarse;

  useEffect(() => {
    if (!enabled) return;
    registerGsap();
    const instance = new Lenis({ lerp, anchors: true, autoRaf: false });
    const onScroll = () => ScrollTrigger.update();
    instance.on("scroll", onScroll);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Publishing the instance to context is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }, [enabled, lerp]);

  const value = useMemo(() => ({ lenis }), [lenis]);
  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}

/** The active Lenis instance, or `null` when native scrolling is in use. */
export function useLenis(): Lenis | null {
  return useContext(SmoothScrollContext).lenis;
}

/**
 * Returns `scrollTo(target, { offset, immediate })`. Uses Lenis when active,
 * otherwise native scrolling (instant under prefers-reduced-motion). Target is
 * a selector (`"#how-it-works"`), an element, or a Y offset in px. Works
 * outside <SmoothScroll> too.
 */
export function useSmoothScrollTo(): SmoothScrollTo {
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();
  return useCallback<SmoothScrollTo>(
    (target, { offset = 0, immediate = false } = {}) => {
      if (lenis) {
        lenis.scrollTo(target, { offset, immediate });
        return;
      }
      if (typeof window === "undefined") return;
      const el = typeof target === "string" ? document.querySelector(target) : target;
      const top =
        typeof el === "number"
          ? el
          : el instanceof HTMLElement
            ? el.getBoundingClientRect().top + window.scrollY
            : null;
      if (top === null) return;
      window.scrollTo({ top: top + offset, behavior: immediate || reduced ? "auto" : "smooth" });
    },
    [lenis, reduced],
  );
}
