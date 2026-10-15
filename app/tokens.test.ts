import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";

/**
 * T-100 landing tokens. Wave 2 landing sections rely on these names; if one
 * disappears or is renamed this test must fail.
 */

// Comments stripped so they cannot glue onto the declaration that follows them.
const css = readFileSync(path.resolve(__dirname, "globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Returns the body of the first top-level block whose prelude matches `selector` exactly. */
function blockBody(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`block not found: ${selector}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated block: ${selector}`);
}

/** Custom properties declared at the top level of a block body (nested rules ignored). */
function declaredProps(body: string): Map<string, string> {
  const props = new Map<string, string>();
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      current = "";
      continue;
    }
    if (depth > 0) continue;
    if (ch === ";") {
      const m = current.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/);
      if (m) props.set(m[1], m[2]);
      current = "";
    } else {
      current += ch;
    }
  }
  return props;
}

const REQUIRED_SCOPE_TOKENS = [
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => `--lv-ink-${n}`),
  "--lv-on-dark-1",
  "--lv-on-dark-2",
  "--lv-on-dark-3",
  "--lv-line-dark",
  "--lv-tint-green",
  "--lv-tint-orange",
  "--fs-wordmark",
  "--fs-display",
  "--fs-h2-lg",
  "--fs-counter",
  "--tracking-display",
  "--r-card-lg",
  "--shadow-soft",
  "--accent",
  "--lv-container",
  "--lv-measure",
];

// theme variable -> utility Wave 2 writes
const REQUIRED_THEME_VARS = [
  "--text-wordmark",
  "--text-display",
  "--text-h2-lg",
  "--text-counter",
  "--radius-card-lg",
  "--shadow-soft",
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => `--color-ink-${n}`),
  "--color-on-dark-1",
  "--color-on-dark-2",
  "--color-on-dark-3",
  "--color-line-dark",
  "--color-tint-green",
  "--color-tint-orange",
  "--color-accent",
  "--font-heading",
  "--font-serif",
  "--font-mono",
  "--container-container",
  "--container-measure",
  "--tracking-display",
];

describe("landing tokens in globals.css", () => {
  const scope = blockBody(css, ".landing-scope");
  const scopeProps = declaredProps(scope);

  it.each(REQUIRED_SCOPE_TOKENS)("declares %s inside .landing-scope", (token) => {
    expect(scopeProps.has(token)).toBe(true);
  });

  it("uses the reference values for fixed tokens", () => {
    expect(scopeProps.get("--r-card-lg")).toBe("32px");
    expect(scopeProps.get("--accent")).toBe("var(--indigo-600)");
    expect(scopeProps.get("--lv-container")).toBe("1280px");
    expect(scopeProps.get("--lv-measure")).toBe("613px");
    expect(scopeProps.get("--lv-ink-0")).toBe("#000000");
    expect(scopeProps.get("--lv-ink-6")).toBe("#A3A3A3");
  });

  it("disables motion inside .landing-scope for prefers-reduced-motion", () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.landing-scope \*/,
    );
  });

  it("does not leak landing tokens into :root", () => {
    const root = declaredProps(blockBody(css, ":root"));
    for (const token of REQUIRED_SCOPE_TOKENS) {
      if (token === "--accent") continue;
      expect(root.has(token)).toBe(false);
    }
    expect(root.has("--accent")).toBe(false);
  });

  describe("@theme extension", () => {
    const theme = declaredProps(blockBody(css, "@theme inline"));

    it.each(REQUIRED_THEME_VARS)("registers %s", (name) => {
      expect(theme.has(name)).toBe(true);
    });

    it("maps every theme value onto a token that exists (scope token or font variable)", () => {
      for (const [name, value] of theme) {
        const refs = [...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);
        if (refs.length === 0) {
          // A theme var sharing its name with a scope token (e.g. --shadow-soft)
          // cannot reference itself, so it must repeat the scope literal exactly.
          expect(scopeProps.get(name), `${name} must mirror the scope token`).toBe(value);
          continue;
        }
        for (const ref of refs) {
          const known =
            scopeProps.has(ref) ||
            ["--font-plex-serif", "--font-plex-mono", "--font-display"].includes(ref);
          expect(known, `${name} references unknown ${ref}`).toBe(true);
        }
      }
    });

    it("maps font-serif and font-mono to the Plex font variables", () => {
      expect(theme.get("--font-serif")).toContain("var(--font-plex-serif)");
      expect(theme.get("--font-mono")).toContain("var(--font-plex-mono)");
    });
  });

  it.each([".lv-heading-pair", ".lv-mask-x", ".lv-mask-y", ".lv-glass", ".lv-container"])(
    "defines the %s utility class",
    (cls) => {
      expect(css).toMatch(new RegExp(`\\.landing-scope ${cls.replace(".", "\\.")}\\b`));
    },
  );
});

type FontOptions = {
  variable?: string;
  weight?: string[];
  style?: string[];
  display?: string;
};

const fontCalls = vi.hoisted(() => new Map<string, unknown>());

vi.mock("next/font/google", () => {
  const make = (name: string) => (opts: unknown) => {
    fontCalls.set(name, opts);
    const variable = (opts as { variable?: string }).variable ?? "";
    return { className: `${name}-class`, variable: `${name}${variable}`, style: {} };
  };
  return {
    Plus_Jakarta_Sans: make("Plus_Jakarta_Sans"),
    Inter: make("Inter"),
    IBM_Plex_Serif: make("IBM_Plex_Serif"),
    IBM_Plex_Mono: make("IBM_Plex_Mono"),
  };
});
vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));

describe("root layout fonts", () => {
  it("loads IBM Plex Serif italic 500 as --font-plex-serif with swap", async () => {
    await import("./layout");
    const opts = fontCalls.get("IBM_Plex_Serif") as FontOptions;
    expect(opts).toMatchObject({
      variable: "--font-plex-serif",
      weight: ["500"],
      style: ["italic"],
      display: "swap",
    });
  });

  it("loads IBM Plex Mono 400/500 as --font-plex-mono with swap", async () => {
    await import("./layout");
    const opts = fontCalls.get("IBM_Plex_Mono") as FontOptions;
    expect(opts).toMatchObject({
      variable: "--font-plex-mono",
      weight: ["400", "500"],
      display: "swap",
    });
  });

  it("exposes all four font variables on <html>", async () => {
    const { default: RootLayout } = await import("./layout");
    const html = RootLayout({ children: null }) as ReactElement<{ className: string }>;
    const classes = html.props.className.split(/\s+/);
    expect(classes).toEqual(
      expect.arrayContaining([
        "Plus_Jakarta_Sans--font-jakarta",
        "Inter--font-inter",
        "IBM_Plex_Serif--font-plex-serif",
        "IBM_Plex_Mono--font-plex-mono",
      ]),
    );
  });
});
