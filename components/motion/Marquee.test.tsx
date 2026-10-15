import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Marquee } from "./Marquee";
import {
  MockIntersectionObserver,
  MockResizeObserver,
  installIntersectionObserver,
  installMatchMedia,
  installResizeObserver,
  stubRects,
} from "./testUtils";

describe("Marquee", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installResizeObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders at least two copies and hides every duplicate from assistive tech", () => {
    const { container } = render(
      <Marquee>
        <span>Acme</span>
        <span>Globex</span>
      </Marquee>,
    );
    const groups = container.querySelectorAll("[data-marquee-group]");
    expect(groups).toHaveLength(2);
    expect(groups[0]).not.toHaveAttribute("aria-hidden");
    expect(groups[1]).toHaveAttribute("aria-hidden", "true");
    expect(groups[1]).toHaveAttribute("inert");
    expect(screen.getAllByText("Acme")).toHaveLength(2);
  });

  it("fills the viewport with enough copies and animates by one group's pixel extent", () => {
    stubRects((el) =>
      el.hasAttribute("data-marquee") ? { width: 1000, height: 40 } : el.hasAttribute("data-marquee-group") ? { width: 300, height: 40 } : { width: 0, height: 0 },
    );
    const { container } = render(
      <Marquee speed={50}>
        <span>Acme</span>
      </Marquee>,
    );
    act(() => MockResizeObserver.triggerAll());
    const root = container.querySelector<HTMLElement>("[data-marquee]");
    const groups = container.querySelectorAll("[data-marquee-group]");
    // max(2, ceil(1000 / 300) + 1) = 5
    expect(groups).toHaveLength(5);
    for (const g of [...groups].slice(1)) expect(g).toHaveAttribute("aria-hidden", "true");
    expect(groups[0]).not.toHaveAttribute("aria-hidden");
    expect(root?.style.getPropertyValue("--marquee-distance")).toBe("-300px");
    expect(root?.style.getPropertyValue("--marquee-duration")).toBe("6.00s");
  });

  it("uses height on the y axis", () => {
    stubRects((el) =>
      el.hasAttribute("data-marquee") ? { width: 300, height: 200 } : el.hasAttribute("data-marquee-group") ? { width: 300, height: 400 } : { width: 0, height: 0 },
    );
    const { container } = render(
      <Marquee axis="y" speed={20}>
        <span>Acme</span>
      </Marquee>,
    );
    act(() => MockResizeObserver.triggerAll());
    const root = container.querySelector<HTMLElement>("[data-marquee]");
    expect(container.querySelectorAll("[data-marquee-group]")).toHaveLength(2);
    expect(root?.style.getPropertyValue("--marquee-distance")).toBe("-400px");
    expect(root?.style.getPropertyValue("--marquee-duration")).toBe("20.00s");
  });

  it("pauses while off-screen or when the paused prop is set", () => {
    const { container, rerender } = render(
      <Marquee>
        <span>Acme</span>
      </Marquee>,
    );
    const root = container.querySelector("[data-marquee]");
    act(() => MockIntersectionObserver.triggerAll(true));
    expect(root).toHaveAttribute("data-running", "true");
    act(() => MockIntersectionObserver.triggerAll(false));
    expect(root).toHaveAttribute("data-running", "false");
    act(() => MockIntersectionObserver.triggerAll(true));
    rerender(
      <Marquee paused>
        <span>Acme</span>
      </Marquee>,
    );
    expect(root).toHaveAttribute("data-running", "false");
  });

  it("uses role=group when labelled", () => {
    render(
      <Marquee label="Companies">
        <span>Acme</span>
      </Marquee>,
    );
    expect(screen.getByRole("group", { name: "Companies" })).toBeInTheDocument();
  });

  it("under reduced motion: no animation, single copy, keyboard-scrollable x strip", () => {
    installMatchMedia({ reduced: true });
    const { container } = render(
      <Marquee>
        <span>Acme</span>
      </Marquee>,
    );
    act(() => MockIntersectionObserver.triggerAll(true));
    const root = container.querySelector("[data-marquee]");
    expect(root).toHaveAttribute("data-running", "false");
    expect(root).toHaveAttribute("tabindex", "0");
    expect(container.querySelectorAll("[data-marquee-group]")).toHaveLength(1);
  });
});
