import { notFound } from "next/navigation";
import { LandingCounter } from "@/components/landing/Counter";

export const metadata = { robots: { index: false } };

export default function CounterLab() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="landing-scope">
      <div style={{ height: "120vh" }} aria-hidden="true" />
      <LandingCounter />
      <div style={{ height: "120vh" }} aria-hidden="true" />
    </div>
  );
}
