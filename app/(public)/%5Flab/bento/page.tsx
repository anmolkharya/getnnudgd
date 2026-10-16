import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingBento } from "@/components/landing/Bento";

/** Dev-only lab for the dark bento section (/_lab/bento). 404s in production. */
export const metadata: Metadata = { title: "Bento lab", robots: { index: false, follow: false } };

export default function BentoLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope bg-white">
      <div className="h-screen" />
      <LandingBento />
      <div className="h-screen" />
    </div>
  );
}
