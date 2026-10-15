import type { ReactNode } from "react";
import { IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";

// Landing v2 accent fonts, loaded only for public routes (not the app shells):
// serif italic for accent heading lines and the giant counter; mono for
// uppercase micro-labels.
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

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`seeker-scope ${plexSerif.variable} ${plexMono.variable}`}>{children}</div>
  );
}
