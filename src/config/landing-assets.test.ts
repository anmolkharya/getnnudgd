import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { photos, logos, mocks } from "./landing-assets";

const PUBLIC_DIR = path.resolve(__dirname, "../../public");

const PHOTO_KEYS = [
  "hero-resume",
  "hero-find-insider",
  "hero-request",
  "hero-vouch",
  "hero-rewards",
  "hero-whatsapp",
  "feature-resume",
  "feature-insiders",
  "feature-requests",
  "feature-rewards",
  "feature-whatsapp",
  "footer-scene",
].sort();

const LOGO_KEYS = [
  "logo-razorpay",
  "logo-phonepe",
  "logo-zerodha",
  "logo-freshworks",
  "logo-groww",
  "logo-zomato",
  "logo-swiggy",
  "logo-cred",
  "logo-flipkart",
  "logo-meesho",
].sort();

const MOCK_KEYS = [
  "mock-resume",
  "mock-insiders",
  "mock-requests",
  "mock-rewards",
  "mock-whatsapp",
].sort();

function toDisk(webPath: string): string {
  return path.join(PUBLIC_DIR, webPath.replace(/^\//, ""));
}

function dirSize(dir: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size;
  }
  return total;
}

describe("landing-assets manifest", () => {
  it("has exactly the expected photo, logo and mock keys", () => {
    expect(Object.keys(photos).sort()).toEqual(PHOTO_KEYS);
    expect(Object.keys(logos).sort()).toEqual(LOGO_KEYS);
    expect(Object.keys(mocks).sort()).toEqual(MOCK_KEYS);
  });

  it("points every photo variant at a file that exists on disk", () => {
    for (const key of PHOTO_KEYS) {
      const p = photos[key as keyof typeof photos];
      for (const w of [800, 1600] as const) {
        expect(fs.existsSync(toDisk(p.avif[w])), `${key} avif ${w}`).toBe(true);
        expect(fs.existsSync(toDisk(p.webp[w])), `${key} webp ${w}`).toBe(true);
      }
    }
  });

  it("points every svg logo and mock at a file that exists on disk", () => {
    for (const key of LOGO_KEYS) {
      const l = logos[key as keyof typeof logos];
      if (l.type === "svg") {
        expect(fs.existsSync(toDisk(l.src)), `${key} src`).toBe(true);
      }
    }
    for (const key of MOCK_KEYS) {
      const m = mocks[key as keyof typeof mocks];
      expect(fs.existsSync(toDisk(m.src)), `${key} src`).toBe(true);
    }
  });

  it("gives every photo non-empty alt text and a credit", () => {
    for (const key of PHOTO_KEYS) {
      const p = photos[key as keyof typeof photos];
      expect(p.alt.trim().length, `${key} alt`).toBeGreaterThan(10);
      expect(p.credit.trim().length, `${key} credit`).toBeGreaterThan(0);
    }
  });

  it("gives every mock non-empty alt text", () => {
    for (const key of MOCK_KEYS) {
      const m = mocks[key as keyof typeof mocks];
      expect(m.alt.trim().length, `${key} alt`).toBeGreaterThan(10);
    }
  });

  it("uses only the locked vocabulary in alt text and mock artwork", () => {
    const banned = /\brefer(s|red|ral|rer|ring)?\b|referr|payout|\bcoins?\b/i;
    for (const key of PHOTO_KEYS) {
      const p = photos[key as keyof typeof photos];
      expect(p.alt, `${key} alt`).not.toMatch(banned);
    }
    for (const key of MOCK_KEYS) {
      const m = mocks[key as keyof typeof mocks];
      expect(m.alt, `${key} alt`).not.toMatch(banned);
      const svg = fs.readFileSync(toDisk(m.src), "utf8");
      expect(svg, key).not.toMatch(banned);
      expect(svg.length, `${key} size`).toBeLessThan(30 * 1024);
    }
  });

  it("keeps every photo variant under 200 KB", () => {
    for (const key of PHOTO_KEYS) {
      const p = photos[key as keyof typeof photos];
      for (const w of [800, 1600] as const) {
        for (const file of [p.avif[w], p.webp[w]]) {
          const size = fs.statSync(toDisk(file)).size;
          expect(size, `${file} size`).toBeLessThan(200 * 1024);
        }
      }
    }
  });

  it("keeps public/landing under 3 MB", () => {
    const total = dirSize(path.join(PUBLIC_DIR, "landing"));
    expect(total).toBeLessThan(3 * 1024 * 1024);
  });
});
