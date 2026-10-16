import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingFooter } from "./LandingFooter";
import { footer } from "@/src/config/landing";
import { photos } from "@/src/config/landing-assets";
import { brand } from "@/src/config/brand";
import { installIntersectionObserver, installMatchMedia } from "@/components/motion/testUtils";

describe("LandingFooter", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the two-line heading with the serif line first", () => {
    const { container } = render(<LandingFooter />);
    const heading = screen.getByRole("heading", { level: 2 });
    const serif = heading.querySelector("em");
    expect(serif).not.toBeNull();
    expect(serif).toHaveTextContent(footer.headingSerif);
    expect(serif).toHaveClass("font-serif", "italic", "font-medium");
    const sans = heading.querySelector("span");
    expect(sans).toHaveTextContent(footer.headingSans);
    expect(heading.firstElementChild).toBe(serif);
    expect(container.querySelector(".lv-heading-pair")).toBeNull();
  });

  it("renders the sub copy and a primary CTA to /login", () => {
    render(<LandingFooter />);
    expect(screen.getByText(footer.sub)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: footer.cta.label });
    expect(cta).toHaveAttribute("href", "/login");
    expect(cta).toHaveClass("rounded-full", "bg-accent", "text-white");
  });

  it("renders every footer column with its links and correct targets", () => {
    render(<LandingFooter />);
    for (const column of footer.columns) {
      expect(screen.getByRole("heading", { level: 3, name: column.title })).toBeInTheDocument();
      for (const link of column.links) {
        const el = screen.getByRole("link", { name: link.label });
        expect(el).toHaveAttribute("href", link.href);
        if (link.target === "external") {
          expect(el).toHaveAttribute("target", "_blank");
          expect(el.getAttribute("rel") ?? "").toContain("noopener");
          expect(el.getAttribute("rel") ?? "").toContain("noreferrer");
        } else {
          expect(el).not.toHaveAttribute("target");
        }
      }
    }
  });

  it("sizes the giant wordmark to fit the page width instead of cropping it", () => {
    const css = readFileSync(path.resolve(__dirname, "LandingFooter.module.css"), "utf8");
    const rule = css.slice(css.indexOf(".wordmark {"), css.indexOf("}", css.indexOf(".wordmark {")));
    // Width-based size, so the whole word fits at every viewport.
    expect(rule).toMatch(/font-size: calc\(\(min\(100vw, var\(--lv-container\)\)/);
    // No shifting it below the footer edge and no mask that hides the letters.
    expect(rule).not.toMatch(/translate/);
    expect(rule).not.toMatch(/mask-image/);
    // Space for the tail of the g.
    expect(rule).toMatch(/padding-bottom/);
    // Positioned, so it is not painted underneath the photo layer.
    expect(rule).toMatch(/position: relative/);
  });

  it("renders the giant wordmark as aria-hidden", () => {
    const { container } = render(<LandingFooter />);
    const wordmark = Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"]')).find(
      (el) => el.textContent?.trim() === footer.wordmark,
    );
    expect(wordmark).toBeDefined();
    expect(wordmark).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the footer-scene photo alt text from the manifest", () => {
    render(<LandingFooter />);
    expect(screen.getByAltText(photos["footer-scene"].alt)).toBeInTheDocument();
  });

  it("renders a copyright line containing the brand name", () => {
    render(<LandingFooter />);
    const year = String(new Date().getFullYear());
    const copyright = screen.getByText(new RegExp(`©\\s*${year}\\s*${brand.name}`));
    expect(copyright).toBeInTheDocument();
    expect(screen.getByText(brand.domain, { exact: false })).toBeInTheDocument();
  });

  it("renders without error under reduced motion", () => {
    installMatchMedia({ reduced: true });
    render(<LandingFooter />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
