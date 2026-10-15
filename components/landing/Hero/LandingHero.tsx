"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { AutoplayProgress, useAutoplay } from "@/components/motion";
import { brand } from "@/src/config/brand";
import { heroSlides, nav, wordmark, type HeroSlideConfig, type LinkTarget } from "@/src/config/landing";
import { photos } from "@/src/config/landing-assets";
import styles from "./Hero.module.css";

const INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;
const IMAGE_SIZES = "(min-width: 1280px) 1216px, (min-width: 1024px) calc(100vw - 64px), 100vw";

/** CTA label per slide: primary CTA for /login, the nav label for other routes. */
function ctaLabel(slide: HeroSlideConfig): string {
  if (slide.href === "/login") return brand.ctaGetVouched;
  const navLink = nav.links.find((l) => l.kind === "link" && l.href === slide.href);
  return navLink ? navLink.label : slide.label;
}

function SmartLink({
  href,
  target,
  className,
  children,
}: {
  href: string;
  target: LinkTarget;
  className: string;
  children: ReactNode;
}) {
  if (target === "route") {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  if (target === "external") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

const glassButton =
  "grid size-11 shrink-0 place-items-center rounded-full border border-line-dark bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      {children}
    </svg>
  );
}

/**
 * Hero (sections S2 + S3): the one-line wordmark and the full-bleed
 * auto-advancing carousel of how the product works.
 */
export function LandingHero() {
  const rootRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [userPaused, setUserPaused] = useState(false);

  const { index, isPlaying, interval, cycle, next, prev, goTo, pause, resume, setHovered, setFocused } =
    useAutoplay({ count: heroSlides.length, interval: INTERVAL_MS, ref: rootRef });

  const active = heroSlides[index];

  // Keep the active thumbnail visible when the strip scrolls (narrow screens).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const strip = stripRef.current;
    if (!strip || strip.scrollWidth <= strip.clientWidth || typeof strip.scrollTo !== "function") return;
    const thumb = strip.children[index];
    if (!(thumb instanceof HTMLElement)) return;
    strip.scrollTo({ left: thumb.offsetLeft - strip.offsetLeft, behavior: "smooth" });
  }, [index]);

  const togglePlay = () => {
    if (userPaused) {
      setUserPaused(false);
      resume();
    } else {
      setUserPaused(true);
      pause();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) <= SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <>
      <div className="lv-container pt-10 pb-8 md:pt-16">
        <h1 className={`${styles.wordmark} text-wordmark font-heading font-medium text-ink-1 lg:whitespace-nowrap`}>
          {wordmark.text}
        </h1>
      </div>

      <div className="lv-container max-lg:max-w-none max-lg:px-0">
        <section
          ref={rootRef}
          aria-roledescription="carousel"
          aria-label={`How ${brand.name} works`}
          className={`${styles.frame} relative touch-pan-y overflow-hidden bg-ink-1 text-white lg:rounded-card-lg`}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => {
            setHovered(false);
            swipeStart.current = null;
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipeStart.current = null;
          }}
          onFocus={() => setFocused(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        >
          <div className="absolute inset-0">
            {heroSlides.map((slide, i) => {
              const photo = photos[slide.imageKey];
              const isActive = i === index;
              return (
                <div
                  key={slide.id}
                  id={slide.id}
                  data-hero-slide=""
                  data-active={isActive ? "true" : "false"}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${heroSlides.length}`}
                  aria-hidden={isActive ? undefined : true}
                  inert={!isActive}
                  className={`${styles.slide} absolute inset-0`}
                >
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={`${photo.avif[800]} 800w, ${photo.avif[1600]} 1600w`}
                      sizes={IMAGE_SIZES}
                    />
                    <source
                      type="image/webp"
                      srcSet={`${photo.webp[800]} 800w, ${photo.webp[1600]} 1600w`}
                      sizes={IMAGE_SIZES}
                    />
                    <img
                      src={photo.webp[1600]}
                      width={photo.width}
                      height={photo.height}
                      alt={photo.alt}
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : undefined}
                      decoding={i === 0 ? "sync" : "async"}
                      className="absolute inset-0 size-full object-cover"
                    />
                  </picture>
                </div>
              );
            })}
          </div>

          <div className={`${styles.scrim} pointer-events-none absolute inset-0`} aria-hidden="true" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 p-4 md:gap-8 md:p-8 lg:p-10">
            <div data-testid="hero-caption" aria-live={isPlaying ? "off" : "polite"} aria-atomic="true">
              <div key={`${active.id}-${cycle}`} className={`${styles.caption} flex max-w-2xl flex-col items-start gap-4`}>
                <p className="font-mono text-micro text-on-dark-1 uppercase">
                  {active.number} · {active.label}
                </p>
                <h2 className="text-display font-heading font-medium text-white">{active.title}</h2>
                <SmartLink
                  href={active.href}
                  target={active.target}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-ink-1 transition-colors hover:bg-accent hover:text-white"
                >
                  {ctaLabel(active)}
                  <Icon>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </Icon>
                </SmartLink>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div
                ref={stripRef}
                className={`${styles.strip} flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto md:gap-3`}
              >
                {heroSlides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}: ${slide.label}`}
                    aria-current={i === index ? "true" : undefined}
                    aria-controls={slide.id}
                    className="flex w-36 shrink-0 snap-start flex-col gap-3 rounded-xl border border-line-dark bg-white/10 p-3 text-left backdrop-blur-md transition-colors hover:bg-white/20 aria-[current=true]:bg-white/20 md:w-auto md:min-w-0 md:flex-1"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-micro text-on-dark-1">{slide.number}</span>
                      <span className="truncate text-sm font-medium text-white">{slide.label}</span>
                    </span>
                    <AutoplayProgress
                      index={i}
                      current={index}
                      interval={interval}
                      isPlaying={isPlaying}
                      cycle={cycle}
                      className="h-0.5 w-full rounded-full bg-white/20"
                      fillClassName="text-white"
                    />
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-pressed={userPaused}
                  aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                  className={glassButton}
                >
                  <Icon>
                    {userPaused ? <path d="M8 5v14l11-7z" fill="currentColor" /> : <path d="M9 5v14M15 5v14" />}
                  </Icon>
                </button>
                <button type="button" onClick={prev} aria-label="Previous slide" className={glassButton}>
                  <Icon>
                    <path d="M15 6l-6 6 6 6" />
                  </Icon>
                </button>
                <button type="button" onClick={next} aria-label="Next slide" className={glassButton}>
                  <Icon>
                    <path d="M9 6l6 6-6 6" />
                  </Icon>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
