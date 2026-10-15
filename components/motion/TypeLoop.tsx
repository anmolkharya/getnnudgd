"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "./useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./motion.module.css";

export interface UseTypeLoopOptions {
  /** Milliseconds per typed character. Default `60`. */
  speed?: number;
  /** Milliseconds per erased character. Default `speed / 2`. */
  eraseSpeed?: number;
  /** Milliseconds a fully typed phrase stays before erasing. Default `1800`. */
  pause?: number;
  /** When `false` the loop holds its current text. Default `true`. */
  active?: boolean;
}

type Phase = "holding" | "erasing" | "typing";
type TypeLoopState = { phrase: number; length: number; phase: Phase };

/**
 * Returns the current text of a type/erase loop over `phrases`. Starts with the
 * first phrase fully typed (matches server HTML). Under prefers-reduced-motion
 * it always returns `phrases[0]`. Useful for an input `placeholder`.
 */
export function useTypeLoop(
  phrases: readonly string[],
  { speed = 60, eraseSpeed, pause = 1800, active = true }: UseTypeLoopOptions = {},
): string {
  const reduced = usePrefersReducedMotion();
  const first = phrases[0] ?? "";
  const [state, setState] = useState<TypeLoopState>({
    phrase: 0,
    length: first.length,
    phase: "holding",
  });
  const running = active && !reduced && phrases.length > 0;
  const erase = eraseSpeed ?? speed / 2;

  // Depend on the phrase *content* so an inline array literal does not reset the timer.
  const phrasesKey = JSON.stringify(phrases);
  const phrasesRef = useRef(phrases);
  useEffect(() => {
    phrasesRef.current = phrases;
  });

  // The loop owns its position in a ref and schedules itself, so it keeps
  // ticking independently of React's render cadence; state only mirrors it.
  const stateRef = useRef(state);

  useEffect(() => {
    const list = phrasesRef.current;
    if (!running || list.length < 2) return;
    let id: ReturnType<typeof setTimeout>;

    const step = () => {
      const s = stateRef.current;
      const current = list[s.phrase % list.length] ?? "";
      let next: TypeLoopState;
      if (s.phase === "holding") {
        next = { ...s, phase: "erasing" };
      } else if (s.phase === "erasing") {
        next =
          s.length > 1
            ? { ...s, length: s.length - 1 }
            : { phrase: (s.phrase + 1) % list.length, length: 0, phase: "typing" };
      } else {
        const length = s.length + 1;
        next = length >= current.length ? { ...s, length, phase: "holding" } : { ...s, length };
      }
      stateRef.current = next;
      setState(next);
      schedule();
    };

    const schedule = () => {
      const phase = stateRef.current.phase;
      id = setTimeout(step, phase === "holding" ? pause : phase === "erasing" ? erase : speed);
    };

    schedule();
    return () => clearTimeout(id);
  }, [running, phrasesKey, speed, erase, pause]);

  if (reduced || phrases.length === 0) return first;
  const phrase = phrases[state.phrase % phrases.length] ?? "";
  return phrase.slice(0, state.length);
}

export interface TypeLoopProps {
  /** Phrases to cycle through. The first is the static / server-rendered text. */
  phrases: readonly string[];
  /** Milliseconds per typed character. Default `60`. */
  speed?: number;
  /** Milliseconds per erased character. Default `speed / 2`. */
  eraseSpeed?: number;
  /** Milliseconds a fully typed phrase stays. Default `1800`. */
  pause?: number;
  /** Static accessible text. Default: `phrases.join(", ")`. */
  label?: string;
  /** Show the blinking caret. Default `true`. */
  caret?: boolean;
  className?: string;
}

/**
 * Typing/erasing text loop. The animated text is `aria-hidden`; assistive tech
 * reads the static `label`. Pauses off-screen; static first phrase under
 * prefers-reduced-motion.
 */
export function TypeLoop({ phrases, speed, eraseSpeed, pause, label, caret = true, className }: TypeLoopProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const text = useTypeLoop(phrases, { speed, eraseSpeed, pause, active: inView });

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{label ?? phrases.join(", ")}</span>
      <span aria-hidden="true">
        <span data-typeloop-text="">{text}</span>
        {caret && !reduced ? <span className={styles.caret} /> : null}
      </span>
    </span>
  );
}
