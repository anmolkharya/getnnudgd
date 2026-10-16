"use client";

import { useRef, type ReactNode } from "react";
import {
  Marquee,
  Reveal,
  TypeLoop,
  useInView,
  usePrefersReducedMotion,
} from "@/components/motion";
import { Odometer } from "@/components/motion/Odometer";
import { bento, type FeedTone } from "@/src/config/landing";
import { ChipCircuit } from "./ChipCircuit";
import styles from "./Bento.module.css";

const compactFormat = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const TONE_TILE: Record<FeedTone, string> = {
  green: "bg-tint-green text-emerald-300",
  orange: "bg-tint-orange text-amber-300",
  indigo: "bg-accent/20 text-indigo-300",
  neutral: "bg-white/10 text-on-dark-1",
};

function ToneIcon({ tone }: { tone: FeedTone }) {
  const common = {
    viewBox: "0 0 20 20",
    className: "size-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };
  switch (tone) {
    case "green":
      return (
        <svg {...common}>
          <path d="M4.5 10.5 8.5 14.5 15.5 6" />
        </svg>
      );
    case "orange":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6.5" />
          <path d="M10 6.5V10l2.5 1.75" />
        </svg>
      );
    case "indigo":
      return (
        <svg {...common}>
          <path d="M10 3v4M10 13v4M3 10h4M13 10h4M5.5 5.5l2 2M12.5 12.5l2 2M14.5 5.5l-2 2M7.5 12.5l-2 2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

function Cell({
  title,
  body,
  className,
  placeholder,
  children,
}: {
  title: string;
  body: string;
  className?: string;
  placeholder?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col bg-ink-1 p-6 md:p-8 ${className ?? ""}`}
      data-placeholder={placeholder ? "" : undefined}
    >
      <h3 className="font-heading text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-measure text-sm text-on-dark-1">{body}</p>
      {children}
    </div>
  );
}

function EvolveCell() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref);
  const { evolve } = bento;
  return (
    <div className="flex bg-ink-1 p-6 md:p-8">
      <div
        ref={ref}
        data-evolve=""
        data-running={String(inView && !reduced)}
        className={`flex flex-1 flex-col justify-end rounded-2xl p-6 ${styles.evolve}`}
      >
        <h3 className="font-heading text-lg font-semibold text-white">
          {evolve.title}
        </h3>
        <p className="mt-2 text-sm text-on-dark-1">{evolve.body}</p>
      </div>
    </div>
  );
}

/** S6 — dark bento grid: live feed, stats, chip, purpose-built input, evolve. */
export function LandingBento() {
  const { liveFeed, stats, chip, purposeBuilt } = bento;
  const phrasesLabel = purposeBuilt.phrases.join(", ");

  return (
    <section className="lv-dark py-24 md:py-32">
      <div className="lv-container">
        <Reveal>
          <h2 className="lv-heading-pair text-center text-h2-lg">
            <span>{bento.headingSans}</span>
            <em>{bento.headingSerif}</em>
          </h2>
          <p className="mx-auto mt-4 max-w-measure text-center text-on-dark-1">
            {bento.sub}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-card-lg border border-line-dark bg-line-dark lg:grid-cols-3">
          {/* (a) live feed — two rows tall on lg */}
          <Cell
            title={liveFeed.title}
            body={liveFeed.body}
            placeholder={liveFeed.placeholder}
            className="lg:row-span-2"
          >
            <div className="relative mt-6 h-80 lg:h-auto lg:min-h-80 lg:flex-1">
              <Marquee
                axis="y"
                speed={24}
                gap={12}
                className="lv-mask-y absolute inset-0"
                label={liveFeed.title}
              >
                {liveFeed.rows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-line-dark bg-white/5 px-4 py-3"
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg ${TONE_TILE[row.tone]}`}
                    >
                      <ToneIcon tone={row.tone} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-micro uppercase text-white">
                        {row.label}
                      </span>
                      <span className="text-xs text-on-dark-2">
                        {row.detail}
                      </span>
                    </span>
                  </div>
                ))}
              </Marquee>
            </div>
          </Cell>

          {/* (b) stats */}
          <Cell
            title={stats.title}
            body={stats.body}
            placeholder={stats.placeholder}
            className="lg:col-span-2"
          >
            <ul className="mt-6 flex flex-wrap gap-3">
              {stats.items.map((item) => (
                <li
                  key={item.label}
                  className="flex min-w-36 flex-1 flex-col gap-1 rounded-2xl border border-line-dark px-4 py-3"
                >
                  <Odometer
                    value={item.value}
                    from={0}
                    format={(n) => compactFormat.format(n) + item.suffix}
                    className="font-heading text-h3 text-white tabular-nums"
                  />
                  <span className="font-mono text-micro uppercase text-on-dark-2">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </Cell>

          {/* (c) chip */}
          <Cell title={chip.title} body={chip.body}>
            <ChipCircuit />
          </Cell>

          {/* (e) evolve */}
          <EvolveCell />

          {/* (d) purpose-built */}
          <div className="flex flex-col gap-6 bg-ink-1 p-6 md:p-8 lg:col-span-3 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="lg:max-w-sm">
              <h3 className="font-heading text-lg font-semibold text-white">
                {purposeBuilt.title}
              </h3>
              <p className="mt-2 text-sm text-on-dark-1">{purposeBuilt.body}</p>
            </div>
            <div
              role="img"
              aria-label={phrasesLabel}
              className="flex flex-col gap-2 lg:flex-1"
            >
              <span
                aria-hidden="true"
                className="px-5 font-mono text-micro uppercase text-on-dark-2"
              >
                Ask anything
              </span>
              <div className="flex items-center gap-3 rounded-full border border-line-dark bg-white/5 py-2 pr-2 pl-5">
                <TypeLoop
                  phrases={purposeBuilt.phrases}
                  label={phrasesLabel}
                  className="min-w-0 flex-1 text-sm text-white md:text-base"
                />
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-ink-1"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 15V5M5.5 9.5 10 5l4.5 4.5" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
