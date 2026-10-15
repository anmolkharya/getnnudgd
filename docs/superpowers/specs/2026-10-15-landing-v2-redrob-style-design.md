# Landing v2 — Redrob-style redesign (design spec)

Status: APPROVED by founder 2026-10-15 (decisions D1–D10 in §6).
Reference: https://redrob.io/ (analysed 2026-10-15 at 1440×900 and 799 px).
Plan: `docs/superpowers/plans/2026-10-15-landing-v2-plan.md`.

## 1. What we are copying, and what we are not

We copy Redrob's **layout, section rhythm, typography system, and motion behaviour**. We do **not** copy their images, illustrations, 3D renders, logos, or copy text: those are their copyrighted assets. Every image and every line of copy is GetNudgd's own, drawn from `src/config/brand.ts` and a new `src/config/landing.ts`.

Redrob is built in **Framer** (no-code; `meta generator = Framer`). There is no code to port. We rebuild the effects in Next.js 16 + Tailwind 4 with CSS transitions, `IntersectionObserver`, and the already-installed `framer-motion`.

## 2. Reference analysis

### 2.1 Visual language

| Aspect | Redrob value |
|---|---|
| Overall | Monochrome. White page, near-black (`#0A0A0A`) feature sections. Colour comes only from photography and small UI-mock chips. |
| Greys | `#000`, `#0A0A0A`, `#1D1D1D`, `#2B2B2B`, `#404040`, `#6E6E6E`, `#A3A3A3`; white at 0.7 / 0.55 / 0.5 / 0.35 / 0.2 alpha on dark |
| Accent tints | Green `rgba(83,224,151,.12)`, orange `rgba(247,136,0,.12)` for status chips |
| Sans | Pretendard (Medium 500 for headings, Regular for body); Inter for hero captions |
| Serif accent | IBM Plex Serif **italic**, used as the second line of a two-line heading ("Everything We Build / *Solves a Real Problem*") and for the giant counter numerals |
| Mono | IBM Plex Mono, uppercase micro-labels in UI mocks ("NEW JOB MATCH") |
| Type scale | Wordmark ~140 px; footer H1 60/68 (-2.4 px); H2 48/56 (-1.44 px, i.e. -3 %); hero H2 40/48 (-1 px); H3 32/38 and 24/34; FAQ question 18/26; body 16 |
| Radii | 4, 8, 12, 16, **32 (product cards)**, 100 px pills |
| Shadow | Layered Framer soft shadow: `0 .6px .6px -1.25px rgb(0 0 0/.18), 0 2.3px 2.3px -2.5px rgb(0 0 0/.16), 0 10px 10px -3.75px rgb(0 0 0/.06)` |
| Container | max-width 1280 px, text blocks 520–613 px |
| Glass | Nav `rgba(255,255,255,.47)` + `backdrop-filter: blur(5px)`; overlays blur 8–12 px |

### 2.2 Section-by-section (top to bottom)

| # | Section | Layout | Motion |
|---|---|---|---|
| S1 | **Nav** (60 px, sticky) | Logo left; centred `Products ▾`, `How we work`, `FAQ`; right `Contact Us ↗` | Glass blur. `Products` opens a hover mega-dropdown: numbered list (01–10), bold name + one-line description, white card with soft shadow, fade+slide-down. Mobile: hamburger → full-screen drawer. |
| S2 | **Giant wordmark** | "Redrob ecosystem" at ~140 px, full width, tight tracking | Fade/blur-in on load |
| S3 | **Hero carousel** (full-bleed, ~80 vh, dark) | Scene image per slide; bottom-left caption (small label + 40 px H2); dot pagination; bottom thumbnail strip of numbered cards ("01 Redrob Luma") with prev/next arrows | Auto-advance ~5 s with crossfade + slight scale; active thumbnail shows a filling progress bar; clicking a thumb or arrow jumps; pauses on hover/focus |
| S4 | **Logo marquee** | Centred line "Trusted by Data. Built for India." then a row of grayscale logos | Infinite horizontal scroll, edge fade masks |
| S5 | **Product suite** | Left H2 + paragraph + black pill CTA; below, 3-column grid of tall cards (radius 32): full-bleed scenic image, floating UI mock in the upper half, gradient to dark at the bottom, title (24 px), 3-line description, white "Explore" button; "View More" button below | Cards fade-up with stagger on scroll; mock floats slightly on hover; image scales 1.03 |
| S6 | **Dark bento** "Everything We Build / *Solves a Real Problem*" | Black section; centred two-line heading (sans + serif italic) and sub; a bordered 3×2 grid: (a) Live Intelligence — vertical feed of notification rows with mono labels and coloured icons; (b) Smarter Decisions — three stat chips (92 % / NOW / HIGH); (c) 3D chip icon with circuit traces; (d) Purpose-Built — "ASK ANYTHING" input; (e) Built to Evolve | (a) feed auto-scrolls upward in a loop with top/bottom fade masks; (b) chips count up; (c) light pulses travel along the traces; (d) placeholder types itself |
| S7 | **Big counter** | H3 statement (32 px) left; giant serif numeral (~200 px) "19,417,038 → 20,000,000"; caption | Odometer digit-roll count-up when in view |
| S8 | **FAQ** | Two columns: left heading (sans + serif italic), sub, "Still have questions?" card with avatar stack + "You" pill + black CTA; right accordion of bordered rows with `+` | Accordion height animation, `+` rotates to `×`; first item open |
| S9 | **Footer** | Dark photo background (night sky + person); serif italic "Your Next Move" + sans "Starts Here."; sub; three link columns; giant cropped wordmark at the bottom with gradient fade | Parallax on the background; wordmark rises in on scroll |

## 3. GetNudgd mapping

| Redrob | GetNudgd v2 |
|---|---|
| "Redrob ecosystem" wordmark | `Get vouched in.` (from `brand.ctaGetVouched`) |
| Hero carousel = 10 products | 5–6 slides of GetNudgd moments: (1) AI-tailored ATS resume, (2) find a verified Insider, (3) send an Insider Request with credits, (4) Insider vouches you in, (5) Insiders earn points → gift cards, (6) start on WhatsApp |
| Mega-menu "Products" | "How it works" dropdown: For Seekers, For Insiders (`/for-insiders`), Resume tailoring, Insider Requests, Insider Rewards, WhatsApp |
| Logo marquee | Real grayscale logos captioned "Insiders work at" + non-affiliation disclaimer |
| Product suite cards | 5 feature cards using the same slide list (image + UI mock from our real screens) |
| Bento | "Everything we built / *fixes the referral game*": live feed rows like `INSIDER ACCEPTED · SDE-2 AT A FINTECH`, `ATS SCORE 92 · RESUME READY`, `VOUCHED IN · INTERVIEW TOMORROW`; stat chips (`48h` response window, `2` tranches, `92` ATS); chip icon = GetNudgd logo mark |
| Counter | Static number from `src/config/landing.ts`, `placeholder: true` |
| FAQ | Seeker + Insider FAQs (locked vocabulary) |
| Footer | "*Your next role* / Starts here." + "Get vouched in" → `/login` + links + giant "GetNudgd" wordmark |

All copy uses the locked vocabulary (Insider, Seeker, Insider Request, vouch, credits, points).

## 4. Technical decisions (proposed)

- Route: replaces `app/(public)/page.tsx`. Old components stay until the swap task deletes them.
- Components live in `components/landing/<Section>/`; primitives in `components/motion/`.
- Copy and slide data live in `src/config/landing.ts` (typed, `as const`), so sections are data-driven and the founder can edit copy without touching JSX.
- Images: free stock photos (Unsplash/Pexels), credited in `public/landing/CREDITS.md`; `next/image`, AVIF/WebP. Hero slide 1 is `priority`; the rest lazy.
- Motion: **GSAP + ScrollTrigger and Lenis approved** (founder, 2026-10-15) for smooth scroll, reveals, parallax, odometer; CSS keyframes for infinite loops (marquee, feed, pulses). `framer-motion` is removed once nothing imports it. This closes the AGENTS.md §4.3 framer-motion decision item.
- Primary CTA everywhere: "Get vouched in" → `/login`. The waitlist form is not used on the landing.
- Every animation honours `prefers-reduced-motion` (falls back to a static final state) and pauses when off-screen.
- Performance budget: LCP < 2.5 s on 4G mobile, CLS < 0.05, landing JS < 160 KB gzipped (includes gsap + lenis).
- Accessibility: carousel is a labelled region with pause button and keyboard arrows; accordion uses `button[aria-expanded]`; marquee duplicated items are `aria-hidden`.

## 5. Token changes

Add to `app/globals.css` (scoped to a new `.landing-scope` so app screens keep current tokens):

```
--lv-ink-0: #000; --lv-ink-1: #0A0A0A; --lv-ink-2: #1D1D1D; --lv-ink-3: #2B2B2B;
--lv-ink-4: #404040; --lv-ink-5: #6E6E6E; --lv-ink-6: #A3A3A3;
--lv-on-dark-1: rgb(255 255 255 / .7); --lv-on-dark-2: rgb(255 255 255 / .55); --lv-on-dark-3: rgb(255 255 255 / .35);
--lv-line-dark: rgb(255 255 255 / .12);
--lv-tint-green: rgb(83 224 151 / .12); --lv-tint-orange: rgb(247 136 0 / .12);
--font-serif: IBM Plex Serif (italic 500); --font-mono: IBM Plex Mono;
--fs-wordmark: clamp(56px, 10vw, 148px); --fs-display: clamp(40px, 4.2vw, 60px);
--fs-h2-lg: clamp(32px, 3.4vw, 48px); --fs-counter: clamp(72px, 14vw, 200px);
--tracking-display: -0.03em;
--r-card-lg: 32px;
--shadow-soft: (Framer layered shadow from §2.1);
--accent: var(--indigo-600)   /* used sparingly: CTA hover, active dot, progress bar */
```

## 6. Founder decisions

D1 fonts: Jakarta + Inter, add IBM Plex Serif italic + IBM Plex Mono. D2 colour: monochrome + indigo accent. D3 images: free stock photos. D4 wordmark: "Get vouched in.". D5 motion: GSAP + Lenis approved. D6 counter: static config number. D7 logos: real logos + disclaimer. D8 review: Sonnet spec review on Haiku tasks. D9 scope: landing only. D10 CTA: sign up / login. Full wording in the plan file §0.
