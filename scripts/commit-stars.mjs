#!/usr/bin/env node
/**
 * Erzeugt content/commits.ts: Commits je Projekt und Tag, als Daten für die
 * Commit-Sterne im Himmel. Läuft lokal gegen die eigenen Checkouts (auch private
 * Repos) und liest nur Datum und Anzahl — keine Nachrichten, keine Autoren, keinen Code.
 *
 *   node scripts/commit-stars.mjs offerre=~/Projekte/quotegen insertcoin=~/Projekte/insertcoin \
 *     pipeline=~/Projekte/evidence-first-doc-pipeline late=~/Projekte/oneos
 *
 * Gezählt wird der Hauptzweig auf dem Remote (origin/main bzw. origin/master),
 * ohne Merge-Commits. Vorher `git fetch` in den Repos, damit der Stand aktuell ist.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";

const ids = ["alper", "werdegang", "offerre", "pipeline", "insertcoin", "late", "skills", "kontakt"];
const days = {};
for (const arg of process.argv.slice(2)) {
  const [id, raw] = arg.split("=");
  if (!ids.includes(id) || !raw) throw new Error(`Ungültig: ${arg} (erwartet id=pfad)`);
  const dir = raw.replace(/^~/, homedir());
  const git = (...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" }).trim();
  const ref = ["origin/main", "origin/master", "HEAD"].find((r) => {
    try {
      git("rev-parse", "--verify", "-q", r);
      return true;
    } catch {
      return false;
    }
  });
  const counts = {};
  for (const d of git("log", "--no-merges", "--format=%cs", ref).split("\n").filter(Boolean)) counts[d] = (counts[d] ?? 0) + 1;
  days[id] = Object.fromEntries(Object.entries(counts).sort());
  console.log(`${id}: ${Object.values(counts).reduce((a, b) => a + b, 0)} Commits (${ref})`);
}

const asOf = new Date().toISOString().slice(0, 10);
const body = `import type { ObjectId } from "./types";

/**
 * Commits je Projekt und Tag — Grundlage der Commit-Sterne (ein Stern je Commit).
 * Erzeugt von scripts/commit-stars.mjs, nicht von Hand bearbeiten.
 * Enthält nur Datum und Anzahl, keine Nachrichten oder Autoren.
 */
export const COMMITS: { asOf: string; days: Partial<Record<ObjectId, Record<string, number>>> } = ${JSON.stringify({ asOf, days }, null, 2)};
`;
writeFileSync(new URL("../content/commits.ts", import.meta.url), body);
console.log("content/commits.ts geschrieben, Stand", asOf);
