import { notFound } from "next/navigation";
import { LandingCounter } from "@/components/landing/Counter";

export const metadata = { robots: { index: false } };

export default function CounterLab() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <div className="h-screen" aria-hidden="true" />
      <LandingCounter />
      <div className="h-screen" aria-hidden="true" />
    </div>
  );
}
