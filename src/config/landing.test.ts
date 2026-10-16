import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import * as landing from "./landing";

const BANNED =
  /\brefer(s|red|ral|rer|ring)?\b|referr|payout|\bcoins?\b|\btokens?\b|Referly|get referred|champion/i;

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

// Collects every object that carries an href string, from the whole module.
function collectLinks(value: unknown, out: { href: string; target: unknown }[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectLinks(item, out));
  } else if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.href === "string") {
      out.push({ href: record.href, target: record.target });
    }
    Object.values(record).forEach((item) => collectLinks(item, out));
  }
  return out;
}

// Walks the module and returns the dotted path of every object flagged placeholder: true.
function collectPlaceholderPaths(value: object, prefix = "", out: string[] = []): string[] {
  for (const [key, child] of Object.entries(value)) {
    if (child === null || typeof child !== "object" || Array.isArray(child)) continue;
    const childPath = prefix ? `${prefix}.${key}` : key;
    if ((child as Record<string, unknown>).placeholder === true) {
      out.push(childPath);
    }
    collectPlaceholderPaths(child, childPath, out);
  }
  return out;
}

function expectedTarget(href: string): string | undefined {
  if (href.startsWith("#")) return "anchor";
  if (href.startsWith("/")) return "route";
  if (href.startsWith("https:")) return "external";
  if (href.startsWith("mailto:")) return "mailto";
  return undefined;
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

  it("gives hero slides unique slide- prefixed ids", () => {
    const ids = landing.heroSlides.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith("slide-")).toBe(true);
    }
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

  it("keeps every image, mock and logo key unique", () => {
    const keys: string[] = [
      ...landing.heroImageKeys,
      ...landing.featureImageKeys,
      ...landing.mockKeys,
      ...landing.logoKeys,
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("points every primary CTA at /login", () => {
    expect(landing.nav.cta.href).toBe("/login");
    expect(landing.features.cta.href).toBe("/login");
    expect(landing.footer.cta.href).toBe("/login");
  });

  it("numbers the nav dropdown in order", () => {
    const numbers = landing.nav.links
      .flatMap((link) => (link.kind === "dropdown" ? link.items : []))
      .map((item) => item.number);
    expect(numbers).toEqual(["01", "02", "03", "04", "05", "06"]);
  });

  it("keeps the For Insiders link in the dropdown and at the top level", () => {
    const dropdownHrefs = landing.nav.links.flatMap((link) =>
      link.kind === "dropdown" ? link.items.map((i) => i.href) : [],
    );
    const topHrefs = landing.nav.links.map((link) => link.href);
    expect(dropdownHrefs).toContain("/for-insiders");
    expect(topHrefs).toContain("/for-insiders");
  });

  it("gives every href a target that matches its prefix", () => {
    const links = collectLinks(landing);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const target = expectedTarget(link.href);
      expect(target, `unknown href prefix: ${link.href}`).toBeDefined();
      expect(link.target).toBe(target);
    }
  });

  it("only links to section ids that are declared in sectionIds", () => {
    const sectionHrefs = collectLinks(landing)
      .map((l) => l.href)
      .filter((href) => href.startsWith("#"))
      .map((href) => href.slice(1));
    const ids: readonly string[] = landing.sectionIds;
    for (const id of sectionHrefs) {
      expect(ids).toContain(id);
    }
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

  it("has three stats as numbers with a suffix, and four purpose-built phrases", () => {
    expect(landing.bento.stats.items).toHaveLength(3);
    for (const item of landing.bento.stats.items) {
      expect(typeof item.value).toBe("number");
      expect(typeof item.suffix).toBe("string");
    }
    expect(landing.bento.purposeBuilt.phrases).toHaveLength(4);
  });

  it("flags every placeholder section and lists it in PLACEHOLDER_SECTIONS", () => {
    expect(landing.counter.placeholder).toBe(true);
    expect(landing.logos.placeholder).toBe(true);
    expect(landing.bento.liveFeed.placeholder).toBe(true);
    expect(landing.bento.stats.placeholder).toBe(true);
    const flagged = collectPlaceholderPaths(landing);
    expect(sorted(flagged)).toEqual(sorted([...landing.PLACEHOLDER_SECTIONS]));
  });

  it("keeps the counter growing from a lower starting value", () => {
    expect(landing.counter.from).toBeLessThan(landing.counter.value);
  });

  it("has seven FAQ items", () => {
    expect(landing.faq.items).toHaveLength(7);
  });

  it("flags the resume privacy answer for legal review", () => {
    const privacy = landing.faq.items.find((i) => i.q === "Who can see my resume?");
    expect(privacy?.needsLegalReview).toBe(true);
  });

  it("does not type the brand name literally in the config source", () => {
    const source = readFileSync(path.resolve(__dirname, "landing.ts"), "utf8");
    expect(/getnudgd/i.test(source)).toBe(false);
  });
});

describe("network map content", () => {
  it("has exactly one hub company and unique ids", () => {
    const hubs = landing.network.companies.filter((c) => "hub" in c && c.hub);
    expect(hubs).toHaveLength(1);
    const ids = [...landing.network.companies.map((c) => c.id), ...landing.network.people.map((p) => p.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every person at a known company and field, with a valid match", () => {
    const companyIds = new Set(landing.network.companies.map((c) => c.id));
    for (const person of landing.network.people) {
      expect(companyIds.has(person.companyId)).toBe(true);
      expect(landing.network.fields).toContain(person.field);
      expect(person.match).toBeGreaterThanOrEqual(0);
      expect(person.match).toBeLessThanOrEqual(100);
    }
  });

  it("gives every field at least one person so no filter is empty", () => {
    for (const field of landing.network.fields) {
      expect(landing.network.people.some((p) => p.field === field)).toBe(true);
    }
  });

  it("is flagged as placeholder sample data", () => {
    expect(landing.network.placeholder).toBe(true);
  });
});
