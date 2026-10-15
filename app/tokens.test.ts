import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * T-100 landing tokens. Wave 2 landing sections rely on these names; if one
 * disappears or is renamed this test must fail.
 */

// Comments stripped so they cannot glue onto the declaration that follows them.
const css = readFileSync(path.resolve(__dirname, "globals.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\r\n/g, "\n");

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Body of the first block whose prelude starts at the beginning of a line and
 * equals `prelude` exactly (so `.landing-scope` never matches
 * `.landing-scope .lv-x` or an indented nested rule).
 */
function blockBody(source: string, prelude: string): string {
  const re = new RegExp(`^${escape(prelude)}\\s*\\{`, "m");
  const match = re.exec(source);
  if (!match) throw new Error(`block not found: ${prelude}`);
  const open = match.index + match[0].length - 1;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated block: ${prelude}`);
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
  "--lv-fs-wordmark",
  "--lv-fs-display",
  "--lv-fs-h2-lg",
  "--lv-fs-h3-lg",
  "--lv-fs-h3",
  "--lv-fs-faq",
  "--lv-fs-micro",
  "--lv-fs-counter",
  "--tracking-display",
  "--r-card-lg",
  "--shadow-soft",
  "--accent",
  "--lv-container",
  "--lv-measure",
  "--lv-pair-accent",
];

const REQUIRED_THEME_VARS = [
  "--text-wordmark",
  "--text-display",
  "--text-h2-lg",
  "--text-h3-lg",
  "--text-h3",
  "--text-faq",
  "--text-micro",
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
  "--container-page",
  "--container-measure",
  "--tracking-display",
];

// Names that already exist in :root and must never be redefined by landing code.
const LEGACY_ROOT_NAMES = ["--fs-h3", "--fs-h2", "--fs-hero", "--font-display"];

const scopeProps = declaredProps(blockBody(css, ".landing-scope"));
const rootProps = declaredProps(blockBody(css, ":root"));
const themeProps = declaredProps(blockBody(css, "@theme inline"));
const components = blockBody(css, "@layer components");

describe(".landing-scope tokens", () => {
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
    expect(scopeProps.get("--lv-pair-accent")).toBe("currentColor");
  });

  it("does not declare landing-only tokens in :root", () => {
    for (const token of REQUIRED_SCOPE_TOKENS) {
      expect(rootProps.has(token), token).toBe(false);
    }
  });

  it.each(LEGACY_ROOT_NAMES)("does not shadow the existing %s token", (name) => {
    expect(rootProps.has(name)).toBe(true);
    expect(scopeProps.has(name)).toBe(false);
    expect(themeProps.has(name)).toBe(false);
  });
});

describe(".lv-dark token flips", () => {
  const dark = declaredProps(blockBody(css, ".landing-scope .lv-dark,\n.landing-scope.lv-dark"));

  it("flips --fg-1, --border and --lv-focus-ring for dark surfaces", () => {
    expect(dark.get("--fg-1")).toBe("var(--lv-paper)");
    expect(dark.get("--border")).toBe("var(--lv-line-dark)");
    expect(dark.get("--lv-focus-ring")).toBe("var(--indigo-500)");
    expect(dark.get("--lv-pair-accent")).toBe("var(--lv-on-dark-1)");
  });
});

describe("legacy heading reset", () => {
  it("excludes everything inside .landing-scope", () => {
    expect(css).toMatch(/^:where\(h1, h2, h3, h4, h5, h6\):not\(\.landing-scope \*\) \{/m);
    expect(css).not.toMatch(/^h1, h2, h3, h4, h5, h6 \{/m);
  });
});

describe("@theme extension", () => {
  it.each(REQUIRED_THEME_VARS)("registers %s", (name) => {
    expect(themeProps.has(name)).toBe(true);
  });

  it("maps every theme value onto a token that exists (scope token or font variable)", () => {
    for (const [name, value] of themeProps) {
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

  it("maps font-serif and font-mono to the Plex variables with fallbacks", () => {
    expect(themeProps.get("--font-serif")).toBe(
      "var(--font-plex-serif, ui-serif), ui-serif, Georgia, serif",
    );
    expect(themeProps.get("--font-mono")).toBe(
      "var(--font-plex-mono, ui-monospace), ui-monospace, SFMono-Regular, Menlo, monospace",
    );
  });
});

describe("landing helper classes", () => {
  it.each([
    ".landing-scope .lv-container",
    ".landing-scope .lv-heading-pair",
    ".landing-scope .lv-heading-pair > em",
    ".landing-scope .lv-mask-x",
    ".landing-scope .lv-mask-y",
    ".landing-scope .lv-glass",
    ".landing-scope :focus-visible",
  ])("defines %s inside @layer components", (selector) => {
    expect(components).toMatch(new RegExp(`^\\s*${escape(selector)}[\\s,{]`, "m"));
  });

  it("keeps helper rules out of the unlayered cascade", () => {
    const unlayered = css.replace(components, "");
    for (const cls of ["lv-container", "lv-heading-pair", "lv-mask-x", "lv-mask-y", "lv-glass"]) {
      expect(unlayered, cls).not.toMatch(new RegExp(`\\.${cls}\\b`));
    }
  });

  it("styles only direct em / second children of .lv-heading-pair", () => {
    expect(components).toMatch(/\.lv-heading-pair > em,\s*\.landing-scope \.lv-heading-pair > :nth-child\(2\)/);
    expect(components).not.toMatch(/\.lv-heading-pair em\b/);
    expect(components).toMatch(/color: var\(--lv-pair-accent\);/);
  });

  it("draws the focus ring with the scope focus token", () => {
    const focus = blockBody(components.replace(/^\s+/gm, ""), ".landing-scope :focus-visible");
    expect(focus).toMatch(/outline: 2px solid var\(--lv-focus-ring\)/);
  });
});

describe("reduced motion", () => {
  it("disables CSS motion inside .landing-scope, outside any layer", () => {
    expect(css).toMatch(/^@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.landing-scope \*/m);
    expect(components).not.toMatch(/prefers-reduced-motion/);
  });

  it("never sets smooth scrolling (Lenis owns it)", () => {
    expect(css).not.toMatch(/scroll-behavior:\s*smooth/);
  });
});
