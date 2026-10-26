import type { ObjectId } from "./types";

/**
 * Slot-Manifest der „Lebenden Collage" (`/collage`, Konzept: docs/konzept-collage.md).
 *
 * Hier stehen nur Bild-Slots und Bedien-Beschriftungen der Variante — alle Texte
 * über Alper und die Projekte kommen weiter aus `content/en.ts`.
 *
 * ECHTES MATERIAL EINHÄNGEN (ohne Code-Umbau):
 * 1. Datei nach `public/collage/` legen, z. B. `public/collage/dusk-water.jpg`
 *    (Foto: jpg/webp, lange Kante ca. 2000 px) oder einen kurzen Clip
 *    `public/collage/night-drive.mp4` (3–6 s, stumm, H.264, gern zusätzlich .webm).
 * 2. Beim passenden Slot `src: "/collage/dusk-water.jpg"` eintragen und `alt`
 *    so umschreiben, dass er das echte Bild beschreibt.
 * 3. Fertig: Der Platzhalter-Verlauf bleibt nur noch als Grundfarbe beim Laden.
 *
 * Person: freigestelltes Hochformat als PNG/WebP mit transparentem Hintergrund
 * nach `public/collage/person-01.webp`, dann `src` im Person-Slot setzen.
 * Die Figur wird unten verankert und skaliert auf Bildschirmhöhe.
 *
 * Nur eigenes oder lizenziertes Material — das Repo und die Seite sind öffentlich.
 */

/** Projekte, die eine eigene Szene und einen Einblick haben. */
export type CollageProject = Extract<ObjectId, "offerre" | "insertcoin" | "pipeline">;

export type ScenePlaceholder = {
  /** Slot-Name im Label unten links, z. B. „dusk-water". */
  label: string;
  /**
   * Stimmung als CSS-`background` (mehrere Verlaufs-Ebenen, oberste zuerst).
   * Nur für den Platzhalter — sobald `src` gesetzt ist, liegt das Bild darüber.
   */
  palette: string;
};

export type SceneSlot = {
  id: string;
  kind: "life" | "project";
  /** Nur bei `kind: "project"`: dessen Einblick fliegt ein, der Streifen leuchtet. */
  project?: CollageProject;
  /** Foto oder Clip unter `/collage/…`. Fehlt es, zeigt die Seite den Platzhalter. */
  src?: string;
  alt: string;
  placeholder: ScenePlaceholder;
  /** Standzeit im Zyklus (ms), ca. 3500–5000. */
  hold: number;
  /** Übergang IN diese Szene: harter Schnitt oder kurze Überblendung (~300 ms). */
  cut: "hard" | "fade";
  /** Wohin der Ken-Burns-Zoom zieht (CSS transform-origin). */
  focus?: string;
};

export type PersonSlot = {
  id: string;
  src?: string;
  alt: string;
  placeholder: { label: string };
};

/**
 * Alle Szenen-Slots. `kind: "life"` läuft im Zyklus der persönlichen Collage
 * (erster Bildschirm, Reihenfolge = Zyklus); `kind: "project"` gehört zur
 * Arbeits-Collage (zweites Kapitel), je Projekt genau eine.
 */
export const SCENES: SceneSlot[] = [
  {
    id: "dusk-water",
    kind: "life",
    alt: "Placeholder: dusk over water",
    hold: 4600,
    cut: "fade",
    focus: "50% 62%",
    placeholder: {
      label: "dusk-water",
      palette: [
        // heller Reflexstreifen auf dem Wasser
        "linear-gradient(90deg, transparent, rgba(255, 196, 140, 0.5) 50%, transparent) 50% 100% / 9% 38% no-repeat",
        "linear-gradient(90deg, transparent, rgba(255, 170, 120, 0.22) 50%, transparent) 50% 100% / 34% 38% no-repeat",
        // Sonne knapp unter dem Horizont
        "radial-gradient(22% 12% at 50% 62%, rgba(255, 186, 120, 0.75), transparent 70%)",
        // Wasser
        "linear-gradient(180deg, transparent 62%, #2a1527 62.4%, #120910 100%)",
        // Himmel: tiefes Violett → Orange
        "linear-gradient(180deg, #160d2b 0%, #3b1d46 28%, #7a3446 46%, #c8603c 60%, #e08a4e 62%)",
      ].join(", "),
    },
  },
  {
    id: "offerre-workshop",
    kind: "project",
    project: "offerre",
    alt: "Placeholder: workshop bench, warm wood under a lamp",
    hold: 4200,
    cut: "hard",
    focus: "30% 35%",
    placeholder: {
      label: "offerre-workshop",
      palette: [
        "radial-gradient(42% 38% at 30% 30%, rgba(255, 196, 112, 0.5), transparent 70%)",
        // Holzmaserung
        "repeating-linear-gradient(93deg, rgba(40, 18, 4, 0.28) 0 2px, transparent 2px 9px, rgba(255, 210, 150, 0.05) 9px 11px, transparent 11px 23px)",
        // Werkbank-Kante
        "linear-gradient(180deg, transparent 64%, rgba(20, 9, 2, 0.75) 64.5%, rgba(20, 9, 2, 0.4) 68%, transparent 72%)",
        "linear-gradient(160deg, #2e1b0c 0%, #6a4120 42%, #8a5a2b 55%, #2a170a 100%)",
      ].join(", "),
    },
  },
  {
    id: "night-drive",
    kind: "life",
    alt: "Placeholder: night drive, sodium street lights streaking past",
    hold: 3600,
    cut: "hard",
    focus: "70% 50%",
    placeholder: {
      label: "night-drive",
      palette: [
        // Natriumlicht-Streifen in Fahrtrichtung
        "repeating-linear-gradient(176deg, transparent 0 38px, rgba(255, 146, 44, 0.0) 38px, rgba(255, 152, 52, 0.55) 41px, rgba(255, 190, 110, 0.75) 42px, transparent 46px 97px)",
        "radial-gradient(60% 30% at 72% 46%, rgba(255, 130, 30, 0.28), transparent 70%)",
        "radial-gradient(30% 14% at 20% 78%, rgba(255, 80, 40, 0.18), transparent 70%)",
        "linear-gradient(180deg, #040306 0%, #0d0806 55%, #050304 100%)",
      ].join(", "),
    },
  },
  {
    id: "insertcoin-arcade",
    kind: "project",
    project: "insertcoin",
    alt: "Placeholder: arcade at night, magenta and cyan neon",
    hold: 4800,
    cut: "fade",
    focus: "50% 45%",
    placeholder: {
      label: "insertcoin-arcade",
      palette: [
        // Scanlines
        "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.28) 0 2px, transparent 2px 4px)",
        // Neon-Raster am Boden
        "linear-gradient(rgba(255, 70, 200, 0.4) 1px, transparent 1px) 0 100% / 100% 34px repeat-x",
        "radial-gradient(46% 52% at 22% 38%, rgba(255, 40, 190, 0.5), transparent 70%)",
        "radial-gradient(40% 46% at 80% 52%, rgba(30, 220, 255, 0.4), transparent 70%)",
        "linear-gradient(180deg, #0a0414 0%, #170926 60%, #07030d 100%)",
      ].join(", "),
    },
  },
  {
    id: "flowers",
    kind: "life",
    alt: "Placeholder: flowers in muted green and pink",
    hold: 4000,
    cut: "fade",
    focus: "40% 55%",
    placeholder: {
      label: "flowers",
      palette: [
        "radial-gradient(12% 10% at 26% 34%, rgba(226, 150, 168, 0.6), transparent 70%)",
        "radial-gradient(16% 13% at 70% 26%, rgba(214, 132, 150, 0.45), transparent 70%)",
        "radial-gradient(10% 8% at 58% 64%, rgba(236, 176, 186, 0.5), transparent 70%)",
        "radial-gradient(18% 14% at 14% 76%, rgba(190, 120, 140, 0.35), transparent 70%)",
        "radial-gradient(50% 40% at 50% 50%, rgba(92, 120, 78, 0.45), transparent 75%)",
        "linear-gradient(170deg, #182116 0%, #2c3a25 48%, #141a12 100%)",
      ].join(", "),
    },
  },
  {
    id: "pipeline-papers",
    kind: "project",
    project: "pipeline",
    alt: "Placeholder: paper files and quotes under cool desk light",
    hold: 4400,
    cut: "hard",
    focus: "60% 45%",
    placeholder: {
      label: "pipeline-papers",
      palette: [
        // Zeilen auf den Blättern
        "repeating-linear-gradient(180deg, rgba(30, 40, 58, 0.45) 0 1px, transparent 1px 16px) 58% 34% / 26% 40% no-repeat",
        "repeating-linear-gradient(180deg, rgba(30, 40, 58, 0.4) 0 1px, transparent 1px 16px) 86% 58% / 18% 34% no-repeat",
        // Papier
        "linear-gradient(#7e8084, #696d73) 58% 34% / 30% 46% no-repeat",
        "linear-gradient(#73767b, #5d6169) 86% 58% / 22% 40% no-repeat",
        "radial-gradient(50% 45% at 60% 35%, rgba(200, 214, 236, 0.22), transparent 70%)",
        "linear-gradient(180deg, #1c222c 0%, #2f3846 55%, #171b22 100%)",
      ].join(", "),
    },
  },
  {
    id: "close-up",
    kind: "life",
    alt: "Placeholder: objects in close-up, warm low light",
    hold: 3800,
    cut: "hard",
    focus: "65% 60%",
    placeholder: {
      label: "close-up",
      palette: [
        // Unschärfe-Lichter im Hintergrund
        "radial-gradient(4% 6% at 78% 22%, rgba(255, 200, 130, 0.55), transparent 70%)",
        "radial-gradient(6% 9% at 88% 40%, rgba(255, 170, 100, 0.35), transparent 70%)",
        "radial-gradient(3% 4.5% at 64% 14%, rgba(255, 220, 170, 0.45), transparent 70%)",
        // Gegenstand im Vordergrund
        "radial-gradient(34% 26% at 40% 68%, rgba(150, 92, 52, 0.7), transparent 70%)",
        "linear-gradient(200deg, #1d120b 0%, #3a2416 50%, #120b07 100%)",
      ].join(", "),
    },
  },
  {
    id: "close-up-02",
    kind: "life",
    alt: "Placeholder: second close-up, cool light at night",
    hold: 3500,
    cut: "fade",
    focus: "35% 40%",
    placeholder: {
      label: "close-up-02",
      palette: [
        "radial-gradient(26% 20% at 34% 42%, rgba(150, 190, 220, 0.35), transparent 70%)",
        "radial-gradient(3% 4% at 72% 30%, rgba(255, 214, 160, 0.5), transparent 70%)",
        "radial-gradient(5% 7% at 82% 64%, rgba(255, 180, 120, 0.25), transparent 70%)",
        "linear-gradient(150deg, #0c1016 0%, #1a2230 48%, #0b0d12 100%)",
      ].join(", "),
    },
  },
];

/** Persönliche Collage: nur Lebens-Szenen, im Zyklus. */
export const LIFE_SCENES = SCENES.filter((s) => s.kind === "life");
/** Arbeits-Collage: je Projekt eine Szene. */
export const PROJECT_SCENES = SCENES.filter((s) => s.kind === "project");

/** Freigestellte Fotos von Alper. Es steht immer nur eine Figur da. */
export const PERSON: PersonSlot[] = [
  {
    id: "person-01",
    alt: "Placeholder silhouette for a cut-out photo of Alper Bulat",
    placeholder: { label: "person-01" },
  },
];

/** Bedien-Beschriftungen nur dieser Variante (Englisch, wie die Route). */
export const COLLAGE_UI = {
  followX: "Follow on X",
  /** Sprung vom ersten Bildschirm zur Arbeits-Collage. */
  toWork: "Work",
  /** Überschrift der Arbeits-Collage. */
  shipped: "Shipped",
  builtUnder: "Built under",
  scene: "Scene",
  workScene: "Work",
  placeholder: "placeholder",
  sections: { work: "Work", path: "Path", stack: "Stack", contact: "Contact" },
  role: "Role",
  stack: "Stack",
} as const;
