import type {
  FeatureImageKey,
  HeroImageKey,
  LogoKey,
  MockKey,
} from "@/src/config/landing";

// Keys come from landing.ts. A missing or extra key in these maps is a compile error.
export type PhotoKey = HeroImageKey | FeatureImageKey | "footer-scene";

export type PhotoAsset = Readonly<{
  avif: Readonly<{ 800: string; 1600: string }>;
  webp: Readonly<{ 800: string; 1600: string }>;
  width: number;
  height: number;
  alt: string;
  credit: string;
}>;

export type LogoAsset = Readonly<
  { type: "svg"; src: string } | { type: "text" }
>;

export type MockAsset = Readonly<{
  src: string;
  width: number;
  height: number;
  alt: string;
}>;

const HERO_W = 1600;
const HERO_H = 900;
const FEATURE_W = 1600;
const FEATURE_H = 2000;

function photo(
  key: PhotoKey,
  width: number,
  height: number,
  alt: string,
  credit: string,
): PhotoAsset {
  return {
    avif: {
      800: `/landing/photos/${key}-800.avif`,
      1600: `/landing/photos/${key}-1600.avif`,
    },
    webp: {
      800: `/landing/photos/${key}-800.webp`,
      1600: `/landing/photos/${key}-1600.webp`,
    },
    width,
    height,
    alt,
    credit,
  };
}

export const photos = {
  "hero-resume": photo(
    "hero-resume",
    HERO_W,
    HERO_H,
    "A man in a turban, seen from behind, works on a laptop at a small desk against a green wall at home.",
    "Photo by Ketut Subiyanto on Pexels",
  ),
  "hero-find-insider": photo(
    "hero-find-insider",
    HERO_W,
    HERO_H,
    "A young Indian woman and a man in a turban smile as they work together over a laptop and notebook at a wooden table at home.",
    "Photo by Ketut Subiyanto on Pexels",
  ),
  "hero-request": photo(
    "hero-request",
    HERO_W,
    HERO_H,
    "A hand holds a smartphone showing a photo feed, with warm blurred lights in the background.",
    "Photo by Ahmed Aqtai on Pexels",
  ),
  "hero-vouch": photo(
    "hero-vouch",
    HERO_W,
    HERO_H,
    "A woman and a man shake hands across a meeting table in a high-rise office.",
    "Photo by Mikhail Nilov on Pexels",
  ),
  "hero-rewards": photo(
    "hero-rewards",
    HERO_W,
    HERO_H,
    "A diverse group of young professionals celebrates a project win in a modern office.",
    "Photo by Tima Miroshnichenko on Pexels",
  ),
  "hero-whatsapp": photo(
    "hero-whatsapp",
    HERO_W,
    HERO_H,
    "A hand holds a phone showing a text message conversation, shot with a shallow depth of field.",
    "Photo by RDNE Stock project on Pexels",
  ),
  "feature-resume": photo(
    "feature-resume",
    FEATURE_W,
    FEATURE_H,
    "A lone silhouette under a quiet, star-filled night sky.",
    "Photo by Troy Olson on Pexels",
  ),
  "feature-insiders": photo(
    "feature-insiders",
    FEATURE_W,
    FEATURE_H,
    "A raised hand in the foreground of a rocky seafront at sunset, with distant city towers on the shore.",
    "Photo by Bhavitya Indora on Pexels",
  ),
  "feature-requests": photo(
    "feature-requests",
    FEATURE_W,
    FEATURE_H,
    "A city skyline at dusk under a pink and orange sky with scattered clouds.",
    "Photo by Umar Andrabi on Pexels",
  ),
  "feature-rewards": photo(
    "feature-rewards",
    FEATURE_W,
    FEATURE_H,
    "A wrapped gift box lit by warm light.",
    "Photo by Valeria Boltneva on Pexels",
  ),
  "feature-whatsapp": photo(
    "feature-whatsapp",
    FEATURE_W,
    FEATURE_H,
    "A person gazes up at a star-filled sky in a quiet outdoor setting.",
    "Photo by Zeynep Sude Emek on Pexels",
  ),
  "footer-scene": photo(
    "footer-scene",
    HERO_W,
    HERO_H,
    "A standing figure silhouetted against the bright Milky Way.",
    "Photo by Erhan Dayi on Pexels",
  ),
} as const satisfies Record<PhotoKey, PhotoAsset>;

export const logos = {
  "logo-razorpay": { type: "svg", src: "/landing/logos/logo-razorpay.svg" },
  "logo-phonepe": { type: "svg", src: "/landing/logos/logo-phonepe.svg" },
  "logo-zerodha": { type: "svg", src: "/landing/logos/logo-zerodha.svg" },
  "logo-freshworks": { type: "svg", src: "/landing/logos/logo-freshworks.svg" },
  "logo-groww": { type: "text" },
  "logo-zomato": { type: "text" },
  "logo-swiggy": { type: "text" },
  "logo-cred": { type: "text" },
  "logo-flipkart": { type: "text" },
  "logo-meesho": { type: "text" },
} as const satisfies Record<LogoKey, LogoAsset>;

export const mocks = {
  "mock-resume": {
    src: "/landing/mocks/mock-resume.svg",
    width: 360,
    height: 220,
    alt: "A resume ATS score card showing a score of 92, marked ATS ready.",
  },
  "mock-insiders": {
    src: "/landing/mocks/mock-insiders.svg",
    width: 360,
    height: 220,
    alt: "An Insider profile card marked Verified Insider, SDE-2.",
  },
  "mock-requests": {
    src: "/landing/mocks/mock-requests.svg",
    width: 360,
    height: 220,
    alt: "An Insider Request status card showing the request as Accepted.",
  },
  "mock-rewards": {
    src: "/landing/mocks/mock-rewards.svg",
    width: 360,
    height: 220,
    alt: "A points wallet card showing 1,250 points.",
  },
  "mock-whatsapp": {
    src: "/landing/mocks/mock-whatsapp.svg",
    width: 360,
    height: 220,
    alt: "A chat card with a message saying an Insider Request was accepted.",
  },
} as const satisfies Record<MockKey, MockAsset>;
