"use client";

import { useCallback, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// One MediaQueryList per query, invalidated if window.matchMedia is replaced
// (tests stub it).
let cacheOwner: typeof window.matchMedia | null = null;
const cache = new Map<string, MediaQueryList>();

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  if (cacheOwner !== window.matchMedia) {
    cacheOwner = window.matchMedia;
    cache.clear();
  }
  let mql = cache.get(query);
  if (!mql) {
    mql = window.matchMedia(query);
    cache.set(query, mql);
  }
  return mql;
}

/** Subscribe to any media query. Server snapshot is `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = getMediaQueryList(query);
      if (!mql) return () => undefined;
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => getMediaQueryList(query)?.matches ?? false, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerFalse);
}

function getServerFalse(): boolean {
  return false;
}

/**
 * `true` when the user asked the OS to reduce motion. SSR-safe: `false` on the
 * server and during hydration, then the real value.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}

function noopSubscribe(): () => void {
  return () => undefined;
}
function getClientTrue(): boolean {
  return true;
}

/** `false` on the server and during hydration, `true` once running on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, getClientTrue, getServerFalse);
}
