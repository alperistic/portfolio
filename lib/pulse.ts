import { COMMITS } from "@/content/commits";
import type { Locale, ObjectId } from "@/content/types";

/** Woran zuletzt gearbeitet wurde: Objekt und Tag (YYYY-MM-DD) des letzten Commits. */
export type LastWork = { id: ObjectId; date: string };

/** Älter als das ist kein Lebenszeichen mehr — dann zeigt die Seite lieber nichts. */
const MAX_DAYS = 45;
const DAY = 86400000;

/**
 * Lebenszeichen: das Projekt mit dem jüngsten Commit (aus den Commit-Sternen,
 * also nur Datum und Anzahl). Am selben Tag gewinnt das mit mehr Commits.
 * Nur sichtbare Objekte zählen.
 */
export function lastWork(visible: ObjectId[]): LastWork | null {
  let best: (LastWork & { n: number }) | null = null;
  for (const id of visible) {
    const days = COMMITS.days[id];
    if (!days) continue;
    const date = Object.keys(days).sort().at(-1);
    if (!date) continue;
    const n = days[date];
    if (!best || date > best.date || (date === best.date && n > best.n)) best = { id, date, n };
  }
  return best && { id: best.id, date: best.date };
}

/**
 * „heute“, „gestern“, „vor 3 Tagen“, „vor 2 Wochen“ — gerechnet in Kalendertagen
 * der Besucherin. `null`, wenn es länger her ist als `MAX_DAYS` (oder in der Zukunft
 * liegt, z. B. bei falsch gehender Uhr).
 */
export function ago(date: string, locale: Locale, now = new Date()): string | null {
  const [y, m, d] = date.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - then.getTime()) / DAY);
  if (days < 0 || days > MAX_DAYS) return null;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return days < 14 ? rtf.format(-days, "day") : rtf.format(-Math.round(days / 7), "week");
}
