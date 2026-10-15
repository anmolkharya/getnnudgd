import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Odometer } from "./Odometer";
import { MockIntersectionObserver, installIntersectionObserver, installMatchMedia } from "./testUtils";

describe("Odometer", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes only the en-IN formatted final value to assistive tech", () => {
    const { container } = render(<Odometer value={1234567} />);
    const expected = new Intl.NumberFormat("en-IN").format(1234567);
    expect(expected).toBe("12,34,567");
    expect(screen.getByText(expected)).toBeInTheDocument();
    const digits = container.querySelector("[data-odometer-digits]");
    expect(digits).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts a custom formatter", () => {
    render(<Odometer value={2500} format={(n) => `₹${n}+`} />);
    expect(screen.getByText("₹2500+")).toBeInTheDocument();
  });

  it("renders the final value immediately under reduced motion", () => {
    installMatchMedia({ reduced: true });
    const { container } = render(<Odometer value={42} from={0} />);
    const columns = container.querySelectorAll<HTMLElement>("[data-odometer-column]");
    expect(columns).toHaveLength(2);
    expect(columns[0]).toHaveAttribute("data-final", "4");
    expect(columns[1]).toHaveAttribute("data-final", "2");
    expect(columns[0].style.transform).toBe("translateY(-14em)");
    expect(columns[1].style.transform).toBe("translateY(-12em)");
  });
});

describe("Odometer updates", () => {
  beforeEach(() => {
    installIntersectionObserver();
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rolls from the previous value when value changes after the first roll", () => {
    const { container, rerender } = render(<Odometer value={42} from={0} />);
    act(() => MockIntersectionObserver.triggerAll(true));
    rerender(<Odometer value={57} from={0} />);
    const cols = container.querySelectorAll<HTMLElement>("[data-odometer-column]");
    expect([...cols].map((c) => c.dataset.start)).toEqual(["4", "2"]);
    expect([...cols].map((c) => c.dataset.final)).toEqual(["5", "7"]);
    expect(screen.getByText("57")).toBeInTheDocument();
  });

  it("still rolls from `from` if the value changes before it was ever seen", () => {
    const { container, rerender } = render(<Odometer value={42} from={10} />);
    rerender(<Odometer value={57} from={10} />);
    const cols = container.querySelectorAll<HTMLElement>("[data-odometer-column]");
    expect([...cols].map((c) => c.dataset.start)).toEqual(["1", "0"]);
  });

  it("right-aligns digits of a formatted `from` (decimals)", () => {
    const fmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const { container } = render(<Odometer value={123.4} from={5.6} format={fmt} />);
    const cols = container.querySelectorAll<HTMLElement>("[data-odometer-column]");
    // final "123.4", from "5.6" → digits 1234 vs 0056
    expect([...cols].map((c) => c.dataset.start)).toEqual(["0", "0", "5", "6"]);
  });
});
