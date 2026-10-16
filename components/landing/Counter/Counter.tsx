"use client";

import { useId } from "react";
import { Reveal } from "@/components/motion";
import { Odometer } from "@/components/motion/Odometer";
import { counter } from "@/src/config/landing";

const format = new Intl.NumberFormat("en-IN");

export function LandingCounter() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      data-placeholder={counter.placeholder ? "true" : undefined}
      className="bg-white"
    >
      <div className="lv-container py-24 md:py-32">
        <Reveal>
          <h2 id={headingId} className="text-h3-lg font-heading text-ink-1 max-w-measure">{counter.statement}</h2>
        </Reveal>
        <div className="mt-8 border-t border-ink-6/40 pt-8">
          <Odometer
            value={counter.value}
            from={counter.from}
            format={format}
            className="text-counter font-serif italic font-medium text-ink-1 tabular-nums block"
          />
          <p className="mt-4 text-base text-ink-5">{counter.caption}</p>
        </div>
      </div>
    </section>
  );
}
