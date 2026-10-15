import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

const lenisMock = vi.hoisted(() => {
  const instances: Array<{
    options: Record<string, unknown>;
    on: ReturnType<typeof vi.fn>;
    raf: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    scrollTo: ReturnType<typeof vi.fn>;
  }> = [];
  class FakeLenis {
    options: Record<string, unknown>;
    on = vi.fn();
    raf = vi.fn();
    destroy = vi.fn();
    scrollTo = vi.fn();
    constructor(options: Record<string, unknown>) {
      this.options = options;
      instances.push(this);
    }
  }
  return { instances, FakeLenis };
});

vi.mock("lenis", () => ({ default: lenisMock.FakeLenis }));

import { SmoothScroll } from "./SmoothScroll";
import { useLenis, useSmoothScrollTo } from "./smoothScrollContext";
import { gsap } from "./gsap";
import { installMatchMedia } from "./testUtils";

describe("SmoothScroll", () => {
  beforeEach(() => {
    lenisMock.instances.length = 0;
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("drives Lenis from the GSAP ticker and cleans up on unmount", () => {
    const add = vi.spyOn(gsap.ticker, "add");
    const remove = vi.spyOn(gsap.ticker, "remove");
    const lag = vi.spyOn(gsap.ticker, "lagSmoothing");
    const { unmount } = render(
      <SmoothScroll anchorOffset={-100}>
        <p>page</p>
      </SmoothScroll>,
    );
    expect(lenisMock.instances).toHaveLength(1);
    const lenis = lenisMock.instances[0];
    expect(lenis.options).toMatchObject({ anchors: { offset: -100 }, autoRaf: false });
    expect(lenis.on).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(add).toHaveBeenCalledTimes(1);
    expect(lag).toHaveBeenCalledWith(0);

    const tick = add.mock.calls[0][0];
    tick(1.5, 16, 1, 0);
    expect(lenis.raf).toHaveBeenCalledWith(1500);

    unmount();
    expect(remove).toHaveBeenCalledWith(tick);
    expect(lag).toHaveBeenLastCalledWith(500, 33);
    expect(lenis.destroy).toHaveBeenCalledTimes(1);
  });

  it("defaults the anchor offset to -80", () => {
    render(<SmoothScroll>x</SmoothScroll>);
    expect(lenisMock.instances[0].options).toMatchObject({ anchors: { offset: -80 } });
  });

  it("is disabled under prefers-reduced-motion", () => {
    installMatchMedia({ reduced: true });
    render(<SmoothScroll>x</SmoothScroll>);
    expect(lenisMock.instances).toHaveLength(0);
  });

  it("is disabled on coarse pointers", () => {
    installMatchMedia({ coarse: true });
    render(<SmoothScroll>x</SmoothScroll>);
    expect(lenisMock.instances).toHaveLength(0);
  });

  it("exposes the instance and routes useSmoothScrollTo through Lenis", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <SmoothScroll>{children}</SmoothScroll>;
    const { result } = renderHook(() => ({ lenis: useLenis(), scrollTo: useSmoothScrollTo() }), { wrapper });
    expect(result.current.lenis).toBe(lenisMock.instances[0]);
    act(() => result.current.scrollTo("#faq", { offset: -64 }));
    expect(lenisMock.instances[0].scrollTo).toHaveBeenCalledWith("#faq", { offset: -64, immediate: false });
  });

  it("falls back to native scrolling without Lenis", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const target = document.createElement("section");
    target.id = "faq";
    document.body.appendChild(target);
    const { result } = renderHook(() => useSmoothScrollTo());
    act(() => result.current("#faq", { offset: -10 }));
    expect(scrollTo).toHaveBeenCalledWith({ top: -10, behavior: "smooth" });
    target.remove();
  });
});
