import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { LandingHero } from "./LandingHero";
import { heroSlides, wordmark } from "@/src/config/landing";
import { brand } from "@/src/config/brand";
import { MockIntersectionObserver, installIntersectionObserver, installMatchMedia } from "@/components/motion/testUtils";

function slides(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-hero-slide]"));
}

function visibleSlideIndex(): number {
  return slides().findIndex((s) => s.getAttribute("aria-hidden") !== "true");
}

function carousel(): HTMLElement {
  return screen.getByRole("region", { name: `How ${brand.name} works` });
}

function renderInView() {
  const utils = render(<LandingHero />);
  act(() => MockIntersectionObserver.triggerAll(true));
  return utils;
}

describe("LandingHero", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the wordmark h1 from config", () => {
    render(<LandingHero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(wordmark.text);
  });

  it("renders a labelled carousel with one slide per config entry, only the active one exposed", () => {
    render(<LandingHero />);
    const root = carousel();
    expect(root).toHaveAttribute("aria-roledescription", "carousel");
    expect(slides()).toHaveLength(heroSlides.length);
    expect(heroSlides).toHaveLength(6);
    const exposed = slides().filter((s) => s.getAttribute("aria-hidden") !== "true");
    expect(exposed).toHaveLength(1);
    expect(visibleSlideIndex()).toBe(0);
    for (const s of slides().slice(1)) expect(s).toHaveAttribute("inert");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(heroSlides[0].title);
  });

  it("auto-advances after 5000ms when in view", () => {
    renderInView();
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(visibleSlideIndex()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(visibleSlideIndex()).toBe(1);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(heroSlides[1].title);
  });

  it("pauses on hover", () => {
    renderInView();
    fireEvent.pointerEnter(carousel());
    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(visibleSlideIndex()).toBe(0);
    fireEvent.pointerLeave(carousel());
    act(() => {
      vi.advanceTimersByTime(5001);
    });
    expect(visibleSlideIndex()).toBe(1);
  });

  it("toggles with the pause button (fixed name, aria-pressed state)", () => {
    renderInView();
    const pause = screen.getByRole("button", { name: "Pause slideshow" });
    expect(pause).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pause);
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Play slideshow" })).toBeNull();
    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(visibleSlideIndex()).toBe(0);
    fireEvent.click(pause);
    expect(pause).toHaveAttribute("aria-pressed", "false");
    act(() => {
      vi.advanceTimersByTime(5001);
    });
    expect(visibleSlideIndex()).toBe(1);
  });

  it("jumps to a slide from its thumbnail", () => {
    render(<LandingHero />);
    const thumb = screen.getByRole("button", { name: `Go to slide 4: ${heroSlides[3].label}` });
    fireEvent.click(thumb);
    expect(visibleSlideIndex()).toBe(3);
    expect(thumb).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: `Go to slide 1: ${heroSlides[0].label}` })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("navigates with prev/next buttons and arrow keys", () => {
    render(<LandingHero />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(visibleSlideIndex()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(visibleSlideIndex()).toBe(0);
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(visibleSlideIndex()).toBe(1);
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(visibleSlideIndex()).toBe(5);
  });

  it("swipes with a horizontal touch drag", () => {
    render(<LandingHero />);
    const root = carousel();
    const touch = { pointerType: "touch" };
    fireEvent.pointerDown(root, { ...touch, clientX: 300, clientY: 100 });
    fireEvent.pointerUp(root, { ...touch, clientX: 200, clientY: 105 });
    expect(visibleSlideIndex()).toBe(1);
    fireEvent.pointerDown(root, { ...touch, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(root, { ...touch, clientX: 220, clientY: 100 });
    expect(visibleSlideIndex()).toBe(0);
    fireEvent.pointerDown(root, { ...touch, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(root, { ...touch, clientX: 120, clientY: 100 });
    expect(visibleSlideIndex()).toBe(0);
  });

  it("ignores mouse drags", () => {
    render(<LandingHero />);
    const root = carousel();
    fireEvent.pointerDown(root, { pointerType: "mouse", clientX: 300, clientY: 100 });
    fireEvent.pointerUp(root, { pointerType: "mouse", clientX: 100, clientY: 100 });
    expect(visibleSlideIndex()).toBe(0);
  });

  it("does not replay the caption entrance on first load, only on slide changes", () => {
    render(<LandingHero />);
    const inner = () => screen.getByTestId("hero-caption").firstElementChild;
    expect(inner()).not.toHaveAttribute("data-animate");
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(inner()).toHaveAttribute("data-animate", "true");
  });

  it("does not auto-advance under reduced motion", () => {
    installMatchMedia({ reduced: true });
    renderInView();
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(visibleSlideIndex()).toBe(0);
  });

  it("loads the first image eagerly with high priority and the rest lazily", () => {
    render(<LandingHero />);
    const imgs = slides().map((s) => s.querySelector("img"));
    expect(imgs).toHaveLength(6);
    expect(imgs[0]).toHaveAttribute("loading", "eager");
    expect(imgs[0]).toHaveAttribute("fetchpriority", "high");
    for (const img of imgs.slice(1)) {
      expect(img).toHaveAttribute("loading", "lazy");
      expect(img).not.toHaveAttribute("fetchpriority", "high");
    }
    const sources = slides()[0].querySelectorAll("source");
    expect(Array.from(sources).map((s) => s.getAttribute("type"))).toEqual(["image/avif", "image/webp"]);
  });

  it("links each slide CTA to its configured href with the right label", () => {
    render(<LandingHero />);
    heroSlides.forEach((slide, i) => {
      fireEvent.click(screen.getByRole("button", { name: `Go to slide ${i + 1}: ${slide.label}` }));
      const caption = screen.getByTestId("hero-caption");
      const link = within(caption).getByRole("link");
      expect(link).toHaveAttribute("href", slide.href);
      if (slide.href === "/login") expect(link).toHaveTextContent(brand.ctaGetVouched);
      if (slide.href === "/for-insiders") expect(link).toHaveTextContent("For Insiders");
    });
  });

  it("marks the caption live region polite only while not playing", () => {
    renderInView();
    const live = screen.getByTestId("hero-caption");
    expect(live).toHaveAttribute("aria-live", "off");
    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    expect(screen.getByTestId("hero-caption")).toHaveAttribute("aria-live", "polite");
  });
});
