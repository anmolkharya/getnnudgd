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
| Carousel timer | `useAutoplay()` (requestAnimationFrame, no library) |

All primitives live in `components/motion/` and are the only sanctioned way for landing
sections to animate. Every primitive honours `prefers-reduced-motion` (static final
state) and pauses when off-screen. Lenis is off for reduced motion and coarse pointers.

Why GSAP + Lenis: GSAP is the de facto standard for scroll-driven timelines and is free,
plugins included (ScrollTrigger), since the Webflow acquisition. ScrollTrigger handles
pinning/scrubbing that IntersectionObserver cannot. Lenis is the smallest well-maintained
smooth-scroll library and is designed to run off the GSAP ticker.

Versions pinned: see `package.json` (`gsap`, `lenis`).

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

Both are loaded only by client components under `components/motion/`, so the cost lands
only on routes that render those primitives (the landing page and the motion lab).

## framer-motion

`framer-motion` stays installed for now. It is still imported by:

- `components/FadeInSection.tsx`
- `components/SocialProof.tsx`

These are current (v1) landing components. Landing v2 must not add new `framer-motion`
imports. **Removal condition:** T-1000 removes `framer-motion` from `package.json` once
`grep -r "framer-motion" app components src lib` returns nothing (i.e. the v1 landing
components above are deleted or migrated to `components/motion/`).
