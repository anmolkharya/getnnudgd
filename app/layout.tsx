import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { brand } from "@/src/config/brand";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Landing v2 accent fonts: serif italic for accent heading lines and the
// giant counter; mono for uppercase micro-labels.
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-plex-serif",
  weight: ["500"],
  style: ["italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: `${brand.name} | ${brand.ctaGetVouched} by verified employees`,
  description: `${brand.tagline} ${brand.ctaGetVouched} by verified employees at top Indian startups. Join the waitlist.`,
  openGraph: {
    title: brand.name,
    description: `${brand.ctaGetVouched} by someone on the inside.`,
    url: brand.url,
    siteName: brand.name,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} ${plexSerif.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
