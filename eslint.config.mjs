import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    ".worktrees/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    // Landing sections animate through components/motion only (T-110 review):
    // gsap via "@/components/motion/gsap", Lenis via <SmoothScroll>.
    files: ["components/landing/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "gsap", message: "Import from \"@/components/motion/gsap\" instead." },
            { name: "lenis", message: "Use <SmoothScroll> / useSmoothScrollTo from components/motion." },
          ],
          patterns: [
            { group: ["gsap/*"], message: "Import from \"@/components/motion/gsap\" instead." },
            { group: ["lenis/*"], message: "Use <SmoothScroll> / useSmoothScrollTo from components/motion." },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
