"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(query);
}

/** Subscribe to any media query. Server snapshot is `false`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = getMediaQueryList(query);
      if (!mql) return () => undefined;
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => getMediaQueryList(query)?.matches ?? false,
    () => false,
  );
}

/**
 * `true` when the user asked the OS to reduce motion. SSR-safe: returns `false`
 * on the server and during hydration, then the real value.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(QUERY);
}

const noopSubscribe = () => () => undefined;

/** `false` on the server and during hydration, `true` once running on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
