"use client";

/**
 * Heavy half of smooth scrolling: ships Lenis + its CSS. Import this file
 * directly, and only from the page shell:
 *   import { SmoothScroll } from "@/components/motion/SmoothScroll";
 * Sections use `useSmoothScrollTo` / `useLenis` from "@/components/motion".
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, registerGsap } from "./gsap";
import { SmoothScrollContext } from "./smoothScrollContext";
import { useMediaQuery, usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface SmoothScrollProps {
  children: ReactNode;
  /** Lenis interpolation (0–1, lower = smoother). Default `0.1`. */
  lerp?: number;
  /**
   * Offset in px applied when Lenis handles in-page `<a href="#id">` clicks.
   * Default `-80` (60px sticky nav + breathing room).
   */
  anchorOffset?: number;
}

/**
 * Lenis smooth scrolling driven by the GSAP ticker, keeping ScrollTrigger in
 * sync. Off (native scroll) under prefers-reduced-motion and on coarse
 * pointers. Destroyed on unmount. Mount once, high in the landing page tree.
 */
export function SmoothScroll({ children, lerp = 0.1, anchorOffset = -80 }: SmoothScrollProps) {
  const reduced = usePrefersReducedMotion();
  const coarse = useMediaQuery("(pointer: coarse)");
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const enabled = !reduced && !coarse;

  useEffect(() => {
    if (!enabled) return;
    registerGsap();
    const instance = new Lenis({ lerp, anchors: { offset: anchorOffset }, autoRaf: false });
    instance.on("scroll", () => ScrollTrigger.update());
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Publishing the external instance to context is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }, [enabled, lerp, anchorOffset]);

  const value = useMemo(() => ({ lenis }), [lenis]);
  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}
