import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import * as landing from "./landing";

const BANNED = /referr|\brefer\b|payout|\bcoins?\b|Referly|get referred|champion/i;

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, out));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, out));
  }
  return out;
}

const sorted = (values: readonly string[]): string[] => [...values].sort();

describe("landing content config", () => {
  const allStrings = collectStrings(landing);

  it("never uses banned vocabulary in any string value", () => {
    const hits = allStrings.filter((s) => BANNED.test(s));
    expect(hits).toEqual([]);
  });

  it("never uses exclamation marks", () => {
    expect(allStrings.filter((s) => s.includes("!"))).toEqual([]);
  });

  it("exposes the wordmark from the locked CTA copy", () => {
    expect(landing.wordmark.text).toBe("Get vouched in.");
  });

  it("uses exactly the hero imageKeys", () => {
    expect(sorted(landing.heroSlides.map((s) => s.imageKey))).toEqual(
      sorted([
        "hero-resume",
        "hero-find-insider",
        "hero-request",
        "hero-vouch",
        "hero-rewards",
        "hero-whatsapp",
      ]),
    );
    expect(landing.heroSlides).toHaveLength(6);
  });

  it("keeps hero titles at six words or fewer", () => {
    for (const slide of landing.heroSlides) {
      expect(slide.title.split(/\s+/).length).toBeLessThanOrEqual(6);
    }
  });

  it("uses exactly the feature imageKeys and mockKeys", () => {
    expect(sorted(landing.features.cards.map((c) => c.imageKey))).toEqual(
      sorted([
        "feature-resume",
        "feature-insiders",
        "feature-requests",
        "feature-rewards",
        "feature-whatsapp",
      ]),
    );
    expect(sorted(landing.features.cards.map((c) => c.mockKey))).toEqual(
      sorted([
        "mock-resume",
        "mock-insiders",
        "mock-requests",
        "mock-rewards",
        "mock-whatsapp",
      ]),
    );
    expect(landing.features.cards).toHaveLength(5);
  });

  it("keeps feature card bodies at thirty words or fewer", () => {
    for (const card of landing.features.cards) {
      expect(card.body.split(/\s+/).length).toBeLessThanOrEqual(30);
    }
  });

  it("uses exactly the logoKeys for the ten named companies", () => {
    const names = [
      "Razorpay",
      "PhonePe",
      "Zerodha",
      "Freshworks",
      "Groww",
      "Zomato",
      "Swiggy",
      "CRED",
      "Flipkart",
      "Meesho",
    ];
    expect(sorted(landing.logos.items.map((i) => i.logoKey))).toEqual(
      sorted(names.map((n) => `logo-${n.toLowerCase()}`)),
    );
    expect(landing.logos.items.map((i) => i.name)).toEqual(names);
  });

  it("points every primary CTA at /login", () => {
    expect(landing.nav.cta.href).toBe("/login");
    expect(landing.features.cta.href).toBe("/login");
    expect(landing.footer.cta.href).toBe("/login");
  });

  it("numbers the nav dropdown in order", () => {
    const numbers = landing.nav.links
      .flatMap((link) => ("items" in link ? link.items : []))
      .map((item) => item.number);
    expect(numbers).toEqual(["01", "02", "03", "04", "05", "06"]);
  });

  it("has a feed with six to eight rows and a valid tone on each", () => {
    const rows = landing.bento.liveFeed.rows;
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(rows.length).toBeLessThanOrEqual(8);
    const tones = new Set(["green", "orange", "indigo", "neutral"]);
    for (const row of rows) {
      expect(tones.has(row.tone)).toBe(true);
      expect(row.label).toBe(row.label.toUpperCase());
      expect(row.detail).toBe(row.detail.toUpperCase());
    }
  });

  it("has three stats and four purpose-built phrases", () => {
    expect(landing.bento.stats.items).toHaveLength(3);
    expect(landing.bento.purposeBuilt.phrases).toHaveLength(4);
  });

  it("flags the counter and stats as placeholders", () => {
    expect(landing.counter.placeholder).toBe(true);
    expect(landing.counter.value).toBe(25000);
    expect(landing.counter.from).toBe(24000);
    expect(landing.bento.stats.placeholder).toBe(true);
  });

  it("has seven FAQ items", () => {
    expect(landing.faq.items).toHaveLength(7);
  });

  it("does not type the brand name literally in the config source", () => {
    const source = readFileSync(path.resolve(__dirname, "landing.ts"), "utf8");
    expect(source.includes("GetNudgd")).toBe(false);
  });
});
