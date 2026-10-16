import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingNav } from "./LandingNav";
import { nav } from "@/src/config/landing";
import { installMatchMedia } from "@/components/motion/testUtils";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const dropdown = nav.links[0];
if (dropdown.kind !== "dropdown") throw new Error("expected dropdown first");

beforeEach(() => {
  installMatchMedia();
  document.body.style.overflow = "";
});

describe("LandingNav dropdown", () => {
  it("toggles on click and reflects aria-expanded", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    const btn = screen.getByRole("button", { name: new RegExp(dropdown.label, "i") });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with Enter from keyboard", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    const btn = screen.getByRole("button", { name: new RegExp(dropdown.label, "i") });
    btn.focus();
    await user.keyboard("{Enter}");
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("renders numbered items from config with correct links", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    await user.click(screen.getByRole("button", { name: new RegExp(dropdown.label, "i") }));
    const panel = document.getElementById(btnControls())!;
    for (const item of dropdown.items) {
      const link = within(panel).getByRole("link", { name: new RegExp(item.name) });
      expect(link).toHaveAttribute("href", item.href);
      expect(within(panel).getByText(item.number)).toBeInTheDocument();
      expect(within(panel).getByText(item.oneLiner)).toBeInTheDocument();
    }
  });

  it("closes on Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    const btn = screen.getByRole("button", { name: new RegExp(dropdown.label, "i") });
    await user.click(btn);
    const panel = document.getElementById(btnControls())!;
    within(panel).getAllByRole("link")[0].focus();
    await user.keyboard("{Escape}");
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(btn).toHaveFocus();
  });

  it("closes on outside click and when an item is clicked", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    const btn = screen.getByRole("button", { name: new RegExp(dropdown.label, "i") });
    await user.click(btn);
    await user.click(document.body);
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await user.click(btn);
    const panel = document.getElementById(btnControls())!;
    fireEvent.click(within(panel).getAllByRole("link")[0]);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on mouse hover", () => {
    render(<LandingNav />);
    const btn = screen.getByRole("button", { name: new RegExp(dropdown.label, "i") });
    fireEvent.pointerEnter(btn, { pointerType: "mouse" });
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });
});

function btnControls(): string {
  const btn = screen.getByRole("button", { name: new RegExp(dropdown.label, "i") });
  return btn.getAttribute("aria-controls")!;
}

describe("LandingNav links and CTA", () => {
  it("CTA points at /login", () => {
    render(<LandingNav />);
    const ctas = screen.getAllByRole("link", { name: new RegExp(nav.cta.label, "i") });
    expect(ctas[0]).toHaveAttribute("href", "/login");
  });

  it("renders plain links", () => {
    render(<LandingNav />);
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "#faq");
  });
});

describe("LandingNav mobile drawer", () => {
  it("opens, locks body scroll, and closes restoring scroll and focus", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    const burger = screen.getByRole("button", { name: "Open menu" });
    expect(burger).toHaveAttribute("aria-expanded", "false");
    await user.click(burger);
    expect(burger).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(dropdown.items[0].oneLiner)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(burger).toHaveFocus();
  });

  it("closes via the close button and when a link is clicked", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: "FAQ" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("traps focus within the drawer", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog");
    const focusables = within(drawer)
      .getAllByRole("link")
      .concat(within(drawer).getAllByRole("button"));
    expect(focusables.length).toBeGreaterThan(2);
    const all = Array.from(
      drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    );
    const last = all[all.length - 1];
    last.focus();
    await user.tab();
    expect(all[0]).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it("restores body scroll on unmount while open", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<LandingNav />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
