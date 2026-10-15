import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/** Walk relative imports from a module and collect bare package specifiers. */
function packagesReachableFrom(entry: string): Set<string> {
  const seen = new Set<string>();
  const packages = new Set<string>();
  const stack = [entry];
  while (stack.length > 0) {
    const file = stack.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    // value imports and re-exports only; `import type` is erased at compile time
    const re = /^\s*(?:import|export)\s+(?!type\b)(?:[^'"]*?from\s+)?["']([^"']+)["']/gm;
    for (const m of src.matchAll(re)) {
      const spec = m[1];
      if (spec.startsWith(".")) {
        const base = path.resolve(path.dirname(file), spec);
        const resolved = [".ts", ".tsx", "/index.ts"].map((ext) => base + ext).find((f) => existsSync(f));
        if (resolved) stack.push(resolved);
        else if (existsSync(base)) packages.add(spec);
      } else {
        packages.add(spec);
      }
    }
  }
  return packages;
}

const dir = path.resolve(__dirname);

describe("components/motion entry points", () => {
  it("the barrel never pulls gsap or lenis", () => {
    const pkgs = [...packagesReachableFrom(path.join(dir, "index.ts"))];
    expect(pkgs.filter((p) => p.startsWith("gsap") || p.startsWith("lenis"))).toEqual([]);
  });

  it("gsap.ts and SmoothScroll.tsx are the heavy entry points", () => {
    expect([...packagesReachableFrom(path.join(dir, "gsap.ts"))]).toContain("gsap");
    expect([...packagesReachableFrom(path.join(dir, "SmoothScroll.tsx"))]).toContain("lenis");
  });
});
