import type * as THREE from "three";
import type { CommitHost } from "./commits";
import type { Rng } from "./util";

export type Uniform<T> = { value: T };

export type Quality = {
  small: boolean;
  stars: number;
  galaxy: number;
  motes: number;
  web: number;
  cluster: number;
  cube: number;
  msaa: number;
};

/** Gemeinsamer Bau-Kontext für alle Szene-Module. */
export type SceneCtx = {
  q: Quality;
  rng: Rng;
  pr: number;
  uTime: Uniform<number>;
  /** Pixel pro Welteinheit in Distanz 1 (für größenrichtige Punkte). */
  uProj: Uniform<number>;
  /** Flächen, die jedes Frame zur Kamera gedreht werden. */
  billboards: THREE.Object3D[];
  /**
   * Rechnet einen statischen Shader einmal beim Start in eine Textur (wie die
   * Himmels-Cubemap). Teure Rauschfelder kosten dann pro Frame nur einen Lookup.
   * Der Fragment-Shader bekommt `vUv` und schreibt `gl_FragColor`.
   */
  bake: (o: BakeOptions) => THREE.Texture;
};

export type BakeOptions = {
  width: number;
  height: number;
  fragmentShader: string;
  uniforms?: Record<string, THREE.IUniform>;
  defines?: Record<string, string | number>;
};

export type FrameState = {
  now: number;
  dt: number;
  /** Animationsfaktor: 1 normal, < 1 bei prefers-reduced-motion. */
  rs: number;
  camera: THREE.PerspectiveCamera;
  focused: string | null;
  /** Weicher Hover/Fokus-Wert (0…1) eines anderen Objekts, z. B. für Lates Filamente. */
  level: (id: string) => number;
  /** Aktive Untergruppe des fokussierten Objekts (z. B. Skill-Gruppe im Haufen), sonst null. */
  sub: number | null;
  /** Ereignis nach außen melden (z. B. Pulsar-Blitz → Klang). */
  emit: (event: SceneEvent) => void;
};

/** Ereignisse, die Objekte melden können. */
export type SceneEvent = { type: "pulse"; id: string };

/** Ein Himmelsobjekt, wie die Engine es kennt. */
export type Celestial = {
  root: THREE.Object3D;
  /** 0…1, wird von der Engine für Hover/Fokus weich angesteuert. */
  hover: Uniform<number>;
  /** Sichtbarer Radius — bestimmt den Anflugabstand. */
  visR: number;
  /** Abstand des Labels unter dem Objekt. */
  labelR: number;
  /** Radius der unsichtbaren Klickfläche. */
  hitR: number;
  /**
   * Anker für Unter-Labels (Stationen, Skill-Gruppen). `userData.side` ("l" | "r")
   * gibt die bevorzugte Seite des Labels vor.
   */
  anchors?: THREE.Object3D[];
  /** Anker zweiter Ebene je Anker (einzelne Skills je Gruppe). */
  childAnchors?: THREE.Object3D[][];
  /**
   * Übersicht statt Nahaufnahme: Welt-Kugeln (Mitte + Radius), die beim Anflug
   * gemeinsam ins Bild sollen, und die Blickrichtung dafür. Late nutzt das, um
   * Knoten + verbundene Projekte zu zeigen.
   */
  framing?: { spheres: { pos: THREE.Vector3; r: number }[]; view: THREE.Vector3 };
  /** Wo die Commit-Sterne sitzen; ohne Angabe als Hülle um `root` (Radius `visR`). */
  commitHost?: CommitHost;
  /** Untergrenze fürs Abdimmen (Alper strahlt immer ein wenig). */
  minDim?: number;
  update?: (s: FrameState) => void;
};
