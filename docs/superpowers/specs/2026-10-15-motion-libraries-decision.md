# Decision: motion libraries for landing v2 (GSAP + Lenis)

- Date: 2026-10-15
- Status: Accepted (founder decision D5, landing v2 plan)
- Task: T-110 (motion stack, Wave 1)
- Closes: AGENTS.md §4.3 "whether `framer-motion` stays is a Phase 0 decision recorded in `docs/superpowers/specs/`"

## Context

Landing v2 rebuilds the redrob.io motion language (a Framer site): hero carousel with
progress bars, infinite logo marquee, vertical notification-feed loop, scroll reveals
with fade-up/blur, odometer digit-roll counter, typing placeholder, parallax, and
smooth inertial scrolling. AGENTS.md §4.3 forbids new animation libraries without
founder approval. The founder approved GSAP (with ScrollTrigger) and Lenis on 2026-10-15.

## Decision

| Need | Tool |
| --- | --- |
| Smooth inertial scroll | `lenis` (driven from the GSAP ticker, synced to ScrollTrigger) |
| Scroll-linked effects (parallax, scrubbed timelines) | `gsap` + `gsap/ScrollTrigger` via `useGsap()` |
| Odometer digit roll | `gsap` tweens |
| Scroll reveals | CSS transitions + IntersectionObserver (`<Reveal>`, no library) |
| Infinite loops (marquee, feed), caret blink | CSS keyframes (`<Marquee>`, `<TypeLoop>`) |
| Carousel timer | `useAutoplay()` (one `setTimeout` per slide) + `<AutoplayProgress>` (CSS keyframe fill), no library |

All primitives live in `components/motion/` and are the only sanctioned way for landing
sections to animate. Every primitive honours `prefers-reduced-motion` (static final
state) and pauses when off-screen. Lenis is off for reduced motion and coarse pointers.

Why GSAP + Lenis: GSAP is the de facto standard for scroll-driven timelines and is free,
plugins included (ScrollTrigger), since the Webflow acquisition. ScrollTrigger handles
pinning/scrubbing that IntersectionObserver cannot. Lenis is the smallest well-maintained
smooth-scroll library and is designed to run off the GSAP ticker.

Versions pinned: see `package.json` (`gsap`, `lenis`).

## Import map (enforced)

| Import | Ships | Who may import it |
| --- | --- | --- |
| `@/components/motion` (barrel) | Reveal, Stagger, Marquee, TypeLoop, useTypeLoop, useAutoplay, AutoplayProgress, useInView, usePrefersReducedMotion, useMediaQuery, useHydrated, useLenis, useSmoothScrollTo. **No gsap, no lenis, no lenis.css.** | Any landing section |
| `@/components/motion/gsap` | `gsap`, `ScrollTrigger`, `useGsap`, `registerGsap` | Sections that need scroll-linked timelines/parallax |
| `@/components/motion/Odometer` | `<Odometer>` (pulls gsap) | The stats section |
| `@/components/motion/SmoothScroll` | `<SmoothScroll>` (pulls lenis + lenis.css + gsap) | The landing page shell only, once |

Guards:
- `components/motion/barrel.test.ts` fails if the barrel's import graph reaches `gsap*` or `lenis*`.
- `eslint.config.mjs` `no-restricted-imports` forbids `gsap`, `gsap/*`, `lenis`, `lenis/*` inside `components/landing/**`.

## Reveal and LCP

Never wrap the LCP element (hero headline or hero image) in a hiding `<Reveal>`. It stays
invisible until hydration (or the 2.5s no-JS failsafe) and delays Largest Contentful Paint.
Use `<Reveal eager>` (never hidden) or no Reveal above the fold.

The no-JS fallback relies on `@media (scripting: enabled)`: Chrome/Edge 120+, Safari 17+,
Firefox 113+. Browsers without it ignore the hiding rule, so content is simply visible
without the animation. If hydration happens after the failsafe has already shown the
content, Reveal keeps it shown instead of re-hiding it.

## Bundle cost

Measured from `node_modules` with `gzip -9` on each package's minified build (a close
proxy for what the production bundler emits; the unminified ESM sources are larger only
before minification):

| Package (version) | File | Min | Min + gzip |
| --- | --- | --- | --- |
| gsap 3.15.0 core (incl. CSSPlugin) | `dist/gsap.min.js` | 72.9 KB | **28.3 KB** |
| gsap ScrollTrigger (incl. Observer) | `dist/ScrollTrigger.min.js` | 44.6 KB | **18.0 KB** |
| lenis 1.3.27 | `dist/lenis.min.js` | 18.8 KB | **5.4 KB** |
| lenis CSS | `dist/lenis.css` | 0.5 KB | 0.3 KB |
| **Total added** | | 136.8 KB | **~52 KB** |

Cost per entry point (Vite/Rolldown lib build, minified, react external, gzip -9, measured
2026-10-16):

| Entry | JS gz | CSS gz | Contains gsap | Contains lenis |
| --- | --- | --- | --- | --- |
| `@/components/motion` (barrel) | 4.2 KB | 1.2 KB | no | no |
| `@/components/motion/gsap` | 47.6 KB | — | yes | no |
| `@/components/motion/Odometer` | 49.3 KB | 1.2 KB | yes | no |
| `@/components/motion/SmoothScroll` | 53.7 KB | 0.2 KB | yes | yes |

A page that uses only barrel primitives pays about 5 KB. gsap and lenis load only where
`gsap.ts`, `Odometer` or `SmoothScroll` is imported.

## framer-motion

`framer-motion` stays installed for now. It is still imported by:

- `components/FadeInSection.tsx`
- `components/SocialProof.tsx`

These are current (v1) landing components. Landing v2 must not add new `framer-motion`
imports. **Removal condition:** T-1000 removes `framer-motion` from `package.json` once
`grep -r "framer-motion" app components src lib` returns nothing (i.e. the v1 landing
components above are deleted or migrated to `components/motion/`).
