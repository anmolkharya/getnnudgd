import type { Metadata } from "next";
import { brand } from "@/src/config/brand";

// Temporary token lab for Landing v2 (T-100). Served at /_lab/tokens
// (the folder is "%5Flab" because "_lab" would be a private, unrouted folder).
// Deleted by T-1000.

export const metadata: Metadata = {
  title: `Token lab | ${brand.name}`,
  robots: { index: false, follow: false },
};

const INKS = [
  { name: "ink-0", cls: "bg-ink-0" },
  { name: "ink-1", cls: "bg-ink-1" },
  { name: "ink-2", cls: "bg-ink-2" },
  { name: "ink-3", cls: "bg-ink-3" },
  { name: "ink-4", cls: "bg-ink-4" },
  { name: "ink-5", cls: "bg-ink-5" },
  { name: "ink-6", cls: "bg-ink-6" },
] as const;

const LOGOS = ["Razorpay", "Zerodha", "CRED", "Swiggy", "Meesho", "Groww", "PhonePe", "Zepto"];

function Label({ children }: { children: string }) {
  return <p className="font-mono text-micro uppercase text-ink-5">{children}</p>;
}

export default function TokenLabPage() {
  return (
    <main className="landing-scope bg-white">
      <header className="lv-glass sticky top-0 z-10 border-b border-ink-6/30">
        <div className="lv-container flex items-center justify-between py-4">
          <span className="font-mono text-micro uppercase text-ink-2">lv-glass nav</span>
          <a
            href="#swatches"
            className="rounded-full bg-ink-1 px-5 py-2 text-white transition-colors hover:bg-accent"
          >
            {brand.ctaGetVouched}
          </a>
        </div>
      </header>

      <section className="lv-container flex flex-col gap-10 py-16">
        <div className="flex flex-col gap-2">
          <Label>text-wordmark · font-heading</Label>
          <p className="text-wordmark font-heading font-semibold text-ink-1">{brand.name}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>text-display · lv-heading-pair</Label>
          <h1 className="lv-heading-pair text-display text-ink-1">
            <span>Get vouched in</span>
            <em>by someone on the inside.</em>
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          <Label>text-h2-lg · tracking-display · max-w-measure</Label>
          <h2 className="text-h2-lg tracking-display max-w-measure text-ink-2">
            Insiders vouch for Seekers they believe in.
          </h2>
          <p className="max-w-measure text-ink-5">
            Seekers spend credits to send an Insider Request. Insiders earn points when they vouch.
            This paragraph is capped at the 613px text measure.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>text-h3-lg · text-h3 · text-faq</Label>
          <h3 className="text-h3-lg text-ink-2">How do credits work?</h3>
          <h3 className="text-h3 text-ink-3">What do Insiders earn?</h3>
          <p className="text-faq text-ink-4">Can I send more than one Insider Request?</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>text-counter · font-serif italic</Label>
          <p className="text-counter font-serif font-medium italic text-ink-1">1,284</p>
        </div>

        <div id="swatches" className="flex flex-col gap-3">
          <Label>bg-ink-0 … bg-ink-6</Label>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-7">
            {INKS.map((ink) => (
              <div key={ink.name} className="flex flex-col gap-1">
                <div className={`${ink.cls} h-16 rounded-lg`} />
                <span className="font-mono text-micro text-ink-5">{ink.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-card-lg bg-white p-8 shadow-soft">
            <Label>rounded-card-lg · shadow-soft</Label>
            <p className="text-h3 text-ink-2">Large soft card</p>
            <div className="flex gap-2">
              <span className="rounded-full bg-tint-green px-3 py-1 font-mono text-micro uppercase text-ink-2">
                bg-tint-green
              </span>
              <span className="rounded-full bg-tint-orange px-3 py-1 font-mono text-micro uppercase text-ink-2">
                bg-tint-orange
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-card-lg border border-ink-6/40 p-8">
            <Label>accent (progress, active dot, focus)</Label>
            <div className="h-1 w-full rounded-full bg-ink-6/30">
              <div className="h-1 w-2/3 rounded-full bg-accent" />
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-accent" />
              <span className="size-2 rounded-full bg-ink-6" />
              <span className="size-2 rounded-full bg-ink-6" />
            </div>
            <button type="button" className="self-start rounded-full border border-ink-6 px-4 py-2 text-ink-2">
              Tab to me for the focus ring
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-container rounded-lg border border-dashed border-ink-6 p-4">
          <Label>max-w-container (1280px) · utility form of the lv-container width</Label>
        </div>

        <div className="flex flex-col gap-3">
          <Label>lv-mask-x</Label>
          <div className="lv-mask-x flex gap-8 overflow-hidden py-2">
            {LOGOS.map((logo) => (
              <span key={logo} className="shrink-0 text-h3 text-ink-4">
                {logo}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label>lv-mask-y</Label>
          <ul className="lv-mask-y flex h-40 flex-col gap-2 overflow-hidden text-faq text-ink-3">
            {LOGOS.map((logo) => (
              <li key={logo}>{logo} Insider vouched</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lv-dark py-16">
        <div className="lv-container flex flex-col gap-6">
          <p className="font-mono text-micro uppercase text-on-dark-2">lv-dark · text-on-dark-*</p>
          <h2 className="lv-heading-pair text-h2-lg">
            <span>{brand.tagline}</span>
            <em>Insiders vouch. Seekers get in.</em>
          </h2>
          <p className="max-w-measure text-on-dark-1">text-on-dark-1 body copy (white 70%).</p>
          <p className="text-on-dark-2">text-on-dark-2 secondary (white 55%).</p>
          <p className="text-on-dark-3">text-on-dark-3 decorative only (white 35%).</p>
          <div className="border-t border-line-dark pt-6">
            <a href="#swatches" className="text-white underline">
              border-line-dark hairline above; focus me
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
