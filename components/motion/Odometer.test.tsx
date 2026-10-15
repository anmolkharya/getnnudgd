import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Odometer } from "./Odometer";
import { installIntersectionObserver, installMatchMedia } from "./testUtils";

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
