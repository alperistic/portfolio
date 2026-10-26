import type { ObjectId } from "./types";

/**
 * Bild-Manifest der „Lebenden Collage" (`/collage`, Konzept: docs/konzept-collage.md, Runde 3).
 *
 * Hier stehen nur Bilder und Bedien-Beschriftungen der Variante. Alle Texte über
 * Alper und die Projekte kommen weiter aus `content/en.ts`.
 *
 * ERSATZBILDER: Alles mit `standIn: true` ist ein Ersatzfoto von Unsplash (Unsplash
 * License, Liste mit Fotograf und Quelle: public/collage/standin/CREDITS.md). Die Figur
 * ist ein fremder Mensch als Stellvertreter, nicht Alper.
 *
 * EIGENE FOTOS EINHÄNGEN (ohne Code-Umbau):
 * 1. Datei nach `public/collage/` legen (nicht nach `standin/`), als WebP:
 *    Clip-Szenen lange Kante 1600 px, höchstens ca. 200 KB; Photo-Dump-Bilder 760 px,
 *    ca. 20–50 KB. Beispiel: `cwebp -resize 1600 0 -q 60 in.jpg -o out.webp`.
 * 2. Beim passenden Eintrag `src` umstellen, `alt`/`title` auf das echte Bild umschreiben
 *    und `standIn` löschen. Kurze Clips (3–6 s, stumm) kommen später als eigener Typ dazu.
 * 3. Person: Foto vor ruhigem Hintergrund freistellen mit
 *    `swift scripts/cutout.swift foto.jpg public/collage/person-01.webp`,
 *    auf Hüfthöhe zuschneiden und im Person-Eintrag eintragen (Breite/Höhe anpassen).
 * 4. Ist kein Ersatzbild mehr übrig: `public/collage/standin/` samt CREDITS.md löschen.
 *
 * Nur eigenes oder lizenziertes Material — das Repo und die Seite sind öffentlich.
 */

/** Projekte mit eigenem Track. */
export type CollageProject = Extract<ObjectId, "offerre" | "insertcoin" | "pipeline">;

export type Photo = {
  src: string;
  alt: string;
  /** Ersatzbild von Unsplash, wird durch Alpers eigenes Foto ersetzt. */
  standIn?: true;
};

/** Farbstimmung einer Szene im Camcorder-Look. */
export type Tint = "night" | "violet" | "golden";

export type ClipScene = Photo & {
  id: string;
  /** Kapitel-Titel in der Player-Leiste (klein, Kleinbuchstaben). */
  title: string;
  /** Standzeit (ms), ca. 2200–4000: harte Schnitte im Rhythmus. */
  hold: number;
  tint: Tint;
  /**
   * Übergang IN diese Szene, sparsam: `double` = die vorige Szene liegt noch kurz als
   * Doppelbelichtung darüber, `mirror` = die Szene startet kurz gespiegelt. Sonst harter Schnitt.
   */
  fx?: "double" | "mirror";
  /** Bildausschnitt (CSS object-position). */
  focus?: string;
};

/** Clip-Szenen der Startseite, Reihenfolge = Ablauf. Die erste lädt priorisiert. */
export const CLIP_SCENES: ClipScene[] = [
  {
    id: "tram",
    title: "night tram",
    src: "/collage/standin/scene-tram.webp",
    alt: "Stand-in photo: a tram at a stop at night, blue light",
    standIn: true,
    hold: 3400,
    tint: "night",
    focus: "62% 55%",
  },
  {
    id: "kiosk",
    title: "kiosk",
    src: "/collage/standin/scene-kiosk.webp",
    alt: "Stand-in photo: a brightly lit street kiosk at night",
    standIn: true,
    hold: 2600,
    tint: "night",
    focus: "50% 58%",
  },
  {
    id: "golden",
    title: "golden hour",
    src: "/collage/standin/scene-golden-bike.webp",
    alt: "Stand-in photo: a city street at sunset, the sun between the buildings",
    standIn: true,
    hold: 3200,
    tint: "golden",
    fx: "double",
    focus: "55% 50%",
  },
  {
    id: "altbau",
    title: "altbau",
    src: "/collage/standin/scene-facade.webp",
    alt: "Stand-in photo: an old apartment building facade with balconies",
    standIn: true,
    hold: 2400,
    tint: "golden",
    focus: "50% 40%",
  },
  {
    id: "u-bahn",
    title: "u-bahn",
    src: "/collage/standin/scene-ubahn.webp",
    alt: "Stand-in photo: a subway station with a glowing purple wall",
    standIn: true,
    hold: 3000,
    tint: "violet",
    fx: "mirror",
    focus: "50% 60%",
  },
  {
    id: "platform",
    title: "platform",
    src: "/collage/standin/scene-train-blur.webp",
    alt: "Stand-in photo: a red train rushing into a station, blurred",
    standIn: true,
    hold: 2200,
    tint: "night",
    focus: "45% 50%",
  },
  {
    id: "walk",
    title: "walk home",
    src: "/collage/standin/scene-friends-2.webp",
    alt: "Stand-in photo: two people walking down a sidewalk at night, seen from behind",
    standIn: true,
    hold: 3200,
    tint: "night",
    fx: "double",
    focus: "50% 62%",
  },
  {
    id: "room",
    title: "room",
    src: "/collage/standin/scene-room.webp",
    alt: "Stand-in photo: a dim bedroom with an unmade bed and the city in the window",
    standIn: true,
    hold: 3000,
    tint: "violet",
    focus: "50% 55%",
  },
];

/** Freigestellte Figur (WebP mit Transparenz, Hüfte aufwärts). Steht unten im Clip. */
export const PERSON: Photo & { width: number; height: number } = {
  src: "/collage/standin/person-01.webp",
  alt: "Stand-in photo: a young man in a black jacket, cut out (placeholder for a photo of Alper Bulat)",
  standIn: true,
  width: 810,
  height: 1380,
};

/**
 * Stimmungsbilder je Track (Photo-Dump neben dem echten Einblick aus public/work/).
 * Reihenfolge = Plätze in der Collage; auf dem Handy nur die ersten drei.
 */
export const DUMP: Record<CollageProject, Photo[]> = {
  offerre: [
    { src: "/collage/standin/dump-offerre-1.webp", alt: "Stand-in photo: a workshop with workbenches in window light", standIn: true },
    { src: "/collage/standin/dump-offerre-2.webp", alt: "Stand-in photo: a bench vise in close-up", standIn: true },
    { src: "/collage/standin/dump-offerre-3.webp", alt: "Stand-in photo: a hand carving wood", standIn: true },
    { src: "/collage/standin/dump-offerre-4.webp", alt: "Stand-in photo: offcuts of wood on a table", standIn: true },
    { src: "/collage/standin/dump-offerre-5.webp", alt: "Stand-in photo: tools on a wooden workbench, from above", standIn: true },
  ],
  insertcoin: [
    { src: "/collage/standin/dump-insertcoin-1.webp", alt: "Stand-in photo: a row of lit arcade machines", standIn: true },
    { src: "/collage/standin/dump-insertcoin-2.webp", alt: "Stand-in photo: an arcade room in neon light", standIn: true },
    { src: "/collage/standin/dump-insertcoin-3.webp", alt: "Stand-in photo: a purple neon heart on a wall", standIn: true },
    { src: "/collage/standin/dump-insertcoin-4.webp", alt: "Stand-in photo: a basketball arcade machine showing 00", standIn: true },
    { src: "/collage/standin/dump-insertcoin-5.webp", alt: "Stand-in photo: two skee-ball lanes glowing blue", standIn: true },
  ],
  pipeline: [
    { src: "/collage/standin/dump-pipeline-1.webp", alt: "Stand-in photo: stacks of paper documents and file folders", standIn: true },
    { src: "/collage/standin/dump-pipeline-2.webp", alt: "Stand-in photo: an office building at night, windows lit", standIn: true },
    { src: "/collage/standin/dump-pipeline-3.webp", alt: "Stand-in photo: a row of worn binders on a shelf", standIn: true },
    { src: "/collage/standin/dump-pipeline-4.webp", alt: "Stand-in photo: hands going through papers on a table", standIn: true },
    { src: "/collage/standin/dump-pipeline-5.webp", alt: "Stand-in photo: an office late at night, seen through glass", standIn: true },
  ],
};

/** Bedien-Beschriftungen nur dieser Variante (Englisch, wie die Route). */
export const COLLAGE_UI = {
  followX: "Follow on X",
  play: "Play",
  pause: "Pause",
  /** Kapitel-Sprung in der Player-Leiste, z. B. „Scene 3: golden hour“. */
  scene: "Scene",
  tracklist: "Tracklist",
  toTracklist: "Tracklist",
  label: "Label",
  track: "Track",
  role: "Role",
  stack: "Stack",
  realWork: "From the product",
  sections: { work: "Work", path: "Path", stack: "Stack", contact: "Contact" },
} as const;
