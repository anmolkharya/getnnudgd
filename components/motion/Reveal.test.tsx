import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { Reveal } from "./Reveal";
import { Stagger } from "./Stagger";
import { MockIntersectionObserver, installIntersectionObserver, installMatchMedia } from "./testUtils";

describe("Reveal", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders content in its final state under reduced motion", () => {
    installMatchMedia({ reduced: true });
    render(<Reveal>Vouched by insiders</Reveal>);
    const el = screen.getByText("Vouched by insiders");
    expect(el).toHaveAttribute("data-reveal", "shown");
  });

  it("is armed until scrolled into view, then shown", () => {
    render(<Reveal as="section">Hello</Reveal>);
    const el = screen.getByText("Hello");
    expect(el.tagName).toBe("SECTION");
    expect(el).toHaveAttribute("data-reveal", "armed");
    act(() => MockIntersectionObserver.triggerAll(true));
    expect(el).toHaveAttribute("data-reveal", "shown");
    act(() => MockIntersectionObserver.triggerAll(false));
    expect(el).toHaveAttribute("data-reveal", "shown");
  });

  it("never hides eager content", () => {
    render(<Reveal eager>Above the fold</Reveal>);
    expect(screen.getByText("Above the fold")).toHaveAttribute("data-reveal", "shown");
    expect(renderToString(<Reveal eager>Above the fold</Reveal>)).toContain('data-reveal="shown"');
  });

  describe("hydration", () => {
    let root: Root | null = null;
    afterEach(() => {
      act(() => root?.unmount());
      root = null;
      Reflect.deleteProperty(document, "timeline");
      document.body.innerHTML = "";
    });

    function hydrateAt(currentTime: number): HTMLElement {
      Object.defineProperty(document, "timeline", { configurable: true, value: { currentTime } });
      const host = document.createElement("div");
      host.innerHTML = renderToString(<Reveal>Late</Reveal>);
      document.body.appendChild(host);
      expect(host.firstElementChild).toHaveAttribute("data-reveal", "ssr");
      act(() => {
        root = hydrateRoot(host, <Reveal>Late</Reveal>);
      });
      return host.firstElementChild as HTMLElement;
    }

    it("stays shown when the no-JS failsafe already fired before hydration", () => {
      expect(hydrateAt(3000)).toHaveAttribute("data-reveal", "shown");
    });

    it("arms normally when hydration beats the failsafe", () => {
      expect(hydrateAt(500)).toHaveAttribute("data-reveal", "armed");
    });
  });

  it("shows content when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Reveal>Fallback</Reveal>);
    expect(screen.getByText("Fallback")).toHaveAttribute("data-reveal", "shown");
  });
});

describe("Stagger", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds an incremental delay to each direct child reveal", () => {
    render(
      <Stagger step={0.1}>
        <Reveal delay={0.05}>One</Reveal>
        <Reveal delay={0.05}>Two</Reveal>
        <Reveal delay={0.05}>Three</Reveal>
      </Stagger>,
    );
    expect(screen.getByText("One").style.transitionDelay).toBe("50ms");
    expect(screen.getByText("Two").style.transitionDelay).toBe("150ms");
    expect(screen.getByText("Three").style.transitionDelay).toBe("250ms");
  });
});
