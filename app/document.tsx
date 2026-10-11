import type { Viewport } from "next";
import localFont from "next/font/local";
import type { Locale } from "@/content";
import { VIEW_SCRIPT } from "@/lib/view-script";
import "./globals.css";

// Schriften liegen im Repo (app/fonts, OFL-lizenziert): keine Anfrage an Google —
// weder im Browser noch beim Build (next/font/google ließ Vercel-Builds scheitern,
// wenn Google Fonts nicht antwortete). Nur der Latin-Satz; mehr braucht DE/EN nicht.
const sora = localFont({
  src: "./fonts/sora-latin.woff2",
  weight: "200 500",
  variable: "--font-sora",
  display: "swap",
});
const plexMono = localFont({
  src: "./fonts/ibm-plex-mono-400-latin.woff2",
  weight: "400",
  variable: "--font-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020308",
};

/**
 * Gemeinsames HTML-Gerüst beider Sprachen. Jede Sprache hat ein eigenes
 * Root-Layout (Route-Groups `(de)` und `(en)`), damit `<html lang>` schon im
 * statischen HTML stimmt. `data-view` setzt das Inline-Script vor dem ersten
 * Bild — daher `suppressHydrationWarning` am <html>.
 */
export function Document({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return (
    <html lang={lang} className={`${sora.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: VIEW_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
