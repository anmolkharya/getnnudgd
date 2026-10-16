import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { counter } from "@/src/config/landing";
import { installIntersectionObserver, installMatchMedia } from "@/components/motion/testUtils";
import { LandingCounter } from "./Counter";

describe("LandingCounter", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the statement as a heading and the caption from config", () => {
    render(<LandingCounter />);
    expect(screen.getByRole("heading", { name: counter.statement })).toBeInTheDocument();
    expect(screen.getByText(counter.caption)).toBeInTheDocument();
  });

  it("exposes the en-IN formatted number to assistive tech", () => {
    render(<LandingCounter />);
    expect(screen.getByText(new Intl.NumberFormat("en-IN").format(counter.value))).toBeInTheDocument();
  });

  it("marks the section as placeholder when config says so", () => {
    const { container } = render(<LandingCounter />);
    const root = container.querySelector("section");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-placeholder")).toBe(counter.placeholder ? "true" : null);
  });

  it("shows the final digits immediately under reduced motion", () => {
    installMatchMedia({ reduced: true });
    const { container } = render(<LandingCounter />);
    const finals = [...container.querySelectorAll<HTMLElement>("[data-odometer-column]")].map((c) => c.dataset.final);
    expect(finals.join("")).toBe(String(counter.value));
  });
});
