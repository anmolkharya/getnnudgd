"use client";

import Link from "next/link";
import { useRef } from "react";
import { brand } from "@/src/config/brand";
import { footer, type FooterLink } from "@/src/config/landing";
import { photos } from "@/src/config/landing-assets";
import { gsap, useGsap } from "@/components/motion/gsap";
import { Reveal, usePrefersReducedMotion } from "@/components/motion";
import styles from "./LandingFooter.module.css";

/** Parallax travel of the photo layer, in percent of its own height. */
const PARALLAX_PERCENT = 8;

const LINK_CLASS = "text-sm text-on-dark-1 transition-colors hover:text-white";

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.target === "route") {
    return (
      <Link href={link.href} className={LINK_CLASS}>
        {link.label}
      </Link>
    );
  }
  if (link.target === "external") {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {link.label}
      </a>
    );
  }
  return (
    <a href={link.href} className={LINK_CLASS}>
      {link.label}
    </a>
  );
}

export function LandingFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const photo = photos["footer-scene"];

  useGsap(
    footerRef,
    () => {
      if (reduced || !photoRef.current || !footerRef.current) return;
      const tween = gsap.fromTo(
        photoRef.current,
        { yPercent: -PARALLAX_PERCENT },
        {
          yPercent: PARALLAX_PERCENT,
          ease: "none",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
      return () => {
        tween.kill();
      };
    },
    [reduced],
  );

  const year = new Date().getFullYear();

  return (
    <footer ref={footerRef} className="lv-dark relative overflow-hidden">
      <div ref={photoRef} className={styles.photo}>
        <picture className="block h-full w-full">
          <source
            type="image/avif"
            srcSet={`${photo.avif[800]} 800w, ${photo.avif[1600]} 1600w`}
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet={`${photo.webp[800]} 800w, ${photo.webp[1600]} 1600w`}
            sizes="100vw"
          />
          <img
            src={photo.webp[1600]}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-navy/70" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-navy to-transparent"
      />

      <div className="lv-container relative pt-28 pb-10 md:pt-40">
        <h2 className="font-heading text-display font-medium">
          <em className="block font-serif italic font-medium text-accent-soft">{footer.headingSerif}</em>
          <span className="block">{footer.headingSans}</span>
        </h2>
        <p className="mt-4 max-w-measure text-on-dark-1">{footer.sub}</p>
        <Link
          href={footer.cta.href}
          className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {footer.cta.label}
        </Link>

        <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="font-heading text-lg font-semibold text-white">{brand.name}</p>
            <p className="mt-2 text-sm text-on-dark-2">{brand.tagline}</p>
          </div>
          {footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-mono text-micro uppercase text-on-dark-2">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col justify-between gap-2 border-t border-line-dark pt-6 text-xs text-on-dark-2 sm:flex-row">
          <p>
            © {year} {brand.name}
          </p>
          <p>{brand.domain}</p>
        </div>
      </div>

      <Reveal y={48}>
        <div
          aria-hidden="true"
          className={`${styles.wordmark} whitespace-nowrap text-center font-heading font-semibold select-none`}
        >
          {footer.wordmark}
        </div>
      </Reveal>
    </footer>
  );
}
