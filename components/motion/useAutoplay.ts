"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { useInView } from "./useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface UseAutoplayOptions {
  /** Number of slides. Indexes wrap within `0..count-1`. */
  count: number;
  /** Milliseconds per slide. Default `5000`. */
  interval?: number;
  /** Externally pause auto-advance (e.g. a play/pause toggle). Default `false`. */
  paused?: boolean;
  /** Optional element; auto-advance pauses while it is off-screen. */
  ref?: RefObject<Element | null>;
}

export interface UseAutoplayResult {
  /** Current slide index. */
  index: number;
  /** Progress of the current slide, 0–1 (drives progress bars). */
  progress: number;
  /** `true` while the timer is actually running. */
  isPlaying: boolean;
  next: () => void;
  prev: () => void;
  /** Jump to any index; wraps (e.g. `-1` → last). Resets progress. */
  goTo: (index: number) => void;
  /** Manual pause/resume (e.g. focus within, user toggle). */
  pause: () => void;
  resume: () => void;
  /** Wire to `onPointerEnter`/`onPointerLeave` to pause while hovered. */
  setHovered: (hovered: boolean) => void;
}

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function useDocumentVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => !document.hidden,
    () => true,
  );
}

const noRef: RefObject<Element | null> = { current: null };

/**
 * Carousel timer: rAF-driven progress, auto-advance every `interval` ms.
 * Pauses when the tab is hidden, the element is off-screen, `paused` is set,
 * the user hovers or calls `pause()`, and never auto-advances under
 * prefers-reduced-motion (manual next/prev/goTo still work).
 */
export function useAutoplay({
  count,
  interval = 5000,
  paused = false,
  ref,
}: UseAutoplayOptions): UseAutoplayResult {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const elapsed = useRef(0);

  const reduced = usePrefersReducedMotion();
  const docVisible = useDocumentVisible();
  const observed = useInView(ref ?? noRef);
  const onScreen = ref ? observed : true;

  const isPlaying =
    count > 1 && !paused && !hovered && !manualPause && !reduced && docVisible && onScreen;

  const wrap = useCallback((i: number) => (count > 0 ? ((i % count) + count) % count : 0), [count]);

  const goTo = useCallback(
    (i: number) => {
      elapsed.current = 0;
      setProgress(0);
      setIndex(wrap(i));
    },
    [wrap],
  );
  const next = useCallback(() => {
    elapsed.current = 0;
    setProgress(0);
    setIndex((i) => wrap(i + 1));
  }, [wrap]);
  const prev = useCallback(() => {
    elapsed.current = 0;
    setProgress(0);
    setIndex((i) => wrap(i - 1));
  }, [wrap]);
  const pause = useCallback(() => setManualPause(true), []);
  const resume = useCallback(() => setManualPause(false), []);

  useEffect(() => {
    if (!isPlaying || typeof requestAnimationFrame === "undefined") return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last !== null) elapsed.current += Math.max(0, now - last);
      last = now;
      if (elapsed.current >= interval) {
        elapsed.current = 0;
        setProgress(0);
        setIndex((i) => wrap(i + 1));
      } else {
        setProgress(elapsed.current / interval);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, interval, wrap]);

  return { index: wrap(index), progress, isPlaying, next, prev, goTo, pause, resume, setHovered };
}
