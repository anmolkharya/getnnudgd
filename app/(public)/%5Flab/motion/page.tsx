"use client";

/**
 * Motion lab: demo of every components/motion primitive.
 * Temporary — deleted by T-1000 once the landing sections ship.
 */
import { useRef, type ReactNode } from "react";
import {
  Marquee,
  Odometer,
  Reveal,
  SmoothScroll,
  Stagger,
  TypeLoop,
  gsap,
  useAutoplay,
  useGsap,
  usePrefersReducedMotion,
  useSmoothScrollTo,
} from "@/components/motion";

const slides = [
  { title: "Ask an Insider", body: "Send an Insider Request to someone inside the company." },
  { title: "Get vouched in", body: "Insiders who know your work vouch for you." },
  { title: "Earn points", body: "Insiders earn points for every vouch that lands." },
];

const companies = ["Swiggy", "Razorpay", "Zerodha", "CRED", "Meesho", "Flipkart", "PhonePe", "Zomato"];

const feed = [
  "Aanya sent an Insider Request to Razorpay",
  "Rohan vouched for a Seeker at Swiggy",
  "Meera bought 20 credits",
  "Kabir's Insider Request was accepted",
  "Isha earned 50 points for a vouch",
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-b border-neutral-200 px-4 py-16 sm:px-8">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function CarouselDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { index, progress, next, prev, goTo, setHovered, isPlaying, pause, resume } = useAutoplay({
    count: slides.length,
    interval: 5000,
    ref: rootRef,
  });
  return (
    <div
      ref={rootRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={pause}
      onBlur={resume}
      className="max-w-xl"
    >
      <div className="rounded-2xl bg-neutral-100 p-6" aria-live="polite">
        <p className="text-lg font-semibold">{slides[index].title}</p>
        <p className="text-neutral-600">{slides[index].body}</p>
      </div>
      <div className="mt-4 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show slide ${i + 1}: ${s.title}`}
            aria-current={i === index}
            className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span
              className="block h-full origin-left bg-neutral-900"
              style={{ transform: `scaleX(${i < index ? 1 : i === index ? progress : 0})` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2 text-sm">
        <button type="button" onClick={prev} className="rounded-full border px-4 py-2 focus-visible:outline-2">
          Prev
        </button>
        <button type="button" onClick={next} className="rounded-full border px-4 py-2 focus-visible:outline-2">
          Next
        </button>
        <span className="self-center text-neutral-500">{isPlaying ? "playing" : "paused"}</span>
      </div>
    </div>
  );
}

function ParallaxDemo() {
  const scope = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useGsap(
    scope,
    () => {
      if (reduced) return;
      gsap.to(".parallax-layer", {
        yPercent: -30,
        ease: "none",
        scrollTrigger: { trigger: scope.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    [reduced],
  );
  return (
    <div ref={scope} className="relative h-64 overflow-hidden rounded-2xl bg-neutral-900">
      <div className="parallax-layer absolute inset-x-8 top-16 rounded-xl bg-indigo-500 p-6 text-white">
        Parallax layer (GSAP ScrollTrigger, scrubbed)
      </div>
    </div>
  );
}

function AnchorNav() {
  const scrollTo = useSmoothScrollTo();
  return (
    <nav aria-label="Lab sections" className="sticky top-0 z-10 flex flex-wrap gap-3 bg-white/90 px-4 py-3 text-sm backdrop-blur sm:px-8">
      <a href="#reveal" className="underline focus-visible:outline-2">
        Reveal (anchor)
      </a>
      <button type="button" onClick={() => scrollTo("#odometer", { offset: -64 })} className="underline focus-visible:outline-2">
        Odometer (useSmoothScrollTo)
      </button>
      <a href="#marquee" className="underline focus-visible:outline-2">
        Marquee
      </a>
    </nav>
  );
}

export default function MotionLabPage() {
  return (
    <SmoothScroll>
      <meta name="robots" content="noindex" />
      <main className="min-h-screen bg-white text-neutral-900">
        <AnchorNav />
        <header className="px-4 py-24 sm:px-8">
          <h1 className="text-4xl font-semibold">Motion lab</h1>
          <p className="mt-2 text-neutral-600">
            Find your way in:{" "}
            <TypeLoop
              phrases={["Product Manager at Swiggy", "SDE-2 at Razorpay", "Designer at CRED"]}
              label="Search roles, for example Product Manager at Swiggy"
              className="font-medium text-neutral-900"
            />
          </p>
        </header>

        <Section id="carousel" title="useAutoplay carousel">
          <CarouselDemo />
        </Section>

        <Section id="reveal" title="Reveal + Stagger">
          <Stagger step={0.1} className="grid gap-4 sm:grid-cols-3">
            {["Seekers", "Insiders", "Vouches"].map((t) => (
              <Reveal key={t} blur={8} className="rounded-2xl bg-neutral-100 p-6">
                {t}
              </Reveal>
            ))}
          </Stagger>
        </Section>

        <Section id="odometer" title="Odometer">
          <p className="text-5xl font-semibold">
            <Odometer value={1234567} from={1000000} />
          </p>
          <p className="mt-2 text-neutral-600">
            <Odometer value={2500} format={(n) => `${new Intl.NumberFormat("en-IN").format(n)}+`} /> Insiders
          </p>
        </Section>

        <Section id="marquee" title="Marquee (x and y)">
          <Marquee label="Companies our Insiders work at" speed={50}>
            {companies.map((c) => (
              <span key={c} className="text-xl font-semibold text-neutral-500">
                {c}
              </span>
            ))}
          </Marquee>
          <Marquee axis="y" direction="normal" speed={20} gap={12} className="mt-8 h-48 max-w-sm" label="Recent activity">
            {feed.map((f) => (
              <p key={f} className="rounded-xl bg-neutral-100 px-4 py-3 text-sm">
                {f}
              </p>
            ))}
          </Marquee>
        </Section>

        <Section id="parallax" title="Parallax (useGsap + ScrollTrigger)">
          <ParallaxDemo />
        </Section>

        <div className="h-96" />
      </main>
    </SmoothScroll>
  );
}
