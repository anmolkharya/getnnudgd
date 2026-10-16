import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingHero } from "@/components/landing/Hero";

/** Dev-only lab for the hero wordmark + carousel (/_lab/hero). 404s in production. */
export const metadata: Metadata = { title: "Hero lab", robots: { index: false } };

export default function HeroLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <LandingHero />
      <div className="h-screen" aria-hidden="true" />
      <div className="h-96" aria-hidden="true" />
    </div>
  );
}
