import type { Viewport } from "next";
import localFont from "next/font/local";
import "./collage.css";

// Dieselben lokalen Dateien wie das Weltall (app/document.tsx), hier bewusst eigens
// deklariert: Ein gemeinsames Schrift-Modul ließ Turbopack die Schrift-CSS beider
// Varianten zusammenlegen — dann hätte auch das Weltall die Collage-Schriften vorgeladen.
const sora = localFont({
  src: "../fonts/sora-latin.woff2",
  weight: "200 500",
  variable: "--font-sora",
  display: "swap",
});
const plexMono = localFont({
  src: "../fonts/ibm-plex-mono-400-latin.woff2",
  weight: "400",
  variable: "--font-plex-mono",
  display: "swap",
});
// Release-Stempel (alle OFL, Lizenzen in app/fonts/): Unbounded für Name und insertcoin
// (Chrom, Y2K), Mr Dafoe als Schreibschrift für offerre, Instrument Serif für die Pipeline.
// Nur der Name steht im ersten Bild — die beiden Track-Schriften laden erst bei Bedarf.
const unbounded = localFont({
  src: "../fonts/unbounded-latin.woff2",
  weight: "200 900",
  variable: "--font-unbounded",
  display: "swap",
});
const dafoe = localFont({
  src: "../fonts/mr-dafoe-400-latin.woff2",
  weight: "400",
  variable: "--font-dafoe",
  display: "swap",
  preload: false,
});
const instrument = localFont({
  src: "../fonts/instrument-serif-400-latin.woff2",
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07060a",
};

/**
 * Eigenes Root-Layout für die Vergleichsvariante „Lebende Collage" (docs/konzept-collage.md).
 * Eigene Route-Group statt Unterordner von `(en)`: so lädt `/collage` weder das CSS
 * noch das Ansichts-Script des Weltalls, und das Weltall bleibt unberührt.
 * Navigation zwischen verschiedenen Root-Layouts ist ein voller Seitenwechsel — egal,
 * die beiden Varianten verlinken sich nicht.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${plexMono.variable} ${unbounded.variable} ${dafoe.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
