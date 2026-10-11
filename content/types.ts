/**
 * Content-Modell der Seite. Quelle der Wahrheit ist `docs/content.md` —
 * hier stehen nur die dort freigegebenen Texte, typisiert und je Sprache.
 */

/** Sichtbarkeit wie in docs/content.md: nur `ja` erscheint auf der Seite. */
export type Visibility = "ja" | "nein" | "offen";

/** Alle Himmelsobjekte. Die Reihenfolge der Tour steht in `tourOrder`. */
export type ObjectId =
  | "alper"
  | "werdegang"
  | "offerre"
  | "pipeline"
  | "insertcoin"
  | "late"
  | "skills"
  | "kontakt";

export type Tag = {
  text: string;
  /** Akzentfarbe des Punktes im Tag (CSS-Farbe). */
  color?: string;
  /** Gestrichelter Rahmen: noch offen / Platzhalter. */
  placeholder?: boolean;
};

export type Fact = {
  label: string;
  /** Mehrere Werte werden als Liste gerendert. */
  value: string | string[];
  /** Darstellung mehrerer Werte: Liste (Standard) oder kompakte Chips (z. B. Stack). */
  display?: "list" | "chips";
};

export type LinkItem = {
  label: string;
  text: string;
  /** Ohne `href` wird der Eintrag als klar markierter Platzhalter gezeigt. */
  href?: string;
};

export type Station = {
  /** Kurzform für das Label am Stern, z. B. „2020“. */
  year: string;
  /** Zeitraum wie in docs/content.md. */
  period: string;
  title: string;
  detail?: string;
  visible: Visibility;
};

/**
 * Eine Skill-Gruppe = ein heller Stern im Sternhaufen. Jeder Eintrag in
 * `skills` wird ein eigener kleiner Stern um den Gruppen-Stern herum —
 * neuer Skill = neuer Eintrag, der Haufen ordnet sich selbst.
 */
export type SkillGroup = {
  title: string;
  skills: string[];
};

/**
 * Ein Einblick in die Arbeit: Screenshot oder kurzer stummer Clip im Panel.
 * Dateien liegen unter `public/work/`. Nur Material ohne echte Kunden- oder
 * Personendaten (Demo- und Beispieldaten).
 */
export type Media = {
  /** Bild bzw. Standbild des Clips, z. B. „/work/offerre-entwurf.webp“. */
  src: string;
  /** Clip-Quellen in Wunschreihenfolge (webm vor mp4); ohne = nur Bild. */
  video?: string[];
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Pixel-Art: beim Skalieren scharf lassen statt weichzeichnen. */
  pixelated?: boolean;
};

export type CelestialContent = {
  id: ObjectId;
  visible: Visibility;
  /** Label im Himmel (Großbuchstaben via CSS). */
  label: string;
  /** Kleine Zeile unter dem Label. */
  meta: string;
  /** Kicker oben im Panel. */
  kicker: string;
  title: string;
  tags: Tag[];
  lead: string;
  /** Einblick direkt unter dem Lead. */
  media?: Media;
  body?: string[];
  quote?: string;
  facts?: Fact[];
  stations?: Station[];
  skillGroups?: SkillGroup[];
  links?: LinkItem[];
};

export type Locale = "de" | "en";

export type SiteContent = {
  locale: Locale;
  meta: { title: string; description: string };
  brand: { name: string; subline: string };
  ui: {
    loading: string;
    dragHint: string;
    tourStart: string;
    back: string;
    backFromCenter: string;
    next: string;
    restart: string;
    close: string;
    center: string;
    /** Knopf-Beschriftung für Screenreader, `{name}` wird ersetzt. */
    lookAt: string;
    legend: string;
    tourStep: string;
    canvasLabel: string;
    langGroup: string;
    /** Name der Sprache in ihrer eigenen Sprache (für den Umschalter). */
    langName: string;
    /** Umschalter Himmel → Liste bzw. zurück. */
    listView: string;
    skyView: string;
    /** Kurzhilfe für die Tastatur (sichtbar, sobald man per Tab einsteigt). */
    keysHint: string;
    /** Überschrift des Inhaltsverzeichnisses in der Listenansicht. */
    contents: string;
    /** Warum die Listenansicht automatisch kam. */
    fallback: {
      webgl: string;
      weak: string;
      slow: string;
      lost: string;
      load: string;
    };
    tryAnyway: string;
    /** Eröffnung überspringen. */
    skipIntro: string;
    /** Klang an/aus (Umschalter). */
    sound: string;
    /** Tour-Autopilot starten bzw. anhalten. */
    autoPlay: string;
    autoPause: string;
    /** Einblick vergrößern bzw. Vergrößerung schließen. */
    enlarge: string;
    shrink: string;
  };
  tourOrder: ObjectId[];
  objects: Record<ObjectId, CelestialContent>;
};
