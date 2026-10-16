import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingNav } from "@/components/landing/Nav";

/** Dev-only nav lab (/_lab/nav). 404s in production. */
export const metadata: Metadata = { title: "Nav lab", robots: { index: false } };

export default function NavLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <LandingNav />
      <section id="how-it-works" className="lv-dark min-h-screen py-48">
        <div className="lv-container">
          <h2 className="text-h2-lg">Dark block (how-it-works)</h2>
        </div>
      </section>
      <section id="faq" className="min-h-screen py-48 bg-white">
        <div className="lv-container">
          <h2 className="text-h2-lg">Light block (faq)</h2>
        </div>
      </section>
    </div>
  );
}
