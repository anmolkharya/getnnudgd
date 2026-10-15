# Landing v2 (Redrob-style) — subagent-driven implementation plan

Spec: `docs/superpowers/specs/2026-10-15-landing-v2-redrob-style-design.md` (read it first; section IDs S1–S9 refer to it).
Integration branch: `landing-v2` (off `main`). Task branches: `lv2/T-xxx-<slug>` (git cannot hold `landing-v2` and `landing-v2/*` at once), each in its own worktree under `../getnudgd-wt/T-xxx`.
Process: AGENTS.md Part 6 (implementer → spec reviewer → code-quality reviewer per task), with the parallelism rules in §3 below.

---

## 0. Founder decisions (answered 2026-10-15 — binding for every task)

| # | Topic | Decision |
|---|---|---|
| D1 | Fonts | Keep Plus Jakarta Sans (display) + Inter (body). **Add** IBM Plex Serif (italic 500) for accent heading lines and the counter, and IBM Plex Mono (400/500) for micro-labels, via `next/font/google`. |
| D2 | Colour | Monochrome (Redrob greys) + GetNudgd indigo as a sparing `--accent`: CTA hover, active dot, carousel progress bar, focus ring. |
| D3 | Images | **Free stock photos** (Unsplash / Pexels licence only). Every photo recorded in `public/landing/CREDITS.md` with source URL, photographer and licence. India-relevant subjects preferred (Indian professionals, offices, cities). No Redrob assets. |
| D4 | Wordmark | "Get vouched in." — read from `brand.ctaGetVouched`, never typed. |
| D5 | Motion libraries | **Approved: `gsap` (incl. ScrollTrigger) and `lenis`** for smooth scroll, pinned/parallax scroll effects and timelines. `framer-motion` stays only until T-1000; remove it if nothing imports it afterwards. Record this decision in the spec (closes the AGENTS.md §4.3 Phase 0 decision item). |
| D6 | Counter | Static number in `src/config/landing.ts`, `placeholder: true`. |
| D7 | Logos | Real company logos, grayscale, captioned "Insiders work at", with the disclaimer "Logos are trademarks of their respective owners. GetNudgd is not affiliated with or endorsed by these companies." Use official press-kit / Wikimedia Commons SVGs only. |
| D8 | Review cost | Sonnet does spec review for Haiku-tier tasks; Opus does spec review for S/H tasks, all code-quality reviews and the final review. |
| D9 | Scope | Landing `/` only. `/for-insiders` is a follow-up plan reusing these components. |
| D10 | Primary CTA | **Sign up / login**: every primary button ("Get vouched in") links to `/login`. The waitlist form is removed from the landing (component kept in the repo). |

Downloads: agents must not download photos or logos on their own. T-130 produces a shortlist; the controller shows it to the founder and downloads only after a yes.

---

## 1. Agent roster and model tiers

| Tier | Model | Used for |
|---|---|---|
| **H — high** | Opus 5.5 (`opus`) | Controller, shared foundations other agents build on, the two hardest animated sections, code-quality and final review |
| **S — standard** | Sonnet 5.5 (`sonnet`) | Multi-file components with state, a11y, or tests; page assembly; QA; spec review |
| **L — light** | Haiku 5.5 (`haiku`) | Static or data-driven sections, copy/config files, asset placeholders, simple tests |

| Agent | Role | Tier | Wave |
|---|---|---|---|
| **T-000** | Controller (main session). Owns `landing-v2`, dispatches, merges, never writes code | H | all |
| **T-100** | Foundations lead: tokens, fonts, `.landing-scope` | H | 1 |
| **T-110** | Motion stack: GSAP + Lenis setup and primitives (`components/motion/*`) | H | 1 |
| **T-120** | Content config `src/config/landing.ts` + copy | L | 1 |
| **T-130** | Stock photo + logo shortlist, then asset pipeline | L | 1 |
| **T-200** | Nav + mega-dropdown + mobile drawer (S1) | S | 2 |
| **T-300** | Wordmark + hero carousel (S2, S3) | H | 2 |
| **T-400** | Logo marquee (S4) | L | 2 |
| **T-500** | Feature card grid (S5) | S | 2 |
| **T-600** | Dark bento with animated cells (S6) | H | 2 |
| **T-700** | Odometer counter section (S7) | S | 2 |
| **T-800** | FAQ + contact card (S8) | S | 2 |
| **T-900** | Footer with wordmark + sign-up CTA (S9) | L | 2 |
| **T-1000** | Page assembly, route swap, metadata, old-component cleanup | S | 3 |
| **T-1100** | QA: Playwright smoke, screenshots 390/768/1280/1440, a11y + perf audit | S | 4 |
| **T-R1** | Spec reviewer (per task) | S for L-tasks, H otherwise (D8) | after each task |
| **T-R2** | Code-quality reviewer (per task) | H | after T-R1 passes |
| **T-R3** | Final whole-branch reviewer | H | 5 |

---

## 2. Waves and dependencies

```
Wave 1 (parallel, 4 worktrees)   T-100 ─┐  T-110 ─┐  T-120 ─┐  T-130 ─┐
                                        └─────────┴────┬────┴─────────┘
                               controller merges all four into landing-v2
                                                       │
Wave 2 (parallel, 8 worktrees)   T-200  T-300  T-400  T-500  T-600  T-700  T-800  T-900
                                 (each owns only components/landing/<Section>/ + its tests)
                                                       │
Wave 3                                               T-1000  (assembly; sole writer of app/(public)/page.tsx)
                                                       │
Wave 4                                               T-1100  (QA, may open fix tasks T-1101…)
                                                       │
Wave 5                                               T-R3 final review → finishing-a-development-branch
```

Why this is safe to parallelise: in each wave, every agent owns a **disjoint set of files** (listed per task). Shared files (`globals.css`, `landing.ts`, `components/motion/*`) are written only in Wave 1 and are read-only afterwards. If a Wave 2 agent needs a token or primitive that does not exist, it reports `NEEDS_CONTEXT`; the controller adds it on `landing-v2` and rebases the worktree. No agent edits another agent's files.

---

## 3. Parallelism and cost rules (amends AGENTS.md §6.4 for this plan only)

1. One implementer per worktree; many worktrees at once. The controller creates them with `superpowers:using-git-worktrees` off the current `landing-v2` tip.
2. Max **8 concurrent implementers** (Wave 2). Reviewers for finished tasks may run while other implementers are still working.
3. Model choice is fixed by the tier column. Upgrade one tier only on `BLOCKED` caused by difficulty, never by default.
4. Controller merges task branches into `landing-v2` with `--no-ff` in wave order after both reviews pass. Merge conflicts mean an ownership rule was broken: send back to the implementer, do not hand-fix.
5. Subagents receive the full task text below, plus spec §2.1, §4, §5 and the AGENTS.md rules quoted in §6 — never just a file pointer.
6. Light-tier prompts stay short: task text + file list + commands. Do not paste the whole spec into Haiku prompts; paste only the rows they need.

---

## 4. Tasks (full text — paste verbatim into the implementer prompt)

Every task: TDD where there is logic, `npm run lint && npm run typecheck && npm test` green, screenshots at 390 px and 1280 px for anything visual, commit `type(landing): summary` on the task branch. No arbitrary Tailwind values: add tokens in Wave 1 instead. All copy from `src/config/landing.ts` / `brand.ts`. Locked vocabulary everywhere.

### T-100 — Landing tokens and fonts · Tier H · Wave 1
**Owns:** `app/globals.css` (new `.landing-scope` block only), `app/layout.tsx` (font loading only), `tests/unit/tokens.test.ts`.
**Do:**
1. Add the tokens in spec §5 inside `.landing-scope { … }` plus a `@theme` extension so Tailwind utilities exist (`text-wordmark`, `rounded-card-lg`, `shadow-soft`, `bg-ink-1`, `font-serif`, `font-mono`, etc.).
2. Load IBM Plex Serif (italic 500) and IBM Plex Mono (400/500) with `next/font/google`, `display: swap`, exposed as CSS variables (D1). Add `--accent: var(--indigo-600)` (D2).
3. Add utility classes: `.lv-heading-pair` (sans line + serif italic line), `.lv-mask-x` / `.lv-mask-y` (edge-fade masks), `.lv-glass` (nav glass).
4. Global `@media (prefers-reduced-motion: reduce)` rule for `.landing-scope` that disables keyframe animations.
**Accept:** existing app screens render unchanged (screenshot `/seeker/dashboard` before/after); a test page using every new utility renders; typecheck clean.

### T-110 — Motion stack · Tier H · Wave 1
**Owns:** `package.json` / lockfile (adding `gsap`, `lenis` only), `components/motion/{SmoothScroll.tsx,gsap.ts,useInView.ts,usePrefersReducedMotion.ts,Reveal.tsx,Stagger.tsx,Marquee.tsx,useAutoplay.ts,Odometer.tsx,TypeLoop.tsx,index.ts}` + tests, decision record `docs/superpowers/specs/2026-10-15-motion-libraries-decision.md`.
**Do:**
- Install `gsap` and `lenis` (D5); write the decision record (why, bundle cost, framer-motion removal condition).
- `gsap.ts` — registers ScrollTrigger once, client-only; exports `useGsap(scope, fn)` that uses `gsap.context()` and reverts on unmount.
- `<SmoothScroll>` — Lenis driving ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)` on the GSAP ticker); disabled under reduced motion and on touch devices.
- `useInView(ref, {once, amount})`, `usePrefersReducedMotion()`.
- `<Reveal y blur delay>` / `<Stagger step>` — ScrollTrigger fade-up / blur-in, once.
- `<Marquee speed direction pauseOnHover axis="x|y">` — CSS keyframes (cheaper than GSAP for infinite loops); duplicate set `aria-hidden`; pauses off-screen.
- `useAutoplay({count, interval, paused})` → `{index, progress, next, prev, goTo}`; pauses when the tab is hidden or the element is off-screen.
- `<Odometer value from duration format="en-IN">` — per-digit roll via GSAP; reduced motion shows the final value; `aria-live="polite"` announces the final value only.
- `<TypeLoop phrases speed>`.
**Accept:** unit tests for autoplay, odometer final text, reduced-motion fallbacks; demo page `app/(public)/_lab/motion/page.tsx` (deleted in T-1000); gsap + lenis added JS reported (target < 45 KB gz).

### T-120 — Content config · Tier L · Wave 1
**Owns:** `src/config/landing.ts`, `src/config/landing.test.ts`.
**Do:** Export typed `as const` objects: `nav` (links + dropdown items with number, name, one-liner, href), `wordmark`, `heroSlides[]` (id, label, title, imageKey, href), `logos[]`, `featureCards[]` (title, body, cta, imageKey, mockKey), `bento` (heading pair, sub, feed rows {label, detail, tone}, stats {value, label}, cells), `counter` ({statement, value, from, caption, placeholder: true}), `faq[]`, `footer` (heading pair, sub, columns). Draft copy for GetNudgd using spec §3 and the locked vocabulary; numbers (48h, tranches) must say "placeholder" in a comment since business numbers belong to `app_config`.
**Accept:** test asserts no forbidden words (`referral`, `refer `, `payout`, `coins`, `Referly`) appear in any string; types compile.

### T-130 — Stock photos and logos · Tier L · Wave 1
**Owns:** `public/landing/**`, `public/landing/CREDITS.md`, `src/config/landing-assets.ts`.
**Do (two steps, founder gate in between):**
1. **Shortlist only, no downloads.** For every `imageKey` from T-120 (controller supplies the list) propose 2 Unsplash/Pexels photos: page URL, photographer, licence, why it fits (D3). For every logo in `landing.logos` propose an official press-kit or Wikimedia Commons SVG URL (D7). Report the shortlist and stop with `NEEDS_CONTEXT`.
2. After the controller relays the founder's picks: download, convert photos to AVIF + WebP at 1600 w and 800 w (each < 200 KB), prepare SVG logos, write `CREDITS.md`, and write the manifest (key → path, width, height, alt text, credit).
**Accept:** every key resolves to a file; alt text and credit for each; total `public/landing` < 3 MB.

### T-200 — Nav · Tier S · Wave 2
**Owns:** `components/landing/Nav/**`.
**Do:** S1 exactly: 60 px sticky glass bar; logo (`components/Logo.tsx`); centred links from `nav`; `How it works ▾` opens a mega-dropdown on hover **and** click/Enter (numbered list, name + one-liner, fade + 8 px slide, closes on Esc/outside click); right "Get vouched in ↗" pill linking to `/login` (D10). In-page anchor links scroll through Lenis. Mobile < 768 px: hamburger → full-screen drawer with focus trap, body scroll lock.
**Accept:** RTL tests for keyboard open/close and Esc; screenshots open/closed at 390/1280.

### T-300 — Wordmark + hero carousel · Tier H · Wave 2
**Owns:** `components/landing/Hero/**`.
**Do:** S2: wordmark at `--fs-wordmark`, single line on desktop, blur-in on load. S3: full-bleed dark carousel ~80 vh (min 520, max 820) using `useAutoplay` (5 s): crossfade + scale 1.04→1 on the image layer; caption bottom-left (label + H2 `--fs-display` white) that slides up per slide; dot pagination; bottom thumbnail strip (numbered "01 …" cards, glass) with progress bar on the active thumb; prev/next round buttons; pause on hover/focus; pause/play button for a11y; ←/→ keys when focused; swipe on touch. Primary CTA in the caption: "Get vouched in" → `/login` (D10). Image layer gets a subtle GSAP ScrollTrigger parallax as the section scrolls out. Slide 1 image `priority`, others lazy; no CLS.
**Accept:** tests for autoplay advance, pause on hover, keyboard nav, reduced-motion = no autoplay; screenshots; Lighthouse LCP element is slide 1 image.

### T-400 — Logo marquee · Tier L · Wave 2
**Owns:** `components/landing/Logos/**`.
**Do:** S4: centred 24 px line, then `<Marquee>` of `logos` (grayscale, 0.6 opacity → 1 on hover) with `.lv-mask-x`. Real grayscale logos from the T-130 manifest, caption "Insiders work at", and the D7 disclaimer in small muted text under the strip.
**Accept:** screenshots; duplicate set is `aria-hidden`.

### T-500 — Feature cards · Tier S · Wave 2
**Owns:** `components/landing/Features/**`.
**Do:** S5: header (H2 + paragraph + black pill CTA). Grid 1/2/3 columns (390/768/1024+). Card: radius `--r-card-lg`, aspect ~4:5, background image, UI mock floating in upper half, bottom gradient to `--lv-ink-1`, title 24 px, 3-line clamp body, white "Explore" pill. Hover: image scale 1.03, mock translateY −6 px. `<Stagger>` reveal. "View more" reveals remaining cards (client state) if > 6.
**Accept:** screenshots at 3 widths; keyboard focus ring visible on card CTA.

### T-600 — Dark bento · Tier H · Wave 2
**Owns:** `components/landing/Bento/**`.
**Do:** S6 on `--lv-ink-1`: centred heading pair (sans + serif italic), sub. Bordered grid (`--lv-line-dark`), 3 cols desktop / 1 col mobile:
(a) **Live feed** — vertical `<Marquee axis="y">` of feed rows (icon tile tinted by tone, mono uppercase label, muted detail) with `.lv-mask-y`;
(b) **Stats** — three chips whose values count up via `<Odometer>` on view;
(c) **Logo chip** — GetNudgd mark on a 3D-ish tile (CSS gradients + inner shadow) with 4–6 SVG circuit traces; a light dot travels along each path (`offset-path` or SVG `animateMotion`), staggered;
(d) **Ask anything** — input-styled box with `<TypeLoop>` placeholders ("Find an Insider at Razorpay…");
(e) **Built to evolve** — text cell with subtle animated gradient border.
All loops pause off-screen and under reduced motion.
**Accept:** screenshots; CPU check: no animation running when section off-screen (Performance panel note in report).

### T-700 — Counter · Tier S · Wave 2
**Owns:** `components/landing/Counter/**`.
**Do:** S7: statement (32 px, max 613 px) then `<Odometer>` in IBM Plex Serif at `--fs-counter`, `en-IN` grouping, from `counter.from` to `counter.value` on view; caption below. Must not overflow at 390 px (font scales with clamp).
**Accept:** screenshots at 390/1280; test that final rendered text equals formatted value.

### T-800 — FAQ · Tier S · Wave 2
**Owns:** `components/landing/Faq/**`.
**Do:** S8 two-column (stacks on mobile). Left: heading pair, sub, "Still have questions?" card (avatar stack of 3 initials-circles + "You" pill, black CTA → `mailto:` or WhatsApp link from brand). Right: accordion from `faq`; first open; `button[aria-expanded]` + `aria-controls`; height animation; `+` rotates 45°. Emit FAQPage JSON-LD.
**Accept:** RTL tests for toggle + aria; JSON-LD validates.

### T-900 — Footer · Tier L · Wave 2
**Owns:** `components/landing/Footer/**`.
**Do:** S9 on dark scene image with overlay; heading pair at `--fs-display` ("*Your next role* / Starts here."); sub; primary "Get vouched in" button → `/login` (D10); background photo gets GSAP parallax; three link columns from `footer`; social links from `brand.social`; giant cropped "GetNudgd" wordmark at the bottom with top-to-bottom fade, `<Reveal y>` on view; copyright line.
**Accept:** screenshots; existing `Footer.test.tsx` expectations ported.

### T-1000 — Assembly and swap · Tier S · Wave 3
**Owns:** `app/(public)/page.tsx`, `components/landing/index.ts`, deletion of superseded components, metadata.
**Do:** Compose S1–S9 inside `<div className="landing-scope">`. Update metadata/OG image from brand. Delete `_lab` page and landing components no longer imported (`Hero`, `MarqueeTicker`, `SocialProof`, `HowItWorks`, `CompanyLogos`, `CtaBand`, old `Nav`/`Footer` if unused elsewhere — grep first; keep `WaitlistForm` — no longer used on the landing, D10). Wrap the page in `<SmoothScroll>`. Remove `framer-motion` from `package.json` if nothing imports it (D5). Delete tests that covered deleted components only.
**Accept:** `npm run build` succeeds; no unused exports; page renders top to bottom at 390/1280/1440.

### T-1100 — QA · Tier S · Wave 4
**Owns:** `tests/e2e/landing.spec.ts`, report in `docs/superpowers/plans/2026-10-15-landing-v2-qa.md`.
**Do:** Playwright: page loads, nav dropdown opens, carousel advances, FAQ toggles, every primary CTA points to `/login`. Screenshots at 390/768/1280/1440 in light conditions. Lighthouse mobile (perf ≥ 85, a11y ≥ 95, CLS < 0.05). axe scan zero serious issues. Reduced-motion run. Side-by-side screenshot comparison with redrob.io per section, listing visual gaps.
**Accept:** report with numbers; each gap becomes a fix task `T-11xx` (tier chosen by the controller) or a noted follow-up.

---

## 5. Review loop per task

```
implementer (tier per task)
   └─ DONE → T-R1 spec review (Sonnet for L-tier tasks, Opus otherwise) ── NOT_COMPLIANT → back to implementer
                └─ SPEC_COMPLIANT → T-R2 code-quality review (Opus) ── CHANGES_REQUESTED → back
                                       └─ APPROVED → controller merges into landing-v2
```
Use the prompt templates in AGENTS.md §6.5–6.7 unchanged, adding the "Owns" list so reviewers can flag edits outside it.

## 6. Rules to paste into every implementer prompt

AGENTS.md Part 2 rules 1, 9–13; Part 4 §4.3 (tokens only, mobile-first 390 px, reduced motion) as amended by spec §5; §4.6 accessibility line; §4.8 definition of done; the locked vocabulary table (§0.4).

## 7. Estimated cost profile

| Tier | Tasks | Share of implementer tokens (rough) |
|---|---|---|
| H | T-100, T-110, T-300, T-600 (+ T-R2, T-R3) | ~50 % |
| S | T-200, T-500, T-700, T-800, T-1000, T-1100 | ~40 % |
| L | T-120, T-130, T-400, T-900 | ~10 % |
