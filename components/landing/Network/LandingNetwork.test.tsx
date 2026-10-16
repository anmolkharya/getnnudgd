import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { network } from "@/src/config/landing";
import {
  installIntersectionObserver,
  installMatchMedia,
  installResizeObserver,
  stubRects,
} from "@/components/motion/testUtils";
import { LandingNetwork } from "./LandingNetwork";

const clearRect = vi.fn();

function stubCanvas() {
  const gradient = { addColorStop: vi.fn() };
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "clearRect") return clearRect;
        if (prop === "measureText") return () => ({ width: 20 });
        if (prop === "createRadialGradient" || prop === "createLinearGradient") return () => gradient;
        return vi.fn();
      },
      set: () => true,
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
}

describe("LandingNetwork", () => {
  beforeEach(() => {
    clearRect.mockClear();
    installMatchMedia({ reduced: true });
    installIntersectionObserver();
    installResizeObserver();
    stubRects(() => ({ width: 800, height: 500 }));
    stubCanvas();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the heading pair and sub from config", () => {
    render(<LandingNetwork />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      `${network.headingSans}${network.headingSerif}`,
    );
    expect(screen.getByText(network.sub)).toBeInTheDocument();
  });

  it("offers an all-companies filter plus one per field, with all selected first", () => {
    render(<LandingNetwork />);
    const group = screen.getByRole("group", { name: network.filterHeading });
    expect(group.querySelectorAll("button")).toHaveLength(network.fields.length + 1);
    expect(screen.getByRole("button", { name: network.allLabel })).toHaveAttribute("aria-pressed", "true");
  });

  it("hides the canvas and the floating card from assistive tech but lists every person", () => {
    const { container } = render(<LandingNetwork />);
    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
    const list = screen.getByRole("list", { name: network.mapLabel });
    expect(list.querySelectorAll("li")).toHaveLength(network.people.length);
  });

  it("filters by field, moves the profile card to a matching person and clears on a second click", () => {
    render(<LandingNetwork />);
    const design = screen.getByRole("button", { name: "Design" });
    fireEvent.click(design);
    expect(design).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: network.allLabel })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Product Designer")).toBeInTheDocument();

    fireEvent.click(design);
    expect(design).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: network.allLabel })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the sample profile card details from config", () => {
    render(<LandingNetwork />);
    const first = network.people[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(screen.getByText(first.name)).toBeInTheDocument();
    expect(screen.getByText(`${first.match}% ${network.matchLabel}`)).toBeInTheDocument();
  });

  it("paints a still frame without animating when motion is reduced", () => {
    render(<LandingNetwork />);
    expect(clearRect).toHaveBeenCalled();
  });

  it("shows the sample and trademark disclaimer from config", () => {
    render(<LandingNetwork />);
    expect(screen.getByText(network.disclaimer)).toBeInTheDocument();
  });

  it("draws the map without a bordered or rounded frame around it", () => {
    const { container } = render(<LandingNetwork />);
    const stage = container.querySelector("canvas")?.parentElement;
    expect(stage).not.toBeNull();
    expect(stage?.className).not.toMatch(/border|rounded|overflow-hidden/);
  });

  it("names the company in the profile card instead of a generic label", () => {
    render(<LandingNetwork />);
    const first = network.people[0];
    const company = network.companies.find((c) => c.id === first?.companyId);
    expect(company).toBeDefined();
    expect(screen.getByText(new RegExp(`· ${company?.name}$`))).toBeInTheDocument();
  });

  it("is marked as placeholder sample data", () => {
    const { container } = render(<LandingNetwork />);
    expect(container.querySelector("section")).toHaveAttribute("data-placeholder", "true");
  });
});
