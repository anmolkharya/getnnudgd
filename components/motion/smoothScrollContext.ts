"use client";

/**
 * Lightweight half of smooth scrolling: context + hooks only. Imports Lenis
 * as a TYPE, so importing this (or the motion barrel) never ships Lenis.
 * The Lenis instance is provided by <SmoothScroll> (components/motion/SmoothScroll).
 */
import { createContext, useCallback, useContext } from "react";
import type Lenis from "lenis";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type ScrollTarget = string | Element | number;

export interface SmoothScrollToOptions {
  /** Pixels added to the destination (e.g. negative sticky-header height). Default `0`. */
  offset?: number;
  /** Jump without animating. Default `false`. */
  immediate?: boolean;
}

export type SmoothScrollTo = (target: ScrollTarget, options?: SmoothScrollToOptions) => void;

export interface SmoothScrollContextValue {
  /** `null` when smooth scrolling is off (reduced motion, touch, SSR, no provider). */
  lenis: Lenis | null;
}

export const SmoothScrollContext = createContext<SmoothScrollContextValue>({ lenis: null });

/** The active Lenis instance, or `null` when native scrolling is in use. */
export function useLenis(): Lenis | null {
  return useContext(SmoothScrollContext).lenis;
}

/**
 * Returns `scrollTo(target, { offset, immediate })`. Uses Lenis when a
 * <SmoothScroll> is active, otherwise native `window.scrollTo` (instant under
 * prefers-reduced-motion). Target: selector (`"#faq"`), element, or Y in px.
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
        typeof el === "number" ? el : el instanceof Element ? el.getBoundingClientRect().top + window.scrollY : null;
      if (top === null) return;
      window.scrollTo({ top: top + offset, behavior: immediate || reduced ? "auto" : "smooth" });
    },
    [lenis, reduced],
  );
}
