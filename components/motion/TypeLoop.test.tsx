import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { TypeLoop } from "./TypeLoop";
import { MockIntersectionObserver, installIntersectionObserver, installMatchMedia } from "./testUtils";

const phrases = ["Product Manager at Swiggy", "SDE-2 at Razorpay"];

describe("TypeLoop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the first phrase statically under reduced motion", () => {
    installMatchMedia({ reduced: true });
    const { container } = render(<TypeLoop phrases={phrases} speed={10} pause={100} />);
    act(() => MockIntersectionObserver.triggerAll(true));
    const animated = container.querySelector("[data-typeloop-text]");
    expect(animated).toHaveTextContent(phrases[0]);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(animated).toHaveTextContent(phrases[0]);
  });

  it("hides the animated text and exposes a static label", () => {
    const { container } = render(<TypeLoop phrases={phrases} label="Search roles" />);
    expect(container.querySelector("[data-typeloop-text]")?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByText("Search roles")).toBeInTheDocument();
  });

  it("erases and types the next phrase when in view", () => {
    const { container } = render(
      <TypeLoop phrases={phrases} speed={10} eraseSpeed={5} pause={100} />,
    );
    act(() => MockIntersectionObserver.triggerAll(true));
    const animated = container.querySelector("[data-typeloop-text]");
    expect(animated).toHaveTextContent(phrases[0]);
    // pause, then erase phrase 1 halfway
    act(() => {
      vi.advanceTimersByTime(100 + 5 * 10);
    });
    expect(animated?.textContent?.length).toBeLessThan(phrases[0].length);
    // finish erasing, type phrase 2
    act(() => {
      vi.advanceTimersByTime((phrases[0].length - 10) * 5 + phrases[1].length * 10 + 10);
    });
    expect(animated?.textContent).toBe(phrases[1]);
  });

  it("reserves space for every phrase so typing causes no layout shift", () => {
    const { container } = render(<TypeLoop phrases={phrases} />);
    const ghosts = [...container.querySelectorAll("[data-typeloop-ghost]")].map((g) => g.textContent);
    expect(ghosts).toEqual(phrases);
    for (const g of container.querySelectorAll("[data-typeloop-ghost]")) {
      expect(g.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it("restarts from the new first phrase when the phrase content changes", () => {
    const { container, rerender } = render(
      <TypeLoop phrases={phrases} speed={10} eraseSpeed={5} pause={100} />,
    );
    act(() => MockIntersectionObserver.triggerAll(true));
    act(() => {
      vi.advanceTimersByTime(100 + 5 * 10);
    });
    const next = ["Analyst at Zerodha", "PM at Meesho"];
    rerender(<TypeLoop phrases={next} speed={10} eraseSpeed={5} pause={100} />);
    const animated = container.querySelector("[data-typeloop-text]");
    expect(animated?.textContent).toBe(next[0]);
    act(() => {
      vi.advanceTimersByTime(90);
    });
    expect(animated?.textContent).toBe(next[0]);
  });
});
