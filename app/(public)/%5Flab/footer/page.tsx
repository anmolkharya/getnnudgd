import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingFooter } from "@/components/landing/Footer";

// Temporary section lab for Landing v2 (T-900). Served at /_lab/footer.
// The folder is "%5Flab" because "_lab" would be a private, unrouted folder.
// Deleted by T-1000.

export const metadata: Metadata = {
  title: "Footer lab",
  robots: { index: false, follow: false },
};

export default function FooterLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <div aria-hidden="true" style={{ height: "120vh" }} className="bg-ink-0" />
      <LandingFooter />
    </div>
  );
}
