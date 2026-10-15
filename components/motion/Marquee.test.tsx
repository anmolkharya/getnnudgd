import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Marquee } from "./Marquee";
import { MockIntersectionObserver, installIntersectionObserver, installMatchMedia } from "./testUtils";

describe("Marquee", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("duplicates children once and hides the duplicate from assistive tech", () => {
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
    expect(screen.getAllByText("Acme")).toHaveLength(2);
  });

  it("pauses while off-screen", () => {
    const { container } = render(
      <Marquee>
        <span>Acme</span>
      </Marquee>,
    );
    const root = container.querySelector("[data-marquee]");
    act(() => MockIntersectionObserver.triggerAll(true));
    expect(root).toHaveAttribute("data-running", "true");
    act(() => MockIntersectionObserver.triggerAll(false));
    expect(root).toHaveAttribute("data-running", "false");
  });

  it("does not run and drops the duplicate under reduced motion", () => {
    installMatchMedia({ reduced: true });
    const { container } = render(
      <Marquee axis="y">
        <span>Acme</span>
      </Marquee>,
    );
    act(() => MockIntersectionObserver.triggerAll(true));
    expect(container.querySelector("[data-marquee]")).toHaveAttribute("data-running", "false");
    expect(container.querySelectorAll("[data-marquee-group]")).toHaveLength(1);
  });
});
