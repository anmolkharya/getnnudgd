import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingFeatures } from "@/components/landing/Features";

export const metadata: Metadata = { title: "Features lab", robots: { index: false } };

export default function FeaturesLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <div className="h-40 bg-white" aria-hidden="true" />
      <LandingFeatures />
      <div className="h-40 bg-white" aria-hidden="true" />
    </div>
  );
}
