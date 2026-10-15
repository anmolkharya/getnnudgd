/**
 * Lightweight motion barrel — never imports gsap, lenis or lenis.css
 * (enforced by barrel.test.ts). Heavy entry points are imported directly:
 *
 *   import { gsap, ScrollTrigger, useGsap } from "@/components/motion/gsap";
 *   import { Odometer } from "@/components/motion/Odometer";          // uses gsap
 *   import { SmoothScroll } from "@/components/motion/SmoothScroll";  // page shell only (Lenis + CSS)
 */
export { Reveal, type RevealProps } from "./Reveal";
export { Stagger, useStaggerDelay, type StaggerProps } from "./Stagger";
export { Marquee, type MarqueeProps } from "./Marquee";
export { TypeLoop, useTypeLoop, type TypeLoopProps, type UseTypeLoopOptions } from "./TypeLoop";
export {
  useAutoplay,
  AutoplayProgress,
  type UseAutoplayOptions,
  type UseAutoplayResult,
  type AutoplayProgressProps,
} from "./useAutoplay";
export { useInView, type UseInViewOptions } from "./useInView";
export { usePrefersReducedMotion, useMediaQuery, useHydrated } from "./usePrefersReducedMotion";
export {
  useLenis,
  useSmoothScrollTo,
  type ScrollTarget,
  type SmoothScrollTo,
  type SmoothScrollToOptions,
} from "./smoothScrollContext";
