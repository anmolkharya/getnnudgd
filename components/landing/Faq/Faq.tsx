"use client";

import { useId, useState } from "react";
import { faq } from "@/src/config/landing";
import styles from "./Faq.module.css";

const AVATARS = [
  { tone: "bg-ink-2", initial: "A" },
  { tone: "bg-ink-4", initial: "B" },
  { tone: "bg-ink-5", initial: "C" },
] as const;

function jsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function LandingFaq() {
  const uid = useId();
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]));

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section id="faq" className="scroll-mt-20 bg-white">
      <div className="lv-container py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="lv-heading-pair text-h2-lg">
              <span>{faq.headingSans}</span>
              <em>{faq.headingSerif}</em>
            </h2>
            <p className="mt-4 text-ink-5">{faq.sub}</p>

            <div className="mt-10 rounded-2xl border border-ink-6/40 p-6 shadow-soft">
              <div className="flex items-center" aria-hidden="true">
                <div className="flex">
                  {AVATARS.map((a, i) => (
                    <span
                      key={a.initial}
                      className={`${a.tone} ${i > 0 ? "-ml-3" : ""} flex size-9 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-white`}
                    >
                      {a.initial}
                    </span>
                  ))}
                </div>
                <span className="ml-3 rounded-full bg-ink-1 px-2.5 py-1 text-xs text-white">You</span>
              </div>
              <h3 className="mt-4 text-h3 text-ink-1">{faq.contact.title}</h3>
              <p className="mt-2 text-sm text-ink-5">{faq.contact.body}</p>
              <a
                href={faq.contact.cta.href}
                className="mt-6 inline-flex items-center rounded-full bg-ink-1 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent"
              >
                {faq.contact.cta.label}
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border-t border-ink-6/40">
              {faq.items.map((item, i) => {
                const isOpen = open.has(i);
                const buttonId = `${uid}-q-${i}`;
                const panelId = `${uid}-a-${i}`;
                const legal = "needsLegalReview" in item && item.needsLegalReview;
                return (
                  <div
                    key={item.q}
                    className="border-b border-ink-6/40"
                    data-needs-legal-review={legal ? "true" : undefined}
                  >
                    <h3>
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggle(i)}
                        className="flex w-full items-center justify-between gap-6 py-5 text-left font-heading text-faq text-ink-1"
                      >
                        <span>{item.q}</span>
                        <span
                          aria-hidden="true"
                          className={`relative size-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                        >
                          <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-ink-1" />
                          <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-ink-1" />
                        </span>
                      </button>
                    </h3>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      aria-hidden={isOpen ? undefined : true}
                      inert={!isOpen}
                      className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
                    >
                      <div className={styles.inner}>
                        <p className="pb-5 pr-10 text-base text-ink-5">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
    </section>
  );
}
