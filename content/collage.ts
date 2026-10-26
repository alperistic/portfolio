import type { ObjectId } from "./types";

/**
 * Bild-Manifest der „Lebenden Collage" (`/collage`, Konzept: docs/konzept-collage.md, Runde 2).
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
 *    Fenster-Szenen lange Kante 1600 px, höchstens ca. 250 KB; Board-Stücke 720 px;
 *    Projekt-Stimmung 1000 px. Beispiel: `cwebp -resize 1600 0 -q 70 in.jpg -o out.webp`.
 * 2. Beim passenden Eintrag `src` umstellen, `alt` auf das echte Bild umschreiben
 *    und `standIn` löschen.
 * 3. Person: Hochformat vor ruhigem Hintergrund freistellen mit
 *    `swift scripts/cutout.swift foto.jpg public/collage/person-01.webp`
 *    und im Person-Eintrag eintragen. Die Figur steht unten im Fenster und ragt oben heraus.
 * 4. Ist kein Ersatzbild mehr übrig: `public/collage/standin/` samt CREDITS.md löschen.
 *
 * Nur eigenes oder lizenziertes Material — das Repo und die Seite sind öffentlich.
 */

/** Projekte mit eigenem Stück auf dem Arbeits-Board. */
export type CollageProject = Extract<ObjectId, "offerre" | "insertcoin" | "pipeline">;

export type Photo = {
  src: string;
  alt: string;
  /** Ersatzbild von Unsplash, wird durch Alpers eigenes Foto ersetzt. */
  standIn?: true;
};

export type SceneSlot = Photo & {
  id: string;
  /** Standzeit im Fenster (ms), ca. 3500–5000. */
  hold: number;
  /** Übergang IN diese Szene: harter Schnitt oder kurze Überblendung (~350 ms). */
  cut: "hard" | "fade";
  /** Bildausschnitt im Fenster und Richtung des leichten Zooms (CSS object-position). */
  focus?: string;
};

/** Ein Foto-Stück auf dem persönlichen Board. Position/Drehung macht das CSS (`.b-piece--<id>`). */
export type PieceSlot = {
  id: string;
  /** Erstes Bild und Ersatz-Bilder, zwischen denen das Stück ab und zu wechselt. */
  photos: Photo[];
  /** Mono-Beschriftung auf einem Papierstreifen am Stück (Text aus content, siehe Hero). */
  label?: "place" | "since";
};

/** Fenster-Szenen des ersten Bildschirms, Reihenfolge = Zyklus. Die erste lädt priorisiert. */
export const LIFE_SCENES: SceneSlot[] = [
  {
    id: "dusk-water",
    src: "/collage/standin/scene-dusk-water.webp",
    alt: "Stand-in photo: a bridge in silhouette over a river at sunset",
    standIn: true,
    hold: 4600,
    cut: "fade",
    focus: "50% 60%",
  },
  {
    id: "night-street",
    src: "/collage/standin/scene-night-street.webp",
    alt: "Stand-in photo: a city street at night, lights reflecting on wet asphalt",
    standIn: true,
    hold: 3600,
    cut: "hard",
    focus: "50% 70%",
  },
  {
    id: "flowers-dusk",
    src: "/collage/standin/scene-flowers-dusk.webp",
    alt: "Stand-in photo: a field of flowers at dusk, blurred by motion",
    standIn: true,
    hold: 4000,
    cut: "fade",
    focus: "50% 55%",
  },
  {
    id: "close-up-coffee",
    src: "/collage/standin/scene-close-up-coffee.webp",
    alt: "Stand-in photo: a glass of coffee on a wooden table, café lights behind",
    standIn: true,
    hold: 3600,
    cut: "hard",
    focus: "35% 60%",
  },
  {
    id: "train-window",
    src: "/collage/standin/scene-train-window.webp",
    alt: "Stand-in photo: the view from a moving train, blurred",
    standIn: true,
    hold: 3800,
    cut: "hard",
    focus: "40% 50%",
  },
  {
    id: "city-dusk",
    src: "/collage/standin/scene-city-dusk.webp",
    alt: "Stand-in photo: a city at dusk, streets lit up",
    standIn: true,
    hold: 4400,
    cut: "fade",
    focus: "50% 50%",
  },
];

/** Stücke rund ums Fenster. Wenige, echte Stücke; auf dem Handy nur die ersten zwei. */
export const PIECES: PieceSlot[] = [
  {
    id: "lamp",
    label: "place",
    photos: [
      { src: "/collage/standin/piece-lamp.webp", alt: "Stand-in photo: a street lamp beside a tree at night", standIn: true },
    ],
  },
  {
    id: "candle",
    label: "since",
    photos: [
      { src: "/collage/standin/piece-candle.webp", alt: "Stand-in photo: a small candle on a café table", standIn: true },
      { src: "/collage/standin/piece-train-dusk.webp", alt: "Stand-in photo: a field at dusk through a train window", standIn: true },
    ],
  },
  {
    id: "roofs",
    photos: [
      { src: "/collage/standin/piece-roofs.webp", alt: "Stand-in photo: red tiled roofs from above", standIn: true },
    ],
  },
  {
    id: "flowers",
    photos: [
      { src: "/collage/standin/piece-flowers.webp", alt: "Stand-in photo: orange flowers in close-up", standIn: true },
    ],
  },
];

/** Freigestellte Figur (PNG/WebP mit Transparenz). Es steht immer nur eine da. */
export const PERSON: Photo & { width: number; height: number } = {
  src: "/collage/standin/person-01.webp",
  alt: "Stand-in photo: a young man in a light blue shirt, cut out (placeholder for a photo of Alper Bulat)",
  standIn: true,
  width: 882,
  height: 1600,
};

/** Stimmungsfoto je Projekt auf dem Arbeits-Board, neben dem echten Einblick aus public/work/. */
export const PROJECT_MOOD: Record<CollageProject, Photo> = {
  offerre: {
    src: "/collage/standin/mood-offerre-workshop.webp",
    alt: "Stand-in photo: a workshop table with papers in window light",
    standIn: true,
  },
  insertcoin: {
    src: "/collage/standin/mood-insertcoin-arcade.webp",
    alt: "Stand-in photo: a row of lit arcade machines",
    standIn: true,
  },
  pipeline: {
    src: "/collage/standin/mood-pipeline-papers.webp",
    alt: "Stand-in photo: a stack of old files tied with string",
    standIn: true,
  },
};

/** Material des Boards und der Papierstreifen (Hintergründe im CSS, hier nur zur Übersicht). */
export const MATERIAL = {
  board: "/collage/standin/board.webp",
  paper: "/collage/standin/paper.webp",
} as const;

/** Bedien-Beschriftungen nur dieser Variante (Englisch, wie die Route). */
export const COLLAGE_UI = {
  followX: "Follow on X",
  /** Sprung vom ersten Bildschirm zum Arbeits-Board. */
  toWork: "Work",
  builtUnder: "Built under",
  sections: { work: "Work", path: "Path", stack: "Stack", contact: "Contact" },
  role: "Role",
  stack: "Stack",
} as const;
