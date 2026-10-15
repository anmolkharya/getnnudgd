import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionLab } from "./MotionLab";

/** Dev-only motion lab (/_lab/motion). 404s in production. Deleted by T-1000. */
export const metadata: Metadata = { title: "Motion lab", robots: { index: false, follow: false } };

export default function MotionLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MotionLab />;
}
