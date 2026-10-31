import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/*
 * Eigene 404-Seite für alle unbekannten Adressen. Die Seite hat zwei
 * Root-Layouts (Route-Groups `(de)` und `(en)`), daher kein gemeinsames
 * `not-found.tsx` — Next rendert `global-not-found` ohne Layout, also mit
 * eigenem <html>, eigener Schrift und den globalen Styles.
 * Der statische Export liefert für jede unbekannte Adresse dieselbe `404.html`
 * aus (auch unter /en/…): oben Deutsch, darunter Englisch mit Link nach /en/.
 */
const sora = localFont({
  src: "./fonts/sora-latin.woff2",
  weight: "200 500",
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = { title: "Hier ist nichts." };

export default function GlobalNotFound() {
  return (
    <html lang="de" className={sora.variable}>
      <body>
        <main className="nf">
          <div className="lv-bg" aria-hidden="true" />
          <div className="nf-main">
            <p className="p-kick">404</p>
            <h1 className="lv-title">Hier ist nichts.</h1>
            <p className="lv-sub">Dieser Ort im Himmel ist leer.</p>
            {/* <a> statt <Link>: anderes Root-Layout, also ohnehin ein voller Seitenwechsel */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="nf-back" href="/">
              ← Zur Übersicht
            </a>
            <div className="nf-alt" lang="en">
              <p>Nothing here. This spot in the sky is empty.</p>
              <a className="nf-back" href="/en/">
                ← Back to the overview
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
