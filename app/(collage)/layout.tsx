import type { Viewport } from "next";
import localFont from "next/font/local";
import "./collage.css";

// Dieselben lokalen Dateien wie das Weltall (app/document.tsx), hier bewusst eigens
// deklariert: Ein gemeinsames Schrift-Modul ließ Turbopack die Schrift-CSS beider
// Varianten zusammenlegen — dann hätte auch das Weltall Jost vorgeladen.
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
// Dünne geometrische Display-Schrift nur für die Collage (OFL, app/fonts/OFL-Jost.txt).
// Variable Achse 100–900 in einer Datei: Thin für den Namen, ExtraLight für die Rolle.
const jost = localFont({
  src: "../fonts/jost-latin.woff2",
  weight: "100 900",
  variable: "--font-jost",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0807",
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
    <html lang="en" className={`${sora.variable} ${plexMono.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
