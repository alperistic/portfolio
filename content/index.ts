import { de } from "./de";
import { en } from "./en";
import type { CelestialContent, Locale, ObjectId, SiteContent } from "./types";

export type * from "./types";

const byLocale = { de, en } satisfies Record<Locale, SiteContent>;

/** Alle Sprachen der Seite; die erste ist die Standardsprache unter `/`. */
export const LOCALES = Object.keys(byLocale) as Locale[];

/** Pfad der Startseite einer Sprache: `/` für Deutsch, `/en/` für Englisch. */
export const pathOf = (locale: Locale) => (locale === LOCALES[0] ? "/" : `/${locale}/`);

/** Was auf der Seite landet: nur Objekte und Stationen mit `visible: "ja"`. */
export type PublicContent = Omit<SiteContent, "objects"> & {
  objects: Partial<Record<ObjectId, CelestialContent>>;
};

/** Sprachumschalter: alle Sprachen mit Pfad und Eigenname. */
export type LangLink = { locale: Locale; href: string; name: string };
export const langLinks = (): LangLink[] =>
  LOCALES.map((l) => ({ locale: l, href: pathOf(l), name: byLocale[l].ui.langName }));

/**
 * Liefert den öffentlichen Content einer Sprache. Läuft im Server Component
 * (beim statischen Export zur Build-Zeit) — ausgeblendete Einträge werden hier
 * entfernt und erreichen den Browser nie.
 */
export function getPublicContent(locale: Locale = "de"): PublicContent {
  const src = byLocale[locale];
  const objects: PublicContent["objects"] = {};
  for (const id of src.tourOrder) {
    const o = src.objects[id];
    if (o.visible !== "ja") continue;
    objects[id] = {
      ...o,
      stations: o.stations?.filter((s) => s.visible === "ja"),
    };
  }
  return {
    ...src,
    tourOrder: src.tourOrder.filter((id) => objects[id]),
    objects,
  };
}

/** Setzt `{name}` in eine UI-Vorlage ein, z. B. „{name} ansehen“. */
export const fill = (tpl: string, name: string) => tpl.replace("{name}", name);
