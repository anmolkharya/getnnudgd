import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { gsap, useGsap } from "./gsap";
import { installMatchMedia } from "./testUtils";

const reverts: Array<ReturnType<typeof vi.fn>> = [];
const cleanups: Array<ReturnType<typeof vi.fn>> = [];

function Probe({ dep }: { dep: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGsap(
    ref,
    (ctx) => {
      reverts.push(vi.spyOn(ctx, "revert"));
      gsap.set(".box", { opacity: 0.5 });
      const cleanup = vi.fn();
      cleanups.push(cleanup);
      return cleanup;
    },
    [dep],
  );
  return (
    <div ref={ref}>
      <div className="box" data-testid={`box-${dep}`} />
    </div>
  );
}

describe("useGsap", () => {
  beforeEach(() => {
    installMatchMedia();
    reverts.length = 0;
    cleanups.length = 0;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("scopes selectors and reverts on unmount", () => {
    const { container, unmount } = render(<Probe dep={1} />);
    const box = container.querySelector<HTMLElement>(".box");
    expect(box?.style.opacity).toBe("0.5");
    unmount();
    expect(cleanups[0]).toHaveBeenCalledTimes(1);
    expect(reverts[0]).toHaveBeenCalledTimes(1);
    expect(box?.style.opacity).toBe("");
  });

  it("reverts and re-runs when deps change", () => {
    const { rerender } = render(<Probe dep={1} />);
    rerender(<Probe dep={1} />);
    expect(reverts).toHaveLength(1);
    rerender(<Probe dep={2} />);
    expect(reverts[0]).toHaveBeenCalledTimes(1);
    expect(cleanups[0]).toHaveBeenCalledTimes(1);
    expect(reverts).toHaveLength(2);
  });
});
