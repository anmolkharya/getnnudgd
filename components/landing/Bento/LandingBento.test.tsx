import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { bento } from "@/src/config/landing";
import { brand } from "@/src/config/brand";
import {
  MockIntersectionObserver,
  installIntersectionObserver,
  installMatchMedia,
  installResizeObserver,
} from "@/components/motion/testUtils";
import { LandingBento } from "./index";

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

describe("LandingBento", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installResizeObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the heading pair and sub from config on a dark surface", () => {
    const { container } = render(<LandingBento />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("lv-heading-pair");
    expect(heading.querySelector("span")).toHaveTextContent(bento.headingSans);
    expect(heading.querySelector("em")).toHaveTextContent(bento.headingSerif);
    expect(screen.getByText(bento.sub)).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("lv-dark");
  });

  it("renders every cell title and body from config", () => {
    render(<LandingBento />);
    for (const cell of [bento.liveFeed, bento.stats, bento.chip, bento.purposeBuilt, bento.evolve]) {
      expect(screen.getByRole("heading", { level: 3, name: cell.title })).toBeInTheDocument();
      expect(screen.getByText(cell.body)).toBeInTheDocument();
    }
  });

  it("renders feed rows with label and detail inside a labelled vertical marquee", () => {
    render(<LandingBento />);
    const feed = screen.getByRole("group", { name: bento.liveFeed.title });
    for (const row of bento.liveFeed.rows) {
      expect(within(feed).getAllByText(row.label).length).toBeGreaterThan(0);
      expect(within(feed).getAllByText(row.detail).length).toBeGreaterThan(0);
    }
  });

  it("gives stat odometers accessible final text (compact + suffix)", () => {
    render(<LandingBento />);
    for (const item of bento.stats.items) {
      expect(screen.getByText(compact.format(item.value) + item.suffix)).toBeInTheDocument();
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it("exposes the purpose-built phrases as accessible text", () => {
    render(<LandingBento />);
    const box = screen.getByRole("img", { name: new RegExp(bento.purposeBuilt.phrases[0].slice(0, 20)) });
    for (const phrase of bento.purposeBuilt.phrases) {
      expect(box.getAttribute("aria-label")).toContain(phrase);
    }
  });

  it("marks the placeholder feed and stats cells", () => {
    const { container } = render(<LandingBento />);
    const marked = container.querySelectorAll("[data-placeholder]");
    expect(marked).toHaveLength(2);
    expect(marked[0]).toHaveTextContent(bento.liveFeed.title);
    expect(marked[1]).toHaveTextContent(bento.stats.title);
  });

  it("names the chip mark after the brand", () => {
    render(<LandingBento />);
    expect(screen.getByRole("img", { name: brand.name })).toBeInTheDocument();
  });

  it("animates circuit dots when motion is allowed and pauses them off-screen", () => {
    const { container } = render(<LandingBento />);
    const svg = container.querySelector("[data-circuit]");
    expect(svg).not.toBeNull();
    expect(svg?.querySelectorAll("animateMotion").length).toBe(6);
    expect(svg).toHaveAttribute("data-running", "false");
    act(() => MockIntersectionObserver.triggerAll(true));
    expect(svg).toHaveAttribute("data-running", "true");
    act(() => MockIntersectionObserver.triggerAll(false));
    expect(svg).toHaveAttribute("data-running", "false");
  });

  it("renders everything static under reduced motion", () => {
    installMatchMedia({ reduced: true });
    const { container } = render(<LandingBento />);
    act(() => MockIntersectionObserver.triggerAll(true));
    const svg = container.querySelector("[data-circuit]");
    expect(svg?.querySelectorAll("animateMotion").length).toBe(0);
    expect(svg?.querySelectorAll("circle").length).toBe(6);
    expect(container.querySelector("[data-marquee]")).toHaveAttribute("data-reduced", "true");
    expect(container.querySelector("[data-evolve]")).toHaveAttribute("data-running", "false");
    expect(container.querySelector("[data-typeloop-text]")).toHaveTextContent(bento.purposeBuilt.phrases[0]);
  });
});
