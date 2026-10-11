import type { Metadata } from "next";
import { getPublicContent, LOCALES, pathOf, type Locale } from "@/content";

/**
 * Basis-URL für absolute Links in den Metadaten (hreflang, canonical, Open Graph).
 * Die Domain ist noch offen (docs/konzept.md) — bis dahin kommt sie aus der
 * Build-Umgebung: `SITE_URL`, sonst die Produktions-URL von Vercel, sonst localhost.
 */
export function siteUrl() {
  const raw =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
    "http://localhost:3000";
  return new URL(raw);
}

const OG_LOCALE: Record<Locale, string> = { de: "de_DE", en: "en_US" };

/** Titel, Beschreibung und Sprachverweise (hreflang) für die Startseite einer Sprache. */
export function metadataFor(locale: Locale): Metadata {
  const { meta, brand } = getPublicContent(locale);
  // Vorschaubild: die Eröffnung (Name über der Sonne), je Sprache mit eigener Rolle/Leitsatz
  const image = { url: `/og-${locale}.jpg`, width: 1200, height: 630, alt: meta.title };
  const languages: Record<string, string> = Object.fromEntries(LOCALES.map((l) => [l, pathOf(l)]));
  languages["x-default"] = pathOf(LOCALES[0]);
  return {
    metadataBase: siteUrl(),
    title: meta.title,
    description: meta.description,
    alternates: { canonical: pathOf(locale), languages },
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: meta.title,
      description: meta.description,
      url: pathOf(locale),
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [image],
    },
  };
}
