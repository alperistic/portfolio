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
  | "fern"
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
  /** Beginn für das Label am Stern, z. B. „2020“ oder „10/2020“. */
  year: string;
  /** Zeitraum wie in docs/content.md. */
  period: string;
  title: string;
  detail?: string;
  /** Hellster Stern des Sternbilds (höchstens eine Station). */
  highlight?: boolean;
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
  /**
   * Ganzes Bild für die Vergrößerung, wenn `src` nur ein Ausschnitt ist
   * (im Panel ist der Ausschnitt lesbar, die Vollansicht zeigt alles).
   */
  full?: string;
  /** Clip-Quellen in Wunschreihenfolge (webm vor mp4); ohne = nur Bild. */
  video?: string[];
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Pixel-Art: beim Skalieren scharf lassen statt weichzeichnen. */
  pixelated?: boolean;
};

/**
 * Ein Eintrag der „Goldenen Platte“ (ferne Galaxie): ein persönlicher Einblick.
 * Nur `title` ist Pflicht; Notiz, Bild/Clip und Link sind optional. Neue Spur =
 * neuer Eintrag in `tracks`, die Nummer ergibt sich aus der Reihenfolge.
 */
export type Track = {
  title: string;
  note?: string;
  media?: Media;
  link?: { text: string; href: string };
  visible: Visibility;
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
  /** Leer (`""`) = kein Lead-Absatz. */
  lead: string;
  /** Einblick direkt unter dem Lead. */
  media?: Media;
  body?: string[];
  quote?: string;
  facts?: Fact[];
  stations?: Station[];
  skillGroups?: SkillGroup[];
  /** Spuren der Goldenen Platte, in Reihenfolge. */
  tracks?: Track[];
  links?: LinkItem[];
};

export type Locale = "de" | "en";

export type SiteContent = {
  locale: Locale;
  meta: { title: string; description: string };
  brand: {
    name: string;
    subline: string;
    /** Folgen-Hinweis (X), z. B. für Kopfzeile und JSON-LD `sameAs`. */
    follow: { label: string; handle: string; href: string };
  };
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
    /** Externer Link eines Projekts im Titelbild, `{name}` wird ersetzt. */
    open: string;
    /** Einblick vergrößern bzw. Vergrößerung schließen. */
    enlarge: string;
    shrink: string;
    /** Clip im Einblick abspielen bzw. anhalten (eigene Bedienung). */
    play: string;
    pause: string;
    /** Erklärt die Commit-Sterne im Panel der Projekte, die welche haben. */
    commitNote: string;
    /** Erklärt den Jahresring (GitHub-Beiträge) im Panel von Alper. */
    ringNote: string;
    /** Lebenszeichen im Titelbild und am Label: „Zuletzt dran · gestern“. */
    lastWork: string;
    /** Jahresring anhören bzw. anhalten (Knopf im Panel von Alper; schaltet den Ton an). */
    ringPlay: string;
    ringStop: string;
  };
  /**
   * Konsole (Taste „/“ im Himmel): kleine Kommandozeile für Neugierige. Antworten
   * bewusst kurz, klein geschrieben, in Alpers Ton. `{name}` wird jeweils ersetzt.
   */
  term: {
    /** Name der Region für Screenreader. */
    label: string;
    /** Erste Zeile beim Öffnen. */
    hello: string;
    /** Hinweis in der Browser-Konsole (DevTools) für die, die da reinschauen. */
    devtools: string;
    /** Befehle mit Kurzbeschreibung für `help`. */
    help: [string, string][];
    unknown: string;
    noPlace: string;
    noLink: string;
    /** `whoami` — `{name}` ist Name und Unterzeile. */
    whoami: string;
    lastNone: string;
    soundOn: string;
    soundOff: string;
    play: string;
    stop: string;
    /** Name des versteckten schwarzen Lochs in `ls -a` und Antwort beim Hinsehen. */
    hole: string;
    holeSay: string;
    /** Kleine Antworten auf Dinge, die man halt mal eintippt. */
    eggs: Record<string, string>;
  };
  tourOrder: ObjectId[];
  objects: Record<ObjectId, CelestialContent>;
};
