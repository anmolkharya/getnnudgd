import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import { AutoplayProgress, useAutoplay } from "./useAutoplay";
import { installIntersectionObserver, installMatchMedia } from "./testUtils";

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useAutoplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setDocumentHidden(false);
  });

  it("advances to the next index after the interval and exposes the interval", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    expect(result.current.index).toBe(0);
    expect(result.current.interval).toBe(1000);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.index).toBe(0);
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current.index).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.index).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.index).toBe(0);
  });

  it("does not re-render while time passes inside a slide", () => {
    let renders = 0;
    renderHook(() => {
      renders += 1;
      return useAutoplay({ count: 3, interval: 1000 });
    });
    const before = renders;
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(renders).toBe(before);
  });

  it("wraps with next, prev and goTo", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000, paused: true }));
    act(() => result.current.prev());
    expect(result.current.index).toBe(2);
    act(() => result.current.next());
    expect(result.current.index).toBe(0);
    act(() => result.current.goTo(4));
    expect(result.current.index).toBe(1);
    act(() => result.current.goTo(-1));
    expect(result.current.index).toBe(2);
  });

  it("restarts the full interval after manual navigation", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    act(() => {
      vi.advanceTimersByTime(800);
    });
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.index).toBe(1);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.index).toBe(2);
  });

  it("keeps elapsed time across pause/resume", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => result.current.pause());
    expect(result.current.isPlaying).toBe(false);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.index).toBe(0);
    act(() => result.current.resume());
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.index).toBe(0);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.index).toBe(1);
  });

  it("does not advance while the paused prop is set", () => {
    const { result, rerender } = renderHook(
      ({ paused }: { paused: boolean }) => useAutoplay({ count: 3, interval: 1000, paused }),
      { initialProps: { paused: true } },
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.index).toBe(0);
    rerender({ paused: false });
    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(result.current.index).toBe(1);
  });

  it("keeps hover, focus and user pause independent", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    act(() => result.current.pause());
    act(() => result.current.setFocused(true));
    act(() => result.current.setFocused(false));
    expect(result.current.isPlaying).toBe(false);
    act(() => result.current.resume());
    act(() => result.current.setHovered(true));
    expect(result.current.isPlaying).toBe(false);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.index).toBe(0);
    act(() => result.current.setHovered(false));
    expect(result.current.isPlaying).toBe(true);
  });

  it("pauses while the document is hidden", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => setDocumentHidden(true));
    expect(result.current.isPlaying).toBe(false);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.index).toBe(0);
    act(() => setDocumentHidden(false));
    act(() => {
      vi.advanceTimersByTime(501);
    });
    expect(result.current.index).toBe(1);
  });

  it("never auto-advances with 0 or 1 slides", () => {
    const one = renderHook(() => useAutoplay({ count: 1, interval: 1000 }));
    const zero = renderHook(() => useAutoplay({ count: 0, interval: 1000 }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(one.result.current.index).toBe(0);
    expect(one.result.current.isPlaying).toBe(false);
    expect(zero.result.current.index).toBe(0);
    act(() => zero.result.current.next());
    expect(zero.result.current.index).toBe(0);
  });

  it("wraps the index when count shrinks", () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useAutoplay({ count, interval: 1000, paused: true }),
      { initialProps: { count: 3 } },
    );
    act(() => result.current.goTo(2));
    rerender({ count: 2 });
    expect(result.current.index).toBe(0);
  });

  it("does not auto-advance under prefers-reduced-motion", () => {
    installMatchMedia({ reduced: true });
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.index).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
  });
});

describe("AutoplayProgress", () => {
  beforeEach(() => {
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders done / active / pending fills driven by CSS", () => {
    const { container } = render(
      <div>
        {[0, 1, 2].map((i) => (
          <AutoplayProgress key={i} index={i} current={1} interval={4000} isPlaying />
        ))}
      </div>,
    );
    const fills = container.querySelectorAll<HTMLElement>("[data-autoplay-fill]");
    expect(fills[0]).toHaveAttribute("data-state", "done");
    expect(fills[1]).toHaveAttribute("data-state", "active");
    expect(fills[2]).toHaveAttribute("data-state", "pending");
    expect(fills[1].style.animationDuration).toBe("4000ms");
    expect(fills[1].style.animationPlayState).toBe("running");
  });

  it("pauses the fill when not playing", () => {
    const { container } = render(
      <AutoplayProgress index={0} current={0} interval={4000} isPlaying={false} />,
    );
    const fill = container.querySelector<HTMLElement>("[data-autoplay-fill]");
    expect(fill?.style.animationPlayState).toBe("paused");
  });
});
