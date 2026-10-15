"use client";

import { useMemo, useRef } from "react";
import { gsap, useGsap } from "./gsap";
import { useInView } from "./useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./motion.module.css";

export type OdometerFormat = Intl.NumberFormat | ((value: number) => string);

export interface OdometerProps {
  /** Final value. */
  value: number;
  /** Value the roll starts from. Default `0`. */
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
 * the matching digit of `from` (left-padded with zeros to the same digit count).
 */
function toGlyphs(finalText: string, fromValue: number): Glyph[] {
  const finalDigitCount = finalText.replace(/\D/g, "").length;
  const fromDigits = String(Math.max(0, Math.floor(Math.abs(fromValue))))
    .padStart(finalDigitCount, "0")
    .slice(-finalDigitCount);
  let d = 0;
  return [...finalText].map((char) => {
    if (/\d/.test(char)) {
      const glyph: Glyph = { kind: "digit", final: Number(char), start: Number(fromDigits[d]) };
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
  const finalText = applyFormat(format, value);
  const glyphs = useMemo(() => toGlyphs(finalText, from), [finalText, from]);

  // Before the counter is seen, park each column at its start digit.
  useGsap(
    rootRef,
    () => {
      if (reduced || inView) return;
      gsap.utils.toArray<HTMLElement>("[data-odometer-column]").forEach((col) => {
        gsap.set(col, { y: 0, yPercent: -Number(col.dataset.start) * 5 });
      });
    },
    [reduced, inView, finalText, from],
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
    [reduced, inView, finalText, from, duration],
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
