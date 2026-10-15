import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAutoplay } from "./useAutoplay";
import { installIntersectionObserver, installMatchMedia } from "./testUtils";

describe("useAutoplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("advances to the next index after the interval", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    expect(result.current.index).toBe(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.index).toBe(0);
    expect(result.current.progress).toBeGreaterThan(0.3);
    expect(result.current.progress).toBeLessThan(0.7);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.index).toBe(1);
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

  it("resets progress when the index changes manually", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    expect(result.current.progress).toBe(0);
  });

  it("does not advance while paused (prop or pause())", () => {
    const { result, rerender } = renderHook(
      ({ paused }: { paused: boolean }) => useAutoplay({ count: 3, interval: 1000, paused }),
      { initialProps: { paused: true } },
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.index).toBe(0);

    rerender({ paused: false });
    act(() => result.current.pause());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.index).toBe(0);
    expect(result.current.isPlaying).toBe(false);

    act(() => result.current.resume());
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.index).toBe(1);
  });

  it("does not advance while hovered", () => {
    const { result } = renderHook(() => useAutoplay({ count: 3, interval: 1000 }));
    act(() => result.current.setHovered(true));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
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
