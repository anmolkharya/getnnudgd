"use client";

import { useMemo, useRef, useState } from "react";
import { gsap, useGsap } from "./gsap";
import { useInView } from "./useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./motion.module.css";

export type OdometerFormat = Intl.NumberFormat | ((value: number) => string);

export interface OdometerProps {
  /** Final value. */
  value: number;
  /** Value the first roll starts from. Default `0`. Later `value` changes roll from the previous value. */
  from?: number;
  /** Roll duration in seconds. Default `1.6`. */
  duration?: number;
  /** Formatter. Default `new Intl.NumberFormat("en-IN")` (12,34,567). */
  format?: OdometerFormat;
  className?: string;
}

const defaultFormat = new Intl.NumberFormat("en-IN");
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function applyFormat(format: OdometerFormat, value: number): string {
  return typeof format === "function" ? format(value) : format.format(value);
}

type Glyph = { kind: "digit"; final: number; start: number } | { kind: "char"; char: string };

/**
 * Builds glyphs from the formatted final value. Each digit column rolls from
 * the matching digit of the formatted start value; digits are right-aligned
 * (so "5.6" → "123.4" pairs 6↔4, 5↔3) and missing leading digits start at 0.
 */
function toGlyphs(finalText: string, startText: string): Glyph[] {
  const finalDigitCount = finalText.replace(/\D/g, "").length;
  const startDigits = startText.replace(/\D/g, "").padStart(finalDigitCount, "0").slice(-finalDigitCount);
  let d = 0;
  return [...finalText].map((char) => {
    if (/\d/.test(char)) {
      const glyph: Glyph = { kind: "digit", final: Number(char), start: Number(startDigits[d]) };
      d += 1;
      return glyph;
    }
    return { kind: "char", char };
  });
}

/**
 * Number counter with per-digit vertical roll (GSAP), triggered once in view.
 * Server render and reduced motion show the final value. Screen readers get
 * only the final formatted text; the rolling digits are `aria-hidden`.
 * Digits use tabular-nums and fixed 1em rows so nothing shifts.
 */
export function Odometer({ value, from = 0, duration = 1.6, format = defaultFormat, className }: OdometerProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef, { once: true, amount: 0.5 });
  // When `value` changes after the counter has been seen, roll from the
  // previous value instead of `from` (state-from-previous-render pattern).
  const [roll, setRoll] = useState<{ value: number; start: number | null }>({ value, start: null });
  if (roll.value !== value) setRoll({ value, start: inView ? roll.value : null });
  const startValue = roll.value === value && roll.start !== null ? roll.start : from;

  const finalText = applyFormat(format, value);
  const startText = applyFormat(format, startValue);
  const glyphs = useMemo(() => toGlyphs(finalText, startText), [finalText, startText]);

  // Before the counter is seen, park each column at its start digit.
  useGsap(
    rootRef,
    () => {
      if (reduced || inView) return;
      gsap.utils.toArray<HTMLElement>("[data-odometer-column]").forEach((col) => {
        gsap.set(col, { y: 0, yPercent: -Number(col.dataset.start) * 5 });
      });
    },
    [reduced, inView, finalText, startText],
  );

  // Roll to the final digits once in view.
  useGsap(
    rootRef,
    () => {
      if (reduced || !inView) return;
      const cols = gsap.utils.toArray<HTMLElement>("[data-odometer-column]");
      cols.forEach((col, i) => {
        gsap.fromTo(
          col,
          { y: 0, yPercent: -Number(col.dataset.start) * 5 },
          {
            y: 0,
            yPercent: -(Number(col.dataset.final) + 10) * 5,
            duration,
            delay: (cols.length - 1 - i) * 0.06,
            ease: "power3.out",
          },
        );
      });
    },
    [reduced, inView, finalText, startText, duration],
  );

  return (
    <span ref={rootRef} className={className}>
      <span className="sr-only">{finalText}</span>
      <span className={styles.odometerDigits} aria-hidden="true" data-odometer-digits="">
        {glyphs.map((glyph, i) =>
          glyph.kind === "char" ? (
            <span key={i}>{glyph.char}</span>
          ) : (
            <span key={i} className={styles.odometerWindow}>
              <span
                className={styles.odometerColumn}
                data-odometer-column=""
                data-start={glyph.start}
                data-final={glyph.final}
                style={{ transform: `translateY(-${glyph.final + 10}em)` }}
              >
                {DIGITS.map((n, j) => (
                  <span key={j}>{n}</span>
                ))}
              </span>
            </span>
          ),
        )}
      </span>
    </span>
  );
}
