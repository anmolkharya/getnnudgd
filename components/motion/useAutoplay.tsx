"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from "react";
import { useInView } from "./useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./motion.module.css";

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
  /** Current slide index (always within range, also after `count` shrinks). */
  index: number;
  /** `true` while the slide timer is actually running. */
  isPlaying: boolean;
  /** The interval in ms (feed it to <AutoplayProgress>). */
  interval: number;
  /** Increments on every slide change, manual or automatic (restart key for progress fills). */
  cycle: number;
  next: () => void;
  prev: () => void;
  /** Jump to any index; wraps (`-1` → last). Restarts the slide timer. */
  goTo: (index: number) => void;
  /** User pause/resume (e.g. a WCAG 2.2.2 pause button). */
  pause: () => void;
  resume: () => void;
  /** Wire to `onPointerEnter`/`onPointerLeave`. */
  setHovered: (hovered: boolean) => void;
  /** Wire to `onFocus`/`onBlur` (focus within). Independent of `pause()`. */
  setFocused: (focused: boolean) => void;
}

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}
function getDocumentVisible(): boolean {
  return !document.hidden;
}
function getServerVisible(): boolean {
  return true;
}

const noRef: RefObject<Element | null> = { current: null };

/**
 * Carousel timer. One `setTimeout(remaining)` per slide, with elapsed time
 * carried across pauses — no per-frame React renders. Visual progress is
 * CSS-driven via <AutoplayProgress>.
 *
 * Pauses when the tab is hidden, `ref` is off-screen, `paused` is set, the
 * pointer hovers, focus is inside, or `pause()` was called. Never
 * auto-advances under prefers-reduced-motion or with fewer than 2 slides
 * (manual next/prev/goTo still work).
 */
export function useAutoplay({ count, interval = 5000, paused = false, ref }: UseAutoplayOptions): UseAutoplayResult {
  const [slide, setSlide] = useState({ index: 0, cycle: 0 });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  // Elapsed ms banked for the slide identified by `cycle`.
  const banked = useRef({ cycle: 0, ms: 0 });

  const reduced = usePrefersReducedMotion();
  const docVisible = useSyncExternalStore(subscribeVisibility, getDocumentVisible, getServerVisible);
  const observed = useInView(ref ?? noRef);
  const onScreen = ref ? observed : true;

  const isPlaying =
    count > 1 && !paused && !hovered && !focused && !userPaused && !reduced && docVisible && onScreen;

  const wrap = useCallback((i: number) => (count > 0 ? ((i % count) + count) % count : 0), [count]);

  const goTo = useCallback(
    (i: number) => setSlide((s) => ({ index: wrap(i), cycle: s.cycle + 1 })),
    [wrap],
  );
  const next = useCallback(() => setSlide((s) => ({ index: wrap(s.index + 1), cycle: s.cycle + 1 })), [wrap]);
  const prev = useCallback(() => setSlide((s) => ({ index: wrap(s.index - 1), cycle: s.cycle + 1 })), [wrap]);
  const pause = useCallback(() => setUserPaused(true), []);
  const resume = useCallback(() => setUserPaused(false), []);

  const { cycle } = slide;
  useEffect(() => {
    if (!isPlaying) return;
    const already = banked.current.cycle === cycle ? banked.current.ms : 0;
    const startedAt = Date.now();
    let fired = false;
    const id = setTimeout(
      () => {
        fired = true;
        setSlide((s) => ({ index: wrap(s.index + 1), cycle: s.cycle + 1 }));
      },
      Math.max(0, interval - already),
    );
    return () => {
      clearTimeout(id);
      // Paused mid-slide: bank the time so resume only waits the remainder.
      if (!fired) banked.current = { cycle, ms: already + (Date.now() - startedAt) };
    };
  }, [isPlaying, cycle, interval, wrap]);

  return {
    index: wrap(slide.index),
    isPlaying,
    interval,
    cycle,
    next,
    prev,
    goTo,
    pause,
    resume,
    setHovered,
    setFocused,
  };
}

export interface AutoplayProgressProps {
  /** This bar's slide index. */
  index: number;
  /** The carousel's current index (`useAutoplay().index`). */
  current: number;
  /** Slide duration in ms (`useAutoplay().interval`). */
  interval: number;
  /** `useAutoplay().isPlaying` — pauses the fill via animation-play-state. */
  isPlaying: boolean;
  /** `useAutoplay().cycle` — restarts the fill on every slide change. */
  cycle?: number;
  /** Classes for the track (e.g. `h-1 rounded-full bg-neutral-300 overflow-hidden`). */
  className?: string;
  /** Classes for the fill (e.g. `bg-neutral-900`). */
  fillClassName?: string;
}

/**
 * One progress bar of a carousel. Past slides are full, future slides empty,
 * the current one fills over `interval` ms with a CSS keyframe (no React
 * renders per frame). Under reduced motion the current bar is shown full.
 * Decorative: render inside your labelled slide buttons.
 */
export function AutoplayProgress({
  index,
  current,
  interval,
  isPlaying,
  cycle = 0,
  className,
  fillClassName,
}: AutoplayProgressProps) {
  const state = index < current ? "done" : index === current ? "active" : "pending";
  const style: CSSProperties | undefined =
    state === "active"
      ? { animationDuration: `${interval}ms`, animationPlayState: isPlaying ? "running" : "paused" }
      : undefined;
  return (
    <span className={className ? `${styles.autoplayTrack} ${className}` : styles.autoplayTrack} aria-hidden="true">
      <span
        key={state === "active" ? `active-${cycle}` : state}
        data-autoplay-fill=""
        data-state={state}
        className={fillClassName ? `${styles.autoplayFill} ${fillClassName}` : styles.autoplayFill}
        style={style}
      />
    </span>
  );
}
