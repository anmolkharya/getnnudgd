import Link from "next/link";
import { Reveal, Stagger } from "@/components/motion";
import { features } from "@/src/config/landing";
import { mocks, photos } from "@/src/config/landing-assets";

const PHOTO_SIZES = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw";

export function LandingFeatures() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="lv-container py-20 md:py-28">
        <div className="max-w-measure">
          <h2 className="text-h2-lg font-heading text-ink-1">{features.heading}</h2>
          <p className="mt-4 text-base text-ink-5">{features.sub}</p>
          <Link
            href={features.cta.href}
            className="mt-8 inline-flex rounded-full bg-ink-1 px-5 py-3 text-base text-white transition-colors hover:bg-accent"
          >
            {features.cta.label}
          </Link>
        </div>

        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.cards.map((card) => {
            const photo = photos[card.imageKey];
            const mock = mocks[card.mockKey];
            return (
              <Reveal key={card.title}>
                <article
                  id={card.cta.href.replace("#", "")}
                  className="group relative aspect-4/5 scroll-mt-20 overflow-hidden rounded-card-lg bg-ink-1"
                >
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={`${photo.avif[800]} 800w, ${photo.avif[1600]} 1600w`}
                      sizes={PHOTO_SIZES}
                    />
                    <source
                      type="image/webp"
                      srcSet={`${photo.webp[800]} 800w, ${photo.webp[1600]} 1600w`}
                      sizes={PHOTO_SIZES}
                    />
                    <img
                      src={photo.webp[1600]}
                      width={photo.width}
                      height={photo.height}
                      alt={photo.alt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:scale-none motion-reduce:transition-none"
                    />
                  </picture>

                  <div className="absolute inset-x-0 top-0 flex h-1/2 items-center justify-center px-6">
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised static asset */}
                    <img
                      src={mock.src}
                      width={mock.width}
                      height={mock.height}
                      alt={mock.alt}
                      loading="lazy"
                      decoding="async"
                      className="w-3/4 max-w-xs drop-shadow-lg transition-transform duration-500 group-hover:-translate-y-1.5 motion-reduce:translate-none motion-reduce:transition-none"
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink-1 via-ink-1/70 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-h3 text-white">{card.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-on-dark-1">{card.body}</p>
                    <a
                      href={card.cta.href}
                      aria-label={`${card.cta.label} ${card.title}`}
                      className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm text-ink-1 transition-colors hover:bg-on-dark-1"
                    >
                      {card.cta.label}
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
