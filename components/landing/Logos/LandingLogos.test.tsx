import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { logos } from "@/src/config/landing";
import { logos as logoAssets } from "@/src/config/landing-assets";
import {
  installIntersectionObserver,
  installMatchMedia,
  installResizeObserver,
} from "@/components/motion/testUtils";
import { LandingLogos } from "./LandingLogos";

const svgItems = logos.items.filter((item) => logoAssets[item.logoKey].type === "svg");
const textItems = logos.items.filter((item) => logoAssets[item.logoKey].type === "text");

function firstCopy(container: HTMLElement): HTMLElement {
  const group = container.querySelector<HTMLElement>("[data-marquee-group]:not([aria-hidden])");
  if (!group) throw new Error("first marquee copy not found");
  return group;
}

describe("LandingLogos", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installResizeObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the heading and disclaimer from config", () => {
    render(<LandingLogos />);
    expect(screen.getByRole("heading", { level: 2, name: logos.heading })).toBeInTheDocument();
    expect(screen.getByText(logos.disclaimer)).toBeInTheDocument();
  });

  it("renders each svg logo as an img whose alt is the company name", () => {
    const { container } = render(<LandingLogos />);
    const group = firstCopy(container);
    expect(svgItems).toHaveLength(4);
    for (const item of svgItems) {
      const asset = logoAssets[item.logoKey];
      if (asset.type !== "svg") throw new Error("expected svg asset");
      const img = within(group).getByRole("img", { name: item.name });
      expect(img.tagName).toBe("IMG");
      expect(img.getAttribute("src")).toBe(asset.src);
      expect(img.getAttribute("height")).toBe("28");
    }
  });

  it("renders each text logo as a text wordmark, not an image", () => {
    const { container } = render(<LandingLogos />);
    const group = firstCopy(container);
    expect(textItems).toHaveLength(6);
    for (const item of textItems) {
      const node = within(group).getByText(item.name);
      expect(node.tagName).not.toBe("IMG");
      expect(within(group).queryByRole("img", { name: item.name })).toBeNull();
    }
  });

  it("renders one list item per company in the first copy", () => {
    const { container } = render(<LandingLogos />);
    const group = firstCopy(container);
    expect(within(group).getAllByRole("listitem")).toHaveLength(logos.items.length);
  });

  it("marks duplicate marquee copies as aria-hidden", () => {
    const { container } = render(<LandingLogos />);
    const hidden = container.querySelectorAll('[data-marquee-group][aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThanOrEqual(1);
  });

  it("flags the section as placeholder content", () => {
    const { container } = render(<LandingLogos />);
    expect(container.querySelector('section[data-placeholder="true"]')).not.toBeNull();
  });
});
