import type { ObjectId } from "@/content/types";

/**
 * Wo die Objekte am Himmel stehen: Azimut (yaw) und Höhe (pitch) in Grad vom
 * Zentrum aus, Entfernung in Szene-Einheiten. Reine Daten — die UI nutzt sie
 * für die Koordinatenzeile im Panel, die Engine zum Platzieren.
 * Nicht alles liegt im Startblickfeld (yaw ≈ ±40°): Umdrehen soll sich lohnen.
 */
export const LAYOUT: Record<ObjectId, { yaw: number; pitch: number; dist: number }> = {
  alper: { yaw: 0, pitch: 3, dist: 74 },
  werdegang: { yaw: -50, pitch: 19, dist: 92 },
  offerre: { yaw: 40, pitch: -12, dist: 118 },
  pipeline: { yaw: 88, pitch: 7, dist: 84 },
  insertcoin: { yaw: 136, pitch: -7, dist: 92 },
  late: { yaw: 96, pitch: 36, dist: 150 },
  skills: { yaw: -158, pitch: 12, dist: 96 },
  kontakt: { yaw: -108, pitch: -6, dist: 78 },
};

/** Akzentfarbe je Objekt — für Kompass-Marker und Legende (passend zur Szene). */
export const ACCENT: Record<ObjectId, string> = {
  alper: "#f1c98e",
  werdegang: "#d4dcff",
  offerre: "#b7c3ff",
  pipeline: "#8fb0ff",
  insertcoin: "#ff7ad9",
  late: "#a99bff",
  skills: "#8fc1ff",
  kontakt: "#8fe3ff",
};

/** Die Projekte, die Lates Filamente verbinden. */
export const LATE_LINKS: ObjectId[] = ["offerre", "insertcoin", "pipeline"];

/**
 * Blickrichtung (Grad) der Late-Übersicht: schräg von oben auf Knoten + Projekte.
 * So gewählt, dass die Kamera weit weg von Kontakt und Skills steht und sich die
 * drei Projekte im Bild nicht überdecken.
 */
export const LATE_VIEW = { yaw: 68, pitch: -25 };

const pad = (n: number, l = 3) => String(Math.round(Math.abs(n))).padStart(l, "0");

/** „AZ 040° · ALT −12° · 118 AE“ — Koordinatenzeile fürs Panel. */
export function coordsOf(id: ObjectId) {
  const { yaw, pitch, dist } = LAYOUT[id];
  const az = ((yaw % 360) + 360) % 360;
  return `AZ ${pad(az)}° · ALT ${pitch < 0 ? "−" : "+"}${pad(pitch, 2)}° · ${dist} AE`;
}
