import { Marquee } from "@/components/motion";
import { logos } from "@/src/config/landing";
import { logos as logoAssets } from "@/src/config/landing-assets";

/** Logo strip (S4). Grayscale company logos scroll in one row; placeholder data until T-1000. */
export function LandingLogos() {
  return (
    <section
      aria-labelledby="landing-logos-heading"
      className="bg-white"
      data-placeholder={logos.placeholder ? "true" : undefined}
    >
      <div className="lv-container py-12 md:py-16">
        <h2 id="landing-logos-heading" className="text-h3 font-heading text-ink-1 text-center">
          {logos.heading}
        </h2>
        <Marquee label={logos.heading} speed={40} gap={56} className="lv-mask-x mt-8">
          <ul className="flex items-center" style={{ gap: "var(--marquee-gap)" }}>
            {logos.items.map((item) => {
              const asset = logoAssets[item.logoKey];
              return (
                <li key={item.logoKey} className="flex shrink-0 items-center">
                  {asset.type === "svg" ? (
                    // Plain img: logo SVGs are already optimised static assets (not next/image).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.src}
                      alt={item.name}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="h-7 w-auto grayscale opacity-60 transition hover:opacity-100 hover:grayscale-0"
                    />
                  ) : (
                    <span className="font-heading text-lg font-semibold text-ink-5 transition hover:text-ink-1">
                      {item.name}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Marquee>
        <p className="text-xs text-ink-5 text-center mt-6">{logos.disclaimer}</p>
      </div>
    </section>
  );
}
