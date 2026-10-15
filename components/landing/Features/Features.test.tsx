import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LandingFeatures } from "./Features";
import { features } from "@/src/config/landing";
import { mocks, photos } from "@/src/config/landing-assets";
import { installIntersectionObserver, installMatchMedia } from "@/components/motion/testUtils";

describe("LandingFeatures", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is the how-it-works section with heading, sub and route CTA from config", () => {
    const { container } = render(<LandingFeatures />);
    expect(container.querySelector("section")?.id).toBe("how-it-works");
    expect(screen.getByRole("heading", { level: 2, name: features.heading })).toBeTruthy();
    expect(screen.getByText(features.sub)).toBeTruthy();
    const cta = screen.getByRole("link", { name: features.cta.label });
    expect(cta.getAttribute("href")).toBe(features.cta.href);
  });

  it("renders five cards with ids from their CTA anchors", () => {
    const { container } = render(<LandingFeatures />);
    const articles = container.querySelectorAll("article");
    expect(articles).toHaveLength(5);
    expect([...articles].map((a) => a.id)).toEqual(["resume", "insiders", "requests", "rewards", "whatsapp"]);
  });

  it("renders lazy photo and mock with manifest alt text, and CTA with title", () => {
    const { container } = render(<LandingFeatures />);
    const articles = container.querySelectorAll("article");
    features.cards.forEach((card, i) => {
      const el = articles[i] as HTMLElement;
      const photo = photos[card.imageKey];
      const imgs = el.querySelectorAll("img");
      expect(el.querySelector("picture")).toBeTruthy();
      const bg = imgs[0];
      expect(bg.getAttribute("alt")).toBe(photo.alt);
      expect(bg.getAttribute("loading")).toBe("lazy");
      const mock = mocks[card.mockKey];
      const mockImg = el.querySelector(`img[src="${mock.src}"]`);
      expect(mockImg?.getAttribute("alt")).toBe(mock.alt);
      expect(mockImg?.getAttribute("loading")).toBe("lazy");
      const link = within(el).getByRole("link", { name: `${card.cta.label} ${card.title}` });
      expect(link.getAttribute("href")).toBe(card.cta.href);
      expect(within(el).getByRole("heading", { level: 3, name: card.title })).toBeTruthy();
      expect(within(el).getByText(card.body)).toBeTruthy();
    });
  });
});
