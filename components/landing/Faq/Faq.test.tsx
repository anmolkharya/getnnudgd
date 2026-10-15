import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faq } from "@/src/config/landing";
import { LandingFaq } from "./Faq";

describe("LandingFaq", () => {
  it("renders heading pair, sub and contact card from config", () => {
    const { container } = render(<LandingFaq />);
    const h2 = container.querySelector("h2");
    expect(h2).toHaveTextContent(faq.headingSans);
    expect(h2?.querySelector("em")).toHaveTextContent(faq.headingSerif);
    expect(screen.getByText(faq.sub)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: faq.contact.title })).toBeInTheDocument();
    expect(screen.getByText(faq.contact.body)).toBeInTheDocument();
  });

  it("is the #faq section", () => {
    const { container } = render(<LandingFaq />);
    expect(container.querySelector("section#faq")).not.toBeNull();
  });

  it("renders the mailto CTA as a plain anchor", () => {
    render(<LandingFaq />);
    const a = screen.getByRole("link", { name: faq.contact.cta.label });
    expect(a).toHaveAttribute("href", faq.contact.cta.href);
  });

  it("opens only the first item initially", () => {
    render(<LandingFaq />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(faq.items.length);
    buttons.forEach((b, i) => expect(b).toHaveAttribute("aria-expanded", i === 0 ? "true" : "false"));
  });

  it("toggles independently on click and hides closed panels from AT", () => {
    render(<LandingFaq />);
    const buttons = screen.getAllByRole("button");
    const panel1 = document.getElementById(buttons[1].getAttribute("aria-controls") as string) as HTMLElement;
    expect(panel1).toHaveAttribute("aria-hidden", "true");
    expect(panel1).toHaveAttribute("inert");
    fireEvent.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    expect(panel1).not.toHaveAttribute("aria-hidden", "true");
    expect(panel1).not.toHaveAttribute("inert");
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("works with Enter and Space on the button", async () => {
    const user = userEvent.setup();
    render(<LandingFaq />);
    const buttons = screen.getAllByRole("button");
    buttons[2].focus();
    await user.keyboard("{Enter}");
    expect(buttons[2]).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(buttons[2]).toHaveAttribute("aria-expanded", "false");
  });

  it("links buttons and regions via aria-controls / aria-labelledby", () => {
    render(<LandingFaq />);
    for (const b of screen.getAllByRole("button")) {
      const region = document.getElementById(b.getAttribute("aria-controls") as string);
      expect(region).not.toBeNull();
      expect(region).toHaveAttribute("role", "region");
      expect(region).toHaveAttribute("aria-labelledby", b.id);
    }
  });

  it("marks needsLegalReview items", () => {
    const { container } = render(<LandingFaq />);
    const expected = faq.items.filter((i) => "needsLegalReview" in i && i.needsLegalReview).length;
    expect(expected).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-needs-legal-review="true"]')).toHaveLength(expected);
  });

  it("emits FAQPage JSON-LD matching config", () => {
    const { container } = render(<LandingFaq />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.textContent).not.toContain("<");
    const data = JSON.parse(script?.textContent ?? "{}");
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(faq.items.length);
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: faq.items[0].q,
      acceptedAnswer: { "@type": "Answer", text: faq.items[0].a },
    });
  });
});
