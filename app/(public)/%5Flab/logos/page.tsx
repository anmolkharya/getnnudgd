import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingLogos } from "@/components/landing/Logos";

/** Dev-only lab for the logo strip (/_lab/logos). 404s in production. */
export const metadata: Metadata = { title: "Logos lab", robots: { index: false, follow: false } };

export default function LogosLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <div className="h-24" aria-hidden="true" />
      <LandingLogos />
      <div className="h-24" aria-hidden="true" />
    </div>
  );
}
