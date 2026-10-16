"use client";

import { useEffect, useId, useRef } from "react";
import { useInView, usePrefersReducedMotion } from "@/components/motion";
import { brand } from "@/src/config/brand";
import styles from "./Bento.module.css";

/** Six right-angled traces radiating from behind the chip (viewBox 400×320, chip centred at 200,160). */
const TRACES = [
  { d: "M160 80 V28 H64 V-24", rest: [64, 28] },
  { d: "M240 80 V44 H332 V-24", rest: [332, 44] },
  { d: "M120 140 H52 V184 H-24", rest: [52, 184] },
  { d: "M280 132 H348 V92 H424", rest: [348, 92] },
  { d: "M172 240 V286 H88 V344", rest: [88, 286] },
  { d: "M228 240 V276 H316 V344", rest: [316, 276] },
] as const;

const DURATION_S = 3.2;
const STAGGER_S = 0.55;

/**
 * Decorative 3D chip with circuit traces; glowing dots travel along the
 * traces (SVG animateMotion). Static dots under reduced motion; the SVG
 * timeline is paused whenever the visual is off-screen.
 */
export function ChipCircuit() {
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduced = usePrefersReducedMotion();
  const inView = useInView(svgRef);
  const animated = !reduced;
  const running = animated && inView;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof svg.pauseAnimations !== "function") return;
    if (running) svg.unpauseAnimations();
    else svg.pauseAnimations();
  }, [running]);

  return (
    <div className="relative mt-6 flex h-72 items-center justify-center overflow-hidden">
      <svg
        ref={svgRef}
        data-circuit=""
        data-running={String(running)}
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full"
        viewBox="0 0 400 320"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {TRACES.map((trace, i) => (
          <path
            key={i}
            id={`${uid}-trace-${i}`}
            d={trace.d}
            className="stroke-white/15"
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
        ))}
        {TRACES.map((trace, i) =>
          animated ? (
            <circle key={i} r={3} className={`fill-white ${styles.dot}`}>
              <animateMotion
                dur={`${DURATION_S}s`}
                begin={`-${(i * STAGGER_S).toFixed(2)}s`}
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href={`#${uid}-trace-${i}`} />
              </animateMotion>
            </circle>
          ) : (
            <circle key={i} r={3} cx={trace.rest[0]} cy={trace.rest[1]} className={`fill-white ${styles.dot}`} />
          ),
        )}
      </svg>

      <div className={`relative grid size-36 place-items-center rounded-3xl md:size-44 ${styles.chip}`}>
        <div className={`grid size-24 place-items-center rounded-2xl md:size-28 ${styles.chipFace}`}>
          <svg role="img" aria-label={brand.name} viewBox="0 0 48 48" className="size-12 md:size-14" fill="none">
            <circle cx="24" cy="24" r="17" className="stroke-white/80" strokeWidth={2.5} />
            <path
              d="M17 29 L29 17 M20 17 H29 V26"
              className="stroke-white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
