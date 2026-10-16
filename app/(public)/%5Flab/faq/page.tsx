import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingFaq } from "@/components/landing/Faq";

export const metadata: Metadata = { title: "FAQ lab", robots: { index: false } };

export default function FaqLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <div className="h-24 bg-ink-1" />
      <LandingFaq />
      <div className="h-24 bg-ink-1" />
    </div>
  );
}
