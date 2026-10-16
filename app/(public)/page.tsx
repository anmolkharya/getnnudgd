import { brand } from "@/src/config/brand";
import { LandingNav } from "@/components/landing/Nav";
import { LandingHero } from "@/components/landing/Hero";
import { LandingLogos } from "@/components/landing/Logos";
import { LandingFeatures } from "@/components/landing/Features";
import { LandingBento } from "@/components/landing/Bento";
import { LandingCounter } from "@/components/landing/Counter";
import { LandingFaq } from "@/components/landing/Faq";
import { LandingFooter } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

export const metadata = {
  title: `${brand.name} | ${brand.ctaGetVouched} by verified employees`,
  description: `${brand.tagline} ${brand.ctaGetVouched} by verified employees at top Indian startups.`,
};

export default function LandingPage() {
  return (
    <div className="landing-scope">
      <SmoothScroll>
        <LandingNav />
        <main>
          <LandingHero />
          <LandingLogos />
          <LandingFeatures />
          <LandingBento />
          <LandingCounter />
          <LandingFaq />
        </main>
        <LandingFooter />
      </SmoothScroll>
    </div>
  );
}
