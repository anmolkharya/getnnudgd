"use client";

/**
 * Single entry point for GSAP. Import `gsap`/`ScrollTrigger` from here (never
 * from "gsap" directly) so ScrollTrigger is registered exactly once, lazily,
 * and only in the browser. Client components only.
 */
import { useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/**
 * Registers ScrollTrigger (idempotent, browser-only). Called lazily by
 * `useGsap` and `<SmoothScroll>`; call it yourself before using ScrollTrigger
 * outside those.
 */
export function registerGsap(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export { gsap, ScrollTrigger };

/** Callback for `useGsap`; may return a cleanup that runs before the context reverts. */
export type GsapSetup = (context: gsap.Context) => void | (() => void);

/**
 * Run GSAP code inside `gsap.context()` scoped to `scopeRef` (selector text
 * like `".item"` only matches inside the scope). Runs in a layout effect so
 * initial states are set before paint; everything is reverted on unmount or
 * when `deps` change. SSR-safe: layout effects never run on the server.
 */
export function useGsap(
  scopeRef: RefObject<Element | null>,
  setup: GsapSetup,
  deps: DependencyList = [],
): void {
  const setupRef = useRef(setup);
  useLayoutEffect(() => {
    setupRef.current = setup;
  });

  useLayoutEffect(() => {
    registerGsap();
    const scope = scopeRef.current;
    if (!scope) return;
    let cleanup: void | (() => void);
    const ctx = gsap.context((self) => {
      cleanup = setupRef.current(self);
    }, scope);
    return () => {
      if (typeof cleanup === "function") cleanup();
      ctx.revert();
    };
    // Caller-supplied deps, like useEffect; the latest `setup` is read via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeRef, ...deps]);
}
