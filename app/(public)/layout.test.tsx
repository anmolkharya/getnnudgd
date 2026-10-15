import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

type FontOptions = {
  variable?: string;
  weight?: string[];
  style?: string[];
  display?: string;
};

const fontCalls = vi.hoisted(() => new Map<string, FontOptions>());

vi.mock("next/font/google", () => {
  const make = (name: string) => (opts: FontOptions) => {
    fontCalls.set(name, opts);
    return { className: `${name}-class`, variable: `${name}${opts.variable ?? ""}`, style: {} };
  };
  return { IBM_Plex_Serif: make("IBM_Plex_Serif"), IBM_Plex_Mono: make("IBM_Plex_Mono") };
});

import PublicLayout from "./layout";

describe("PublicLayout", () => {
  it("loads IBM Plex Serif italic 500 as --font-plex-serif with swap", () => {
    expect(fontCalls.get("IBM_Plex_Serif")).toMatchObject({
      variable: "--font-plex-serif",
      weight: ["500"],
      style: ["italic"],
      display: "swap",
    });
  });

  it("loads IBM Plex Mono 400/500 as --font-plex-mono with swap", () => {
    expect(fontCalls.get("IBM_Plex_Mono")).toMatchObject({
      variable: "--font-plex-mono",
      weight: ["400", "500"],
      display: "swap",
    });
  });

  it("keeps the seeker scope and exposes both Plex variables on its wrapper", () => {
    const { container } = render(
      <PublicLayout>
        <p>child</p>
      </PublicLayout>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.classList.contains("seeker-scope")).toBe(true);
    expect(wrapper.classList.contains("IBM_Plex_Serif--font-plex-serif")).toBe(true);
    expect(wrapper.classList.contains("IBM_Plex_Mono--font-plex-mono")).toBe(true);
    expect(wrapper.textContent).toBe("child");
  });

  it("is the only place Plex is loaded (root layout stays untouched)", () => {
    const root = readFileSync(path.resolve(__dirname, "..", "layout.tsx"), "utf8");
    expect(root).not.toMatch(/IBM_Plex/);
  });
});
