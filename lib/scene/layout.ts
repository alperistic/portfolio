import type { ObjectId } from "@/content/types";

/**
 * Wo die Objekte am Himmel stehen: Azimut (yaw) und Höhe (pitch) in Grad vom
 * Zentrum aus, Entfernung in Szene-Einheiten. Reine Daten für die Engine.
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

/**
 * Startblick der Übersicht (Grad). Die Sonne steht rechts oberhalb der Bildmitte,
 * damit unten links Platz für das Titelbild bleibt; hochkant (Mobil) in der oberen
 * Hälfte über dem Titelbild. Die Eröffnung blickt zuerst genau auf die Sonne
 * (`INTRO_VIEW`, der Sternenstaub startet in der Bildmitte) und schwenkt nach der
 * Titelkarte hierher. Pitch < Sonnenhöhe = Kamera blickt tiefer, die Sonne steigt im Bild.
 */
export const START_VIEW = {
  desktop: { yaw: -4, pitch: -5 },
  mobile: { yaw: 0, pitch: -15 },
};
export const INTRO_VIEW = { yaw: LAYOUT.alper.yaw, pitch: LAYOUT.alper.pitch };

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
