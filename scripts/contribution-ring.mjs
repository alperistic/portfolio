#!/usr/bin/env node
/**
 * Erzeugt content/contributions.ts: Alpers GitHub-Beiträge je Tag im letzten Jahr,
 * als Daten für den Jahresring um die Sonne. Liest den Beitragskalender über die
 * GitHub-API des angemeldeten `gh` (private Repos zählen dort nur als Anzahl mit)
 * und speichert nur Datum und Anzahl — keine Repos, keine Nachrichten.
 *
 *   node scripts/contribution-ring.mjs
 *
 * Voraussetzung: `gh auth status` zeigt das Konto, dessen Kalender gemeint ist.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const query = `query {
  viewer { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } }
}`;
const res = JSON.parse(execFileSync("gh", ["api", "graphql", "-f", `query=${query}`], { encoding: "utf8" }));
let days = res.data.viewer.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

const DAY = 86400000;
const t = (d) => Date.parse(`${d}T00:00:00Z`);
// Das Raster beginnt an einem Sonntag; eine angebrochene erste Woche fällt weg
while (days.length && new Date(t(days[0].date)).getUTCDay() !== 0) days = days.slice(1);
if (!days.length) throw new Error("Keine Beitragstage erhalten");
days.forEach((d, i) => {
  if (i && t(d.date) - t(days[i - 1].date) !== DAY) throw new Error(`Lücke im Kalender vor ${d.date}`);
});

const from = days[0].date;
const asOf = days[days.length - 1].date;
const counts = days.map((d) => d.contributionCount);
// eine Woche je Zeile (So … Sa), damit Diffs lesbar bleiben
const weeks = [];
for (let i = 0; i < counts.length; i += 7) weeks.push(`    ${counts.slice(i, i + 7).join(", ")},`);
const body = `/**
 * GitHub-Beiträge je Tag im letzten Jahr — Grundlage des Jahresrings um die Sonne
 * (ein Lichtpunkt je Tag). Erzeugt von scripts/contribution-ring.mjs, nicht von Hand
 * bearbeiten. Enthält nur Datum und Anzahl; private Beiträge stecken nur in der Anzahl.
 *
 * \`counts[i]\` ist der Tag \`from + i\`: Wochentag \`i % 7\` (0 = Sonntag), Woche \`floor(i / 7)\`.
 */
export const CONTRIBUTIONS: { asOf: string; from: string; counts: number[] } = {
  asOf: "${asOf}",
  from: "${from}",
  counts: [
${weeks.join("\n")}
  ],
};
`;
writeFileSync(new URL("../content/contributions.ts", import.meta.url), body);
const active = counts.filter((n) => n > 0).length;
console.log(`content/contributions.ts geschrieben: ${counts.length} Tage ab ${from}, ${active} aktiv, Stand ${asOf}`);
