import type { MetadataRoute } from "next";
import { LOCALES, pathOf } from "@/content";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Beide Sprachfassungen, jeweils mit Verweis auf die andere (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (p: string) => new URL(p, siteUrl()).href;
  const languages = Object.fromEntries(LOCALES.map((l) => [l, abs(pathOf(l))]));
  return LOCALES.map((l) => ({ url: abs(pathOf(l)), alternates: { languages } }));
}
