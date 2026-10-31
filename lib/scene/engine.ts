import * as THREE from "three";
import type { ObjectId } from "@/content/types";
import { COMMITS } from "@/content/commits";
import { CONTRIBUTIONS } from "@/content/contributions";
import { ACCENT, INTRO_VIEW, LATE_LINKS, LATE_VIEW, LAYOUT, START_VIEW } from "./layout";
import { createCompass, type CompassMarker } from "./compass";
import { makeBinary } from "./objects/binary";
import { makeCluster } from "./objects/cluster";
import { makeConstellation } from "./objects/constellation";
import { makeGalaxy } from "./objects/galaxy";
import { makeNebula } from "./objects/nebula";
import { makePulsar } from "./objects/pulsar";
import { makeSun } from "./objects/sun";
import { makeWeb } from "./objects/web";
import { createBaker } from "./bake";
import { makeCommitStars } from "./commits";
import { makeContributionRing } from "./ring";
import { makeBlackHole } from "./blackhole";
import { makeComet, makeMeteors } from "./deco";
import { applyDim } from "./dim";
import { createPost } from "./post";
import { bakeSky, makeMotes, makeStars } from "./sky";
import type { Celestial, FrameState, Quality, SceneCtx, SceneEvent } from "./types";
import {
  clamp,
  createRng,
  D2R,
  dirFrom,
  easeInOutCubic,
  easeOutCubic,
  frameAt,
  lerp,
  smooth,
  wrapPi,
} from "./util";

/**
 * Unter-Label an einem Anker des Objekts `parent`: Station bzw. Skill-Gruppe
 * (`index`) oder — mit `child` — ein einzelner Skill der Gruppe `index`.
 */
export type SubLabel = { parent: ObjectId; index: number; child?: number; el: HTMLElement };

export type UniverseOptions = {
  canvas: HTMLCanvasElement;
  /** Sichtbare Objekte in Tour-Reihenfolge. */
  ids: ObjectId[];
  /**
   * Anzahl der Werdegang-Stationen bzw. Skills je Gruppe (bestimmt die Sterne);
   * `highlight` = Index der Station mit dem hellsten Stern (-1 = keine).
   */
  counts: { stations: number; highlight?: number; skills: number[] };
  /** Anzeigenamen für die Kompass-Zeile. */
  names: Partial<Record<ObjectId, string>>;
  centerName: string;
  /** HTML-Overlays; die Engine setzt nur Position, Deckkraft und `is-hover`. */
  labels: Map<ObjectId, HTMLElement>;
  subLabels: SubLabel[];
  /** Kompass-Band oben: Canvas + Textzeile darunter. */
  compass?: { canvas: HTMLCanvasElement; readout: HTMLElement | null } | null;
  /** Feste UI-Elemente, die Labels nicht überdecken sollen (Marke, Kompass, Buttons, Panel). */
  obstacles?: () => (Element | null | undefined)[];
  /** Schwarzblende (Klasse `on`) für den Schnitt bei prefers-reduced-motion. */
  veil: HTMLElement;
  /** Maße des Panels (Desktop: Breite rechts, Mobil: Höhe des Bottom-Sheets). */
  getPanelSize: () => { width: number; height: number };
  /** Klick auf ein Objekt (id) oder ins Leere (null). */
  onSelect: (id: ObjectId | null) => void;
  /** Während der Anreise: jetzt das Panel für `id` einblenden. */
  onPanel: (id: ObjectId) => void;
  /** Erste/weitere Nutzer-Interaktion (für den Zieh-Hinweis). */
  onInteract: () => void;
  /** Der Browser hat den WebGL-Kontext verloren (z. B. GPU-Reset). */
  onContextLost?: () => void;
  /** Läuft selbst bei minimaler Auflösung deutlich unter ~14 fps (zu schwaches Gerät). */
  onSlow?: () => void;
  intro?: boolean;
  /**
   * Zielerfassung: Eck-Klammern, die sich um das Objekt unter dem Zeiger (bzw. im
   * Tastatur-Fokus) legen. Die Engine setzt Lage, Größe und die Klasse `on`;
   * ein Kind-Element `.ret-r` bekommt die aktuelle Entfernung.
   */
  reticle?: HTMLElement | null;
  /** Eine Fahrt beginnt (Klang): Art und Dauer in Sekunden; `cut` = Schnitt bei reduzierter Bewegung. */
  onTravel?: (kind: "trip" | "turn" | "zoom" | "cut", dur: number) => void;
  /** Das hervorgehobene Objekt (Zeiger oder Tastatur) wechselt. */
  onHover?: (id: ObjectId | null) => void;
  /** Ereignisse aus den Objekten (z. B. Pulsar-Blitz). */
  onEvent?: (e: SceneEvent) => void;
};

export type Universe = {
  /** Erfüllt, sobald alle Shader kompiliert sind und das erste Bild steht. */
  ready: Promise<void>;
  focus: (id: ObjectId) => void;
  /** Zurück zur Mitte; mit `face` blickt die Kamera danach auf dieses Objekt (Tastatur). */
  home: (face?: ObjectId) => void;
  setLabelHover: (id: ObjectId | null) => void;
  /** Tastatur-Fokus auf einem Label: Kamera dreht sich (ohne Reise) zum Objekt, falls es nicht im Bild ist. */
  reveal: (id: ObjectId) => void;
  /** Hover über einer Skill-Gruppe (Unter-Label oder Panel), `null` = keine. */
  setSubHover: (index: number | null) => void;
  /** Tippen auf ein Gruppen-Label: Gruppe dauerhaft zeigen bzw. wieder lösen. */
  toggleSub: (index: number) => void;
  /** Tour-Autopilot im Haufen: diese Gruppe zeigen, solange nichts anderes gewählt ist (`null` = aus). */
  setSubAuto: (index: number | null) => void;
  /** Listenansicht: Schleife anhalten, GPU schonen. */
  setPaused: (paused: boolean) => void;
  /**
   * Die Titelkarte der Eröffnung steht (true) bzw. ist weg (false). Solange sie
   * steht, bleibt der Jahresring aus — er liefe sonst durch Namen und Sternenstaub —
   * und die Kamera blickt genau auf die Sonne. Geht die Karte, schwenkt sie in den
   * Startblick (Platz fürs Titelbild), sofern man sich noch nicht selbst umgesehen hat.
   */
  setOpening: (active: boolean) => void;
  destroy: () => void;
};

type Pose = { pos: THREE.Vector3; yaw: number; pitch: number };
type Registered = Celestial & {
  id: ObjectId;
  pos: THREE.Vector3;
  hoverT: number;
  labelOp: number;
  dim: { value: number };
};

/* Fokus-Dimming: wie hell der „Rest“ ist, wenn etwas fokussiert bzw. nur gehovert ist. */
const DIM_FOCUS = 0.2;
const DIM_HOVER = 0.55;
/** Bei Fokus auf Late bleiben die verbundenen Projekte fast hell. */
const DIM_LINKED = 0.85;

const PITCH_MAX = 80 * D2R;

/**
 * Baut die komplette Szene in `canvas` und gibt eine kleine Steuer-API zurück.
 * React kennt nur diese API (focus/home/…) und die Callbacks — keine three.js-Objekte.
 * Wirft, wenn kein WebGL verfügbar ist.
 */
export function createUniverse(opts: UniverseOptions): Universe {
  const { canvas } = opts;
  const mqMobile = matchMedia("(max-width: 767px)");
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = mqReduce.matches;
  const onReduce = (e: MediaQueryListEvent) => {
    reduced = e.matches;
  };
  mqReduce.addEventListener("change", onReduce);

  const params = new URLSearchParams(location.search);
  const SMALL = Math.min(innerWidth, innerHeight) < 768;
  const PR = Math.min(window.devicePixelRatio || 1, 2);
  const Q: Quality = {
    small: SMALL,
    stars: SMALL ? 6500 : 15000,
    galaxy: SMALL ? 16000 : 42000,
    motes: SMALL ? 260 : 520,
    web: SMALL ? 5000 : 12000,
    cluster: SMALL ? 90 : 160,
    cube: Number(params.get("cube")) || (SMALL ? 512 : 1024),
    msaa: !SMALL && PR < 1.5 ? 4 : 0,
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight, false);
  // Tone-Mapping macht der Kino-Pass selbst (farberhaltend, siehe post.ts);
  // der OutputPass wandelt danach nur noch nach sRGB.
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const baseFov = () => (mqMobile.matches ? 72 : 55);
  const camera = new THREE.PerspectiveCamera(baseFov(), innerWidth / innerHeight, 0.1, 4000);
  camera.rotation.order = "YXZ";

  const baker = createBaker(renderer);
  const ctx: SceneCtx = {
    q: Q,
    rng: createRng(7),
    pr: PR,
    uTime: { value: 0 },
    uProj: { value: 800 },
    billboards: [],
    bake: baker.bake,
  };

  /* ---------- Himmel ---------- */
  const skyRT = bakeSky(renderer, Q.cube);
  scene.background = skyRT.texture;
  const stars = makeStars(ctx);
  // zuerst zeichnen: Staubbahnen (Galaxie, Nebel) sollen auch Hintergrundsterne schlucken
  stars.group.traverse((o) => (o.renderOrder = -10));
  scene.add(stars.group);
  const motes = makeMotes(ctx);
  scene.add(motes.points);

  /* ---------- Himmelsobjekte ---------- */
  const OBJ = new Map<ObjectId, Registered>();
  const hitMeshes: THREE.Mesh[] = [];
  const hitGeo = new THREE.SphereGeometry(1, 16, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const posOf = (id: ObjectId) => {
    const l = LAYOUT[id];
    return dirFrom(l.yaw, l.pitch).multiplyScalar(l.dist);
  };

  /* Jahresring: aus, solange die Eröffnung läuft, danach weich eingeblendet (siehe setOpening). */
  const ringShow = { value: 1 };
  let ringOn = true;

  const register = (id: ObjectId, c: Celestial, faceCenter = false) => {
    const pos = posOf(id);
    c.root.position.copy(pos);
    if (faceCenter) c.root.lookAt(0, 0, 0);
    scene.add(c.root);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.scale.setScalar(c.hitR);
    hit.position.copy(pos);
    hit.userData.id = id;
    scene.add(hit);
    hitMeshes.push(hit);
    // Commit-Sterne vor dem Abdimmen anhängen, damit sie mit dem Objekt dimmen
    const days = COMMITS.days[id];
    if (days) {
      const host = c.commitHost ?? { obj: c.root, shape: "halo" as const, r: c.visR };
      makeCommitStars(ctx, host, days, COMMITS.asOf, new THREE.Color(ACCENT[id]), c.hover);
    }
    // Jahresring (GitHub-Beiträge) um die Sonne — dimmt und hellt mit ihr
    if (id === "alper")
      makeContributionRing(ctx, c.root, CONTRIBUTIONS, new THREE.Color(ACCENT.alper), c.hover, ringShow);
    const dim = { value: 1 };
    applyDim(c.root, dim);
    OBJ.set(id, { ...c, id, pos, hoverT: 0, labelOp: -1, dim });
  };

  const build: Record<ObjectId, () => void> = {
    alper: () => {
      const s = makeSun(ctx, {
        radius: 5.2,
        color: [1.0, 0.42, 0.1],
        hot: [1.0, 0.74, 0.4],
        corona: [1.0, 0.58, 0.24],
        intensity: 1.0,
        coronaI: 0.62,
        ext: 4.6,
      });
      register("alper", {
        root: s.group,
        hover: s.hover,
        visR: 11,
        labelR: 7.2,
        hitR: 8,
        minDim: 0.5,
        update: ({ dt, rs }) => {
          s.core.rotation.y += dt * 0.03 * rs;
        },
      });
    },
    werdegang: () => register("werdegang", makeConstellation(ctx, opts.counts.stations, opts.counts.highlight ?? -1), true),
    offerre: () => register("offerre", makeGalaxy(ctx, posOf("offerre"), 22)),
    pipeline: () => register("pipeline", makeBinary(ctx, posOf("pipeline"))),
    insertcoin: () => register("insertcoin", makeNebula(ctx)),
    late: () => {
      const targets = LATE_LINKS.filter((id) => OBJ.has(id)).map((id) => ({
        id,
        pos: OBJ.get(id)!.pos,
        radius: OBJ.get(id)!.visR,
      }));
      register("late", makeWeb(ctx, posOf("late"), targets, dirFrom(LATE_VIEW.yaw, LATE_VIEW.pitch)));
    },
    skills: () => register("skills", makeCluster(ctx, opts.counts.skills), true),
    kontakt: () => register("kontakt", makePulsar(ctx)),
  };
  // Late zuletzt bauen: braucht die Positionen der verbundenen Projekte.
  const buildOrder = [...opts.ids.filter((id) => id !== "late"), ...opts.ids.filter((id) => id === "late")];
  for (const id of buildOrder) build[id]();

  /* ---------- Deko (ohne Inhalt, nicht anklickbar) ---------- */
  const decoDim = { value: 1 };
  const comet = makeComet(ctx, posOf("alper"));
  const meteors = makeMeteors();
  for (const d of [comet, meteors]) {
    applyDim(d.root, decoDim);
    scene.add(d.root);
  }
  // Easter Egg: schwarzes Loch weit abseits (Linse sampelt die Himmels-Cubemap)
  const blackHole = makeBlackHole(ctx, skyRT.texture);
  applyDim(blackHole.disk, decoDim);
  scene.add(blackHole.root);
  const linked = new Set<ObjectId>(LATE_LINKS);
  let restDim = 1;

  /* ---------- Postprocessing ---------- */
  const post = createPost(renderer, scene, camera, { pr: PR, msaa: Q.msaa, width: innerWidth, height: innerHeight });

  /* ---------- Unter-Labels (Stationen, Skill-Gruppen, einzelne Skills) ---------- */
  const subs = opts.subLabels
    .map((s) => {
      const o = OBJ.get(s.parent);
      const anchor = s.child == null ? o?.anchors?.[s.index] : o?.childAnchors?.[s.index]?.[s.child];
      const key = s.child == null ? `sub-${s.parent}-${s.index}` : `sk-${s.parent}-${s.index}-${s.child}`;
      return { ...s, anchor, key };
    })
    .filter((s): s is typeof s & { anchor: THREE.Object3D } => !!s.anchor);

  /* ---------- Kamera-Zustand ---------- */
  const tmp = new THREE.Vector3();
  /** Startblick der Übersicht — hochkant (Mobil) ein anderer als quer (siehe START_VIEW). */
  const HOME_POS = new THREE.Vector3();
  const homePose = (): Pose => {
    const v = mqMobile.matches ? START_VIEW.mobile : START_VIEW.desktop;
    return { pos: HOME_POS, yaw: v.yaw * D2R, pitch: v.pitch * D2R };
  };
  const INTRO_POSE: Pose = { pos: HOME_POS, yaw: INTRO_VIEW.yaw * D2R, pitch: INTRO_VIEW.pitch * D2R };
  const basePos = HOME_POS.clone();
  let yaw = homePose().yaw;
  let pitch = homePose().pitch;
  /**
   * Eröffnung: Solange die Titelkarte steht, blickt die Kamera auf die Sonne. Danach
   * schwenkt sie einmal in den Startblick (`settle`), außer man hat sich schon umgesehen.
   */
  let titleCard = false;
  let settle = false;
  let userMoved = false;
  let vYaw = 0;
  let vPitch = 0;
  let dragging = false;
  let dragMoved = 0;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let downT = 0;
  let lastInteract = -10;
  let idleBlend = 0;
  /**
   * trip = Reise zu einem Objekt (Warp, Labels aus). Ohne Warp und mit stehenden Labels:
   * turn = nur umdrehen (Tastatur-Fokus auf ein Label), zoom = im Haufen zu einer Skill-Gruppe (Mobil).
   */
  type TravelKind = "trip" | "turn" | "zoom";
  type Travel = { t0: number; dur: number; from: Pose; to: Pose; dist: number; onOpen?: () => void; opened: boolean; kind: TravelKind };
  let travel: Travel | null = null;
  let focused: ObjectId | null = null;
  let hovered: ObjectId | null = null;
  let labelHover: ObjectId | null = null;
  /* Skill-Gruppe im fokussierten Haufen: über Label/Panel (subHover), per Maus
     über einem Stern (subPick), angetippt/angeklickt (subPin, bleibt stehen) oder
     vom Tour-Autopilot der Reihe nach (subAuto, nachrangig). */
  let subHover: number | null = null;
  let subPick: number | null = null;
  let subPin: number | null = null;
  let subAuto: number | null = null;
  const subParent = () => (focused && OBJ.get(focused)?.childAnchors ? OBJ.get(focused)! : null);
  const activeSub = () =>
    subParent() && (!travel || travel.kind === "zoom") ? (subHover ?? subPick ?? subPin ?? subAuto) : null;
  let warp = 0;
  let intro: { t0: number; dur: number; p0: number; y0: number; gy: number; gp: number } | null = null;
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let needPick = false;
  /** Maus über dem Canvas? Nur dann darf nach einer Fahrt neu „gehovert“ werden. */
  let pointerInside = false;
  let now = 0;
  /* Parallaxe: Der Blick neigt sich minimal zum Mauszeiger (nur feine Zeiger).
     Die Position kommt vom ganzen Fenster, nicht nur vom Canvas — sonst spränge
     der Blick zurück, sobald die Maus über ein Label oder das Panel fährt. */
  const mqFine = matchMedia("(pointer: fine)");
  const par = { x: 0, y: 0, tx: 0, ty: 0, seen: false };
  /* Gravitationslinse am Zeiger (post.ts): nur über dem offenen Himmel, nicht
     über Labels/Panel, nicht über einem Objekt (dort zielt man) und nicht beim
     Ziehen, Reisen, in der Eröffnung oder bei reduzierter Bewegung. */
  const lens = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, k: 0, overSky: false };
  const onWinMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    par.tx = (e.clientX / innerWidth) * 2 - 1;
    par.ty = (-e.clientY / innerHeight) * 2 + 1;
    par.seen = true;
    lens.tx = e.clientX / innerWidth;
    lens.ty = 1 - e.clientY / innerHeight;
    lens.overSky = e.target === canvas;
  };
  const onWinOut = (e: PointerEvent) => {
    // Maus verlässt das Fenster: sanft zurück zur Mitte
    if (!e.relatedTarget) {
      par.tx = par.ty = 0;
      lens.overSky = false;
    }
  };
  addEventListener("pointermove", onWinMove, { passive: true });
  document.addEventListener("pointerout", onWinOut);

  const interacted = () => {
    lastInteract = now;
    opts.onInteract();
  };

  /* ---------- Eingabe ---------- */
  const setMouse = (e: PointerEvent) => mouse.set((e.clientX / innerWidth) * 2 - 1, (-e.clientY / innerHeight) * 2 + 1);
  const pick = (): ObjectId | null => {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(hitMeshes, false);
    return hits.length ? (hits[0].object.userData.id as ObjectId) : null;
  };
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    canvas.setPointerCapture(e.pointerId);
    dragging = true;
    dragMoved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = downT = performance.now();
    vYaw = vPitch = 0;
    canvas.classList.add("dragging");
    interacted();
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      setMouse(e);
      needPick = true;
      pointerInside = true;
    }
    if (!dragging) return;
    const t = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    if (travel || intro) {
      lastT = t;
      return;
    }
    const k = (camera.fov * D2R) / innerHeight;
    const dt = Math.max((t - lastT) / 1000, 1 / 240);
    lastT = t;
    yaw -= dx * k;
    pitch = clamp(pitch + dy * k, -PITCH_MAX, PITCH_MAX);
    if (dragMoved > 6) userMoved = true;
    vYaw = lerp(vYaw, (-dx * k) / dt, 0.35);
    vPitch = lerp(vPitch, (dy * k) / dt, 0.35);
    interacted();
  };
  /** Gruppen- oder Skill-Stern unter dem Zeiger (nur im fokussierten Haufen) → Gruppen-Index. */
  const tmp2 = new THREE.Vector3();
  const pickSub = (cx: number, cy: number): number | null => {
    const o = subParent();
    if (!o || (travel && travel.kind !== "zoom")) return null;
    let best: number | null = null;
    let bd = Infinity;
    const test = (a: THREE.Object3D, g: number, r: number) => {
      a.getWorldPosition(tmp2).project(camera);
      if (tmp2.z > 1) return;
      const d = Math.hypot((tmp2.x * 0.5 + 0.5) * innerWidth - cx, (-tmp2.y * 0.5 + 0.5) * innerHeight - cy);
      if (d < r && d < bd) {
        bd = d;
        best = g;
      }
    };
    o.anchors?.forEach((a, g) => test(a, g, 30));
    o.childAnchors?.forEach((list, g) => list.forEach((a) => test(a, g, 18)));
    return best;
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("dragging");
    if (performance.now() - lastT > 80) vYaw = vPitch = 0;
    const isClick = dragMoved < 7 && performance.now() - downT < 600;
    if (isClick && e.type === "pointerup") {
      setMouse(e);
      // Im Haufen: Tippen/Klicken auf einen Stern zeigt dessen Gruppe (Mobil: statt Hover)
      const g = pickSub(e.clientX, e.clientY);
      if (g != null) {
        togglePin(g);
        return;
      }
      opts.onSelect(pick());
    }
  };
  const onEnter = (e: PointerEvent) => {
    // auch wenn die Maus stillsteht und nur das Panel darüber verschwindet
    if (e.pointerType !== "mouse") return;
    setMouse(e);
    needPick = true;
    pointerInside = true;
  };
  const onLeave = () => {
    needPick = false;
    pointerInside = false;
    hovered = null;
    subPick = null;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerenter", onEnter);

  /* ---------- Reisen ---------- */
  /** Zielpose: nah vor dem Objekt, Objekt links der Mitte (Desktop) bzw. über dem Sheet (Mobil). */
  const arrivalFor = (id: ObjectId): Pose => arrivalAt(OBJ.get(id)!);
  /** Oben auf dem Handy liegen Marke und Kompass — Nahaufnahmen mittig im Bereich darunter. */
  const TOP_MOBILE = 64;
  type Target = Pick<Celestial, "visR" | "framing"> & {
    pos: THREE.Vector3;
    /** Blickrichtung, falls nicht vom Zentrum auf `pos` (z. B. Ausschnitt eines Objekts). */
    view?: THREE.Vector3;
    /** Rechteck (halbe Breite/Höhe in der Bildebene), das in den freien Bereich passen soll — statt `visR`. */
    box?: { hw: number; hh: number };
  };
  const arrivalAt = (o: Target): Pose => {
    const mobile = mqMobile.matches;
    const tanV = Math.tan((baseFov() * D2R) / 2);
    const aspect = innerWidth / innerHeight;
    const panel = opts.getPanelSize();
    // Mobil: das Sheet startet auf 44dvh (Peek, siehe .panel) — darüber wird eingerahmt
    const sheet = Math.min(panel.height || innerHeight * 0.44, innerHeight * 0.44) / innerHeight;
    const pw = (panel.width || 440) / innerWidth;
    let center = o.pos;
    let dist: number;
    let f = frameAt(o.view ?? center);
    if (o.framing) {
      // Mehrere Kugeln gemeinsam einrahmen: so weit zurück, bis alle in den freien Bereich passen.
      const { spheres, view } = o.framing;
      center = spheres.reduce((a, s) => a.add(s.pos), new THREE.Vector3()).divideScalar(spheres.length);
      f = frameAt(view);
      const hw = (mobile ? tanV * aspect : tanV * aspect * (1 - pw)) * 0.92;
      const hh = (mobile ? tanV * (1 - sheet) : tanV) * 0.92;
      dist = 10;
      for (const s of spheres) {
        tmp.copy(s.pos).sub(center);
        const z = tmp.dot(f.a);
        dist = Math.max(dist, (Math.abs(tmp.dot(f.right)) + s.r) / hw - z, (Math.abs(tmp.dot(f.up)) + s.r) / hh - z);
      }
    } else if (o.box) {
      const top = mobile ? TOP_MOBILE / innerHeight : 0;
      const hw = (mobile ? tanV * aspect : tanV * aspect * (1 - pw)) * 0.94;
      const hh = (mobile ? tanV * (1 - sheet - top) : tanV) * 0.92;
      dist = Math.max(o.box.hw / hw, o.box.hh / hh, 4);
    } else {
      let half = Math.min(tanV, tanV * aspect);
      if (mobile) half = Math.min(tanV * aspect, tanV * 0.42);
      const frac = mobile ? 0.62 : 0.5;
      dist = o.visR / (frac * half);
    }
    const poseAt = (d: number): Pose => {
      const pos = center.clone().addScaledVector(f.a, -d);
      const look = center.clone();
      if (mobile) {
        // Mitte des sichtbaren Bereichs über dem Sheet liegt bei NDC-y = Sheet-Anteil
        // (Nahaufnahmen: Mitte zwischen Marke/Kompass oben und dem Sheet)
        const top = o.framing ? 0 : TOP_MOBILE / innerHeight;
        look.addScaledVector(f.up, -(sheet - top) * d * tanV);
      } else {
        look.addScaledVector(f.right, pw * d * tanV * aspect);
      }
      const dir = look.sub(pos).normalize();
      return { pos, yaw: Math.atan2(dir.x, -dir.z), pitch: Math.asin(clamp(dir.y, -1, 1)) };
    };
    let pose = poseAt(dist);
    if (o.framing) {
      // Die Rechnung oben ist eine Näherung (die Kamera wird fürs Panel noch gedreht).
      // Mit einer Test-Kamera nachprüfen und notfalls weiter zurückgehen.
      const x1 = mobile ? 0.94 : 0.94 - 2 * pw;
      const y0 = mobile ? 2 * sheet - 1 + 0.06 : -0.94;
      for (let i = 0; i < 12; i++) {
        probe.fov = baseFov();
        probe.aspect = aspect;
        probe.updateProjectionMatrix();
        probe.position.copy(pose.pos);
        probe.rotation.set(pose.pitch, -pose.yaw, 0, "YXZ");
        probe.updateMatrixWorld();
        const fits = o.framing.spheres.every((sp) => {
          tmp.copy(sp.pos).project(probe);
          const rN = sp.r / (sp.pos.distanceTo(pose.pos) * tanV);
          return tmp.x - rN * (1 / aspect) > -0.94 && tmp.x + rN / aspect < x1 && tmp.y - rN > y0 && tmp.y + rN < 0.94;
        });
        if (fits) break;
        dist *= 1.08;
        pose = poseAt(dist);
      }
    }
    return pose;
  };
  const probe = new THREE.PerspectiveCamera();
  probe.rotation.order = "YXZ";

  /* Schnitt statt Fahrt (prefers-reduced-motion): abblenden → springen → aufblenden.
     Kommt während des Abblendens ein neues Ziel, gewinnt das neueste. */
  let cutPhase: "idle" | "out" | "in" = "idle";
  let cutMid: (() => void) | null = null;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const fadeCut = (mid: () => void) => {
    cutMid = mid;
    if (cutPhase === "out") return;
    cutPhase = "out";
    opts.veil.classList.add("on");
    later(() => {
      const m = cutMid;
      cutMid = null;
      m?.();
      cutPhase = "in";
      requestAnimationFrame(() => {
        if (cutPhase !== "in") return;
        opts.veil.classList.remove("on");
        later(() => {
          if (cutPhase === "in") cutPhase = "idle";
        }, 260);
      });
    }, 230);
  };

  /* Hover gilt nur für die Ansicht, in der er entstand: vor der Fahrt lösen, danach
     an der aktuellen Mausposition neu bestimmen — sonst bliebe z. B. nach ESC das
     zuletzt angeklickte Objekt „gehovert“ und die Startszene gedimmt. */
  const clearHover = () => {
    hovered = null;
    subPick = null;
    canvas.classList.remove("pointing");
  };
  const repick = () => {
    needPick = pointerInside;
  };

  const startTravel = (to: Pose, onOpen?: () => void, kind: TravelKind = "trip", durOverride?: number) => {
    clearHover();
    const from: Pose = { pos: basePos.clone(), yaw, pitch };
    vYaw = vPitch = 0;
    const target: Pose = { pos: to.pos.clone(), yaw: yaw + wrapPi(to.yaw - yaw), pitch: to.pitch };
    if (reduced) {
      opts.onTravel?.("cut", 0.45);
      fadeCut(() => {
        basePos.copy(target.pos);
        yaw = target.yaw;
        pitch = target.pitch;
        travel = null;
        onOpen?.();
        repick();
      });
      return;
    }
    const dist = from.pos.distanceTo(target.pos) + Math.abs(wrapPi(target.yaw - yaw)) * 20;
    const dur =
      durOverride ??
      (kind === "turn"
        ? 0.7 + Math.min(Math.abs(target.yaw - yaw) + Math.abs(target.pitch - pitch), Math.PI) * 0.22
        : kind === "zoom"
          ? 1.0
          : 1.45 + Math.min(dist / 260, 0.35));
    travel = { t0: now, dur, from, to: target, dist, onOpen, opened: false, kind };
    canvas.classList.add("traveling");
    opts.onTravel?.(kind, dur);
  };
  /** Blick vom Punkt `from` auf `pos` als Pose (Pitch geklemmt). */
  const facing = (from: THREE.Vector3, pos: THREE.Vector3): Pose => {
    const d = pos.clone().sub(from).normalize();
    return { pos: from.clone(), yaw: Math.atan2(d.x, -d.z), pitch: clamp(Math.asin(clamp(d.y, -1, 1)), -PITCH_MAX, PITCH_MAX) };
  };

  const focus = (id: ObjectId) => {
    if (!OBJ.has(id)) return;
    interacted();
    if (id === focused && !travel) {
      opts.onPanel(id);
      return;
    }
    focused = id;
    subPin = null;
    userMoved = true;
    startTravel(arrivalFor(id), () => opts.onPanel(id));
  };
  const home = (face?: ObjectId) => {
    const o = face ? OBJ.get(face) : undefined;
    if (!focused && !travel && basePos.lengthSq() < 1e-6 && !o) return;
    focused = null;
    subPin = null;
    startTravel(o ? facing(HOME_POS, o.pos) : homePose());
  };
  const reveal = (id: ObjectId) => {
    const o = OBJ.get(id);
    // Eine laufende Drehung darf neu ausgerichtet werden (schnelles Tabben), eine Reise nicht
    if (!o || focused || intro || (travel && travel.kind !== "turn")) return;
    // schon gut im Bild → nicht drehen
    tmp.copy(o.pos).project(camera);
    if (tmp.z < 1 && Math.abs(tmp.x) < 0.72 && Math.abs(tmp.y) < 0.72) return;
    interacted();
    startTravel(facing(basePos, o.pos), undefined, "turn");
  };

  /* Mobil ist im Haufen zu wenig Platz für die Namen einer ganzen Gruppe: Antippen
     rückt die Kamera an diese Gruppe heran (kurz, ohne Warp), erneutes Tippen zurück. */
  const groupPose = (g: number): Pose | null => {
    const o = subParent();
    const kids = o?.childAnchors?.[g];
    const star = o?.anchors?.[g];
    if (!o || !kids?.length || !star) return null;
    const f = frameAt(o.pos);
    const s0 = star.getWorldPosition(new THREE.Vector3());
    const pts = kids.map((a) => a.getWorldPosition(new THREE.Vector3()).sub(s0));
    // Rechteck um Stern + Skills, dazu Platz für die Namen: Skills außen, Gruppenname innen
    const LBL = 9;
    const sgn = kids[0].userData.side === "l" ? -1 : 1;
    const xs = [0, ...pts.map((p) => p.dot(f.right))];
    const ys = [0, ...pts.map((p) => p.dot(f.up))];
    let x0 = Math.min(...xs);
    let x1 = Math.max(...xs);
    if (sgn < 0) [x0, x1] = [x0 - LBL, Math.max(x1, LBL)];
    else [x0, x1] = [Math.min(x0, -LBL), x1 + LBL];
    const y0 = Math.min(...ys) - 1.2;
    const y1 = Math.max(...ys) + 1.2;
    const c = s0.clone().addScaledVector(f.right, (x0 + x1) / 2).addScaledVector(f.up, (y0 + y1) / 2);
    return arrivalAt({ pos: c, visR: 0, view: o.pos, box: { hw: (x1 - x0) / 2, hh: (y1 - y0) / 2 } });
  };
  const subZoom = () => {
    if (!mqMobile.matches || !focused || (travel && travel.kind === "trip")) return;
    const to = (subPin != null && groupPose(subPin)) || arrivalFor(focused);
    startTravel(to, undefined, "zoom");
  };
  const togglePin = (g: number) => {
    subPin = subPin === g ? null : g;
    subZoom();
  };

  /* ---------- Frame-Update ---------- */
  const level = (id: string) => OBJ.get(id as ObjectId)?.hoverT ?? 0;
  const emit = (e: SceneEvent) => opts.onEvent?.(e);
  let lastAttn: ObjectId | null = null;
  const fwd = new THREE.Vector3();
  const qInv = new THREE.Quaternion();
  const compass = opts.compass ? createCompass(opts.compass.canvas, opts.compass.readout) : null;
  const markers: CompassMarker[] = [...OBJ.keys()].map((id) => ({ id, az: 0, color: ACCENT[id] }));

  const update = (dt: number) => {
    let introFov = 0;
    if (intro) {
      const t = clamp((now - intro.t0) / intro.dur, 0, 1);
      const e = easeOutCubic(t);
      basePos.set(0, lerp(1.6, 0, e), lerp(26, 0, e));
      // Ziel: mit Titelkarte genau auf die Sonne, sonst der Startblick. Das Ziel gleitet,
      // statt zu springen, wenn die Titelkarte mitten in der Fahrt endet (übersprungen).
      const goal = titleCard ? INTRO_POSE : homePose();
      const k = 1 - Math.exp(-dt * 2.5);
      intro.gy += wrapPi(goal.yaw - intro.gy) * k;
      intro.gp += (goal.pitch - intro.gp) * k;
      pitch = lerp(intro.p0, intro.gp, e);
      yaw = lerp(intro.y0, intro.gy, e);
      introFov = lerp(9, 0, e);
      if (t >= 1) {
        intro = null;
        basePos.copy(HOME_POS);
      }
    }
    // Nach der Titelkarte einmal weich in den Startblick schwenken
    if (settle && !titleCard && !intro && !travel && !dragging) {
      settle = false;
      const h = homePose();
      const off = Math.abs(wrapPi(h.yaw - yaw)) + Math.abs(h.pitch - pitch);
      if (!userMoved && !focused && off > 0.005) startTravel(h, undefined, "turn", 2.2);
    }

    if (travel) {
      const t = clamp((now - travel.t0) / travel.dur, 0, 1);
      const e = easeInOutCubic(t);
      const er = easeInOutCubic(Math.min(1, t * 1.3));
      basePos.lerpVectors(travel.from.pos, travel.to.pos, e);
      yaw = lerp(travel.from.yaw, travel.to.yaw, er);
      pitch = lerp(travel.from.pitch, travel.to.pitch, er);
      warp = travel.kind !== "trip" ? 0 : Math.pow(Math.sin(Math.PI * t), 2) * clamp(travel.dist / 90, 0.3, 1);
      if (!travel.opened && t > 0.62) {
        travel.opened = true;
        travel.onOpen?.();
      }
      if (t >= 1) {
        travel = null;
        warp = 0;
        canvas.classList.remove("traveling");
        repick();
      }
    } else if (!dragging && !intro) {
      yaw += vYaw * dt;
      pitch = clamp(pitch + vPitch * dt, -PITCH_MAX, PITCH_MAX);
      const damp = Math.exp(-dt * 3.2);
      vYaw *= damp;
      vPitch *= damp;
    }

    // Idle-Drift: sanftes Schweben, wenn niemand interagiert
    const idleTarget = reduced || travel || dragging || intro ? 0 : smooth(3, 7, now - lastInteract);
    idleBlend = lerp(idleBlend, idleTarget, 1 - Math.exp(-dt * 0.8));
    const dy = idleBlend * (Math.sin(now * 0.043) * 0.035 + Math.sin(now * 0.017 + 1.3) * 0.02);
    const dp = idleBlend * (Math.sin(now * 0.061 + 0.4) * 0.014);
    camera.position.copy(basePos);
    camera.position.x += idleBlend * Math.sin(now * 0.13) * 0.35;
    camera.position.y += idleBlend * Math.sin(now * 0.09 + 2.0) * 0.22;
    // Parallaxe: beim Lesen (Fokus) nur noch ein Hauch, während Fahrten/Ziehen gar nicht
    const parOn = !reduced && mqFine.matches && par.seen && !dragging && !travel && !intro;
    const parAmp = parOn ? (focused ? 0.35 : 1) : 0;
    const kPar = 1 - Math.exp(-dt * 1.8);
    par.x = lerp(par.x, par.tx * parAmp, kPar);
    par.y = lerp(par.y, par.ty * parAmp, kPar);
    // Linse: Position folgt dem Zeiger mit etwas Trägheit (wirkt wie Masse),
    // Stärke blendet weich ein und aus
    const lensOn = parOn && lens.overSky && !hovered && !labelHover;
    const kLens = 1 - Math.exp(-dt * 9);
    lens.x = lerp(lens.x, lens.tx, kLens);
    lens.y = lerp(lens.y, lens.ty, kLens);
    lens.k = lerp(lens.k, lensOn ? (focused ? 0.5 : 1) : 0, 1 - Math.exp(-dt * 3.5));
    post.cine.uniforms.uLens.value.set(lens.x, lens.y);
    post.cine.uniforms.uLensK.value = lens.k * 0.0016;
    camera.rotation.set(
      clamp(pitch + dp + par.y * 0.006, -PITCH_MAX, PITCH_MAX),
      -(yaw + dy + par.x * 0.009),
      0,
      "YXZ",
    );

    // FOV + Warp
    const wr = reduced ? 0 : warp;
    camera.fov = baseFov() + wr * 11 + introFov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    post.cine.uniforms.uWarp.value = wr * 0.055;
    stars.uniforms.uWarp.value = wr;
    stars.uniforms.uTw.value = reduced ? 0.3 : 1;
    motes.uniforms.uWarp.value = wr;
    motes.uniforms.uCam.value.copy(camera.position);
    ctx.uProj.value = renderer.domElement.height / (2 * Math.tan((camera.fov * D2R) / 2));
    stars.uniforms.uScale.value = clamp(innerHeight / 900, 0.8, 1.25);
    stars.group.position.copy(camera.position);

    // Billboards zur Kamera drehen (auch wenn der Parent selbst gedreht ist)
    for (const b of ctx.billboards) {
      if (b.parent) b.parent.getWorldQuaternion(qInv).invert();
      else qInv.identity();
      b.quaternion.copy(qInv.multiply(camera.quaternion));
    }

    // Objekt-Animationen + weiches Hover/Fokus
    // Reduzierte Bewegung: Objekt-Animationen (Rotation, Komet, Pulsar) fast still
    const fs: FrameState = { now, dt, rs: reduced ? 0.2 : 1, camera, focused, level, sub: activeSub(), emit };
    for (const o of OBJ.values()) {
      const target = hovered === o.id || labelHover === o.id || focused === o.id ? 1 : 0;
      o.hoverT = lerp(o.hoverT, target, 1 - Math.exp(-dt * 6));
      o.hover.value = o.hoverT;
    }

    // Fokus-Dimming: Angeflogenes/Gehovertes leuchtet, der Rest tritt zurück.
    const attn = hovered ?? labelHover;
    if (attn !== lastAttn) {
      lastAttn = attn;
      opts.onHover?.(attn);
    }
    const restTarget = focused ? DIM_FOCUS : attn ? DIM_HOVER : 1;
    const kDim = 1 - Math.exp(-dt * 3.2);
    restDim = lerp(restDim, restTarget, kDim);
    const lateT = OBJ.get("late")?.hoverT ?? 0;
    for (const o of OBJ.values()) {
      let d = lerp(restDim, 1, o.hoverT);
      if (linked.has(o.id)) d = Math.max(d, lerp(restDim, DIM_LINKED, lateT));
      o.dim.value = Math.max(d, o.minDim ?? 0);
      o.update?.(fs);
    }
    decoDim.value = restDim;
    // Jahresring nach der Eröffnung weich einblenden (~2 s)
    ringShow.value = lerp(ringShow.value, ringOn ? 1 : 0, 1 - Math.exp(-dt * 1.4));
    stars.uniforms.uDim.value = lerp(0.62, 1, restDim);
    scene.backgroundIntensity = lerp(0.6, 1, restDim);
    blackHole.update(fs, scene.backgroundIntensity, restDim);
    comet.update(fs);
    meteors.update(fs, !travel && !intro && !reduced);

    updateLabels();
    updateReticle(dt);

    if (compass) {
      camera.getWorldDirection(fwd);
      const az = Math.atan2(fwd.x, -fwd.z) / D2R;
      const alt = Math.asin(clamp(fwd.y, -1, 1)) / D2R;
      for (const m of markers) {
        tmp.copy(OBJ.get(m.id as ObjectId)!.pos).sub(camera.position);
        m.az = Math.atan2(tmp.x, -tmp.z) / D2R;
      }
      compass.draw({
        az,
        alt,
        markers,
        active: hovered ?? labelHover ?? focused,
        where: focused ? (opts.names[focused] ?? focused) : opts.centerName,
      });
    }
  };

  /* ---------- Labels: Platzierung ohne Überlappung ----------
     Jedes Frame werden alle sichtbaren Labels nach Wichtigkeit sortiert und der
     Reihe nach gesetzt: erst unter dem Objekt, sonst darüber (Unter-Labels:
     rechts, sonst links; Stationen abwechselnd über/unter ihrem Stern).
     Unter-Labels sind Inhalt und gehen allen Objekt-Namen vor. Kollidiert beides mit schon gesetzten Labels oder der
     festen UI (Marke, Kompass, Buttons, Panel), wird das Label ausgeblendet —
     ein gehovertes Label setzt sich immer durch. Eine kleine Hysterese
     (bisherige Seite zuerst, beim Wieder-Einblenden mehr Abstand) verhindert
     Flackern, während die Kamera leicht driftet. */
  type Box = { x0: number; y0: number; x1: number; y1: number };
  type Place = "b" | "t" | "r" | "l";
  type Lab = { el: HTMLElement; w: number; h: number; place: Place | null; op: number };
  const labs = new Map<string, Lab>();
  const labOf = (key: string, el: HTMLElement) => {
    let l = labs.get(key);
    if (!l || l.el !== el) {
      l = { el, w: el.offsetWidth, h: el.offsetHeight, place: null, op: -1 };
      labs.set(key, l);
    }
    return l;
  };
  let obstacles: Box[] = [];
  /** Letzte Vermessung (s). Nach Zeit statt nach Frames — bei langsamer GPU blieben sonst
      veraltete Hindernisse (z. B. das Titelbild nach dem Öffnen des Panels) sekundenlang stehen. */
  let measuredAt = -1;
  const EDGE = 10;
  const measureLabels = () => {
    for (const l of labs.values()) {
      l.w = l.el.offsetWidth;
      l.h = l.el.offsetHeight;
    }
    obstacles = [];
    for (const el of opts.obstacles?.() ?? []) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) obstacles.push({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
    }
  };
  const overlaps = (a: Box, b: Box, pad: number) =>
    a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

  /** obj = Objekt-Name, sub = Station/Skill-Gruppe, skill = einzelner Skill (klein, am Stern). */
  type Kind = "obj" | "sub" | "skill";
  type Cand = { l: Lab; x: number; yB: number; yT: number; prio: number; op: number; force: boolean; kind: Kind; side?: Place };
  const cands: Cand[] = [];
  const placed: Box[] = [];
  const box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  /** Box für Seite `p`; Namen werden horizontal in den Bildschirm geschoben (dx), Leitlinie bleibt am Objekt. */
  const boxFor = (c: Cand, p: Place) => {
    const { w, h } = c.l;
    let x0: number;
    let y0: number;
    if (c.kind === "skill") {
      if (p === "r" || p === "l") {
        x0 = p === "r" ? c.x + 8 : c.x - 8 - w;
        y0 = c.yB - h / 2;
      } else {
        x0 = c.x - w / 2;
        y0 = p === "b" ? c.yB + 5 : c.yB - 5 - h;
      }
    } else if (p === "b" || p === "t") {
      // Unter-Labels sitzen am Stern selbst: Abstand für sein Leuchten
      const g = c.kind === "sub" ? 14 : 0;
      x0 = c.x - w / 2;
      y0 = p === "b" ? c.yB + g : c.yT - g - h;
    } else {
      x0 = p === "r" ? c.x + 12 : c.x - 12 - w;
      y0 = c.yB - 8;
    }
    let dx = 0;
    // Skills bleiben direkt am Stern (sonst ist unklar, welcher gemeint ist) — ragt die Seite raus, gilt sie als „außerhalb“.
    if (c.kind !== "skill") {
      if (x0 < EDGE) dx = EDGE - x0;
      else if (x0 + w > innerWidth - EDGE) dx = innerWidth - EDGE - (x0 + w);
      if (c.kind === "obj") dx = clamp(dx, -(w / 2 - 10), w / 2 - 10);
    }
    // Kollisionen gegen die sichtbare Schrift, nicht gegen das Klick-Polster
    const sx = c.kind === "skill" ? 2 : 6;
    const sy = c.kind === "skill" ? 1 : 3;
    box.x0 = x0 + dx + sx;
    box.x1 = x0 + dx + w - sx;
    box.y0 = y0 + sy;
    box.y1 = y0 + h - sy;
    return { x0: x0 + dx, y0, dx };
  };
  const other = (p: Place): Place => (p === "l" ? "r" : "l");

  const updateLabels = () => {
    const W = innerWidth;
    const H = innerHeight;
    const tanV = Math.tan((camera.fov * D2R) / 2);
    camera.getWorldDirection(fwd);
    // Beim bloßen Umdrehen (Tastatur) bleiben die Labels stehen, wie beim Ziehen
    const traveling = (!!travel && travel.kind === "trip") || !!intro;
    const act = activeSub();
    if (now - measuredAt > 0.4 || measuredAt < 0) {
      measureLabels();
      measuredAt = now;
    }
    cands.length = 0;
    for (const o of OBJ.values()) {
      const el = opts.labels.get(o.id);
      if (!el) continue;
      const l = labOf(o.id, el);
      const isHover = hovered === o.id || labelHover === o.id;
      el.classList.toggle("is-hover", isHover);
      tmp.copy(o.pos).sub(camera.position);
      const depth = tmp.dot(fwd);
      if (depth <= 2 || traveling || focused === o.id) continue;
      tmp.copy(o.pos).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * W;
      const y = (-tmp.y * 0.5 + 0.5) * H;
      // Objekt außerhalb des Bildes: kein Label (die Richtung zeigt der Kompass)
      if (x < 0 || x > W || y < 0 || y > H) continue;
      const pxR = (o.labelR / (depth * tanV)) * (H / 2);
      const lit = focused === "late" && linked.has(o.id);
      const op = isHover ? 1 : focused && !lit ? 0.55 : 0.85;
      const prio = (isHover ? 1000 : 0) + (lit ? 200 : 0) + (o.id === "alper" ? 100 : 0) - depth * 0.1;
      cands.push({ l, x, yB: y + pxR + 2, yT: y - pxR - 2, prio, op, force: isHover, kind: "obj" });
    }
    for (const s of subs) {
      const l = labOf(s.key, s.el);
      const skill = s.child != null;
      const mine = act === s.index;
      if (!skill) s.el.classList.toggle("is-act", mine);
      if (focused !== s.parent || traveling) continue;
      // Stationen erscheinen im Takt, in dem sich das Sternbild zeichnet
      if (s.anchor.userData.lit === false) continue;
      // Einzelne Skills nur für die gezeigte Gruppe (Hover, Panel, Antippen, Tour) — alle auf einmal wären zu voll
      if (skill && !mine) continue;
      s.anchor.getWorldPosition(tmp);
      if (tmp.clone().sub(camera.position).dot(fwd) <= 1) continue;
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * W;
      const y = (-tmp.y * 0.5 + 0.5) * H;
      if (x < 0 || x > W || y < 0 || y > H) continue;
      // Stationen/Gruppen sind Inhalt: vor allen Objekt-Namen (auch einem gehoverten),
      // in Reihenfolge. Die Skills der gezeigten Gruppe folgen direkt danach.
      let prio: number;
      let op: number;
      if (skill) {
        prio = 1800 - s.child!;
        op = 1;
      } else {
        prio = 2000 + (mine ? 100 : 0) - s.index;
        op = act == null || mine ? 1 : 0.55;
      }
      const side = s.anchor.userData.side as Place | undefined;
      cands.push({ l, x, yB: y, yT: y, prio, op, force: false, kind: skill ? "skill" : "sub", side });
    }
    cands.sort((a, b) => b.prio - a.prio);

    placed.length = 0;
    placed.push(...obstacles);
    const shown = new Set<Lab>();
    for (const c of cands) {
      const l = c.l;
      if (!l.w) continue;
      let pref: Place[];
      if (c.kind === "obj") pref = l.place === "t" ? ["t", "b"] : ["b", "t"];
      else if (c.side === "t" || c.side === "b") {
        // Station: ihre Seite (über/unter dem Stern), sonst die andere, notfalls daneben.
        // Die zuletzt genutzte Seite zuerst, damit nichts flackert.
        const opp: Place = c.side === "t" ? "b" : "t";
        pref = [...new Set<Place>([l.place ?? c.side, c.side, opp, "r", "l"])];
      } else {
        const first: Place = l.place === "l" || l.place === "r" ? l.place : (c.side ?? "r");
        pref = c.kind === "skill" ? [first, other(first), "b", "t"] : [first, other(first)];
      }
      type Hit = { p: Place; x0: number; y0: number; dx: number; b: Box };
      let hit: Hit | null = null;
      let outside: Hit | null = null;
      for (const p of pref) {
        const r = boxFor(c, p);
        // Ragt die Seite aus dem Bild (Objekt nah am Rand) → andere Seite probieren
        const outX = c.kind === "skill" && (box.x0 < EDGE / 2 || box.x1 > W - EDGE / 2);
        if (outX || box.y0 < EDGE / 2 || box.y1 > H - EDGE / 2) {
          outside ??= { p, ...r, b: { ...box } };
          continue;
        }
        const pad = l.place === p && l.op > 0 ? 2 : c.kind === "skill" ? 4 : 8;
        if (c.force || !placed.some((q) => overlaps(box, q, pad))) {
          hit = { p, ...r, b: { ...box } };
          break;
        }
      }
      // Gehovert bleibt sichtbar, notfalls angeschnitten
      if (!hit && c.force) hit = outside;
      if (!hit) continue;
      placed.push(hit.b);
      shown.add(l);
      l.el.style.transform = `translate3d(${hit.x0.toFixed(1)}px,${hit.y0.toFixed(1)}px,0)`;
      // Leitlinie bzw. Marke bleibt am Objekt, auch wenn der Name in den Bildschirm geschoben wird
      if (c.kind !== "skill") l.el.style.setProperty("--lx", `${(-hit.dx).toFixed(1)}px`);
      if (l.place !== hit.p) {
        const cl = l.el.classList;
        if (c.kind === "obj") cl.toggle("up", hit.p === "t");
        else if (c.kind === "skill") {
          cl.toggle("left", hit.p === "t" || hit.p === "l");
          cl.toggle("below", hit.p === "b" || hit.p === "t");
        } else {
          cl.toggle("left", hit.p === "l");
          cl.toggle("above", hit.p === "t");
          cl.toggle("below", hit.p === "b");
        }
        l.place = hit.p;
      }
      if (l.op !== c.op) {
        l.el.style.opacity = String(c.op);
        l.el.classList.add("on");
        l.op = c.op;
      }
    }
    for (const l of labs.values()) {
      if (shown.has(l) || l.op === 0) continue;
      l.el.style.opacity = "0";
      l.el.classList.remove("on");
      l.op = 0;
    }
  };

  /* ---------- Zielerfassung ----------
     Klammern um das hervorgehobene Objekt: Beim Erfassen starten sie weiter
     außen und ziehen sich zusammen, danach folgen sie dem Objekt weich. */
  const ret = { on: false, id: null as ObjectId | null, x: 0, y: 0, r: 0, d: -1 };
  const retRead = opts.reticle?.querySelector<HTMLElement>(".ret-r") ?? null;
  const updateReticle = (dt: number) => {
    const el = opts.reticle;
    if (!el) return;
    const id = (travel && travel.kind === "trip") || intro || dragging ? null : (hovered ?? labelHover);
    const o = id && id !== focused ? OBJ.get(id) : undefined;
    let x = 0;
    let y = 0;
    let r = 0;
    let depth = 0;
    if (o) {
      const W = innerWidth;
      const H = innerHeight;
      camera.getWorldDirection(fwd);
      depth = tmp.copy(o.pos).sub(camera.position).dot(fwd);
      if (depth > 2) {
        tmp.copy(o.pos).project(camera);
        x = (tmp.x * 0.5 + 0.5) * W;
        y = (-tmp.y * 0.5 + 0.5) * H;
        const tanV = Math.tan((camera.fov * D2R) / 2);
        r = clamp(((o.hitR * 0.95) / (depth * tanV)) * (H / 2), 26, Math.min(W, H) * 0.3);
        if (x < -r || x > W + r || y < -r || y > H + r) r = 0;
      }
    }
    if (!r) {
      if (ret.on) {
        ret.on = false;
        ret.id = null;
        el.classList.remove("on");
      }
      return;
    }
    if (!ret.on || ret.id !== id) {
      ret.on = true;
      ret.id = id;
      ret.x = x;
      ret.y = y;
      ret.r = r * 1.8;
      el.classList.remove("on");
      void el.offsetWidth; // Einrast-Animation neu starten
      el.classList.add("on");
    }
    ret.x = lerp(ret.x, x, 1 - Math.exp(-dt * 18));
    ret.y = lerp(ret.y, y, 1 - Math.exp(-dt * 18));
    ret.r = lerp(ret.r, r, 1 - Math.exp(-dt * 8));
    el.style.transform = `translate3d(${(ret.x - ret.r).toFixed(1)}px,${(ret.y - ret.r).toFixed(1)}px,0)`;
    el.style.width = el.style.height = `${(2 * ret.r).toFixed(1)}px`;
    const d = Math.round(o!.pos.distanceTo(camera.position));
    if (retRead && d !== ret.d) {
      ret.d = d;
      retRead.textContent = `${d} AE`;
    }
  };

  const hoverPick = () => {
    if (!needPick || dragging || travel) return;
    needPick = false;
    subPick = pickSub((mouse.x * 0.5 + 0.5) * innerWidth, (-mouse.y * 0.5 + 0.5) * innerHeight);
    hovered = pick();
    canvas.classList.toggle("pointing", !!hovered || subPick != null);
  };

  /* ---------- Resize & Loop ---------- */
  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = baseFov();
    camera.updateProjectionMatrix();
    post.resize(w, h, mqMobile.matches);
    measuredAt = -1;
    if (focused && !travel) {
      const to = (mqMobile.matches && subPin != null && groupPose(subPin)) || arrivalFor(focused);
      basePos.copy(to.pos);
      yaw = yaw + wrapPi(to.yaw - yaw);
      pitch = to.pitch;
    }
  };
  addEventListener("resize", resize);
  // Labels neu vermessen, sobald die Webfonts da sind
  document.fonts?.ready.then(() => (measuredAt = -1));

  /* Adaptive Qualität: Sind die ersten Frames deutlich zu langsam (schwache GPU,
     hohe Pixeldichte), wird die Render-Auflösung schrittweise gesenkt. */
  let prNow = PR;
  let perfN = 0;
  let perfT = 0;
  const measure = (raw: number) => {
    if (perfN < 0 || travel) return;
    // Lücken sind keine Renderzeit (Tab im Hintergrund, Pause, Fenster verschoben):
    // Messung verwerfen und neu einschwingen, statt ein fähiges Gerät als zu langsam einzustufen.
    if (document.hidden || raw > 0.25) {
      perfN = 0;
      perfT = 0;
      return;
    }
    if (perfN++ < 10) return; // Einschwingen (erste Frames nach dem Kompilieren)
    perfT += raw;
    if (perfN < 70) return;
    const avg = perfT / 60;
    perfN = 0;
    perfT = 0;
    if (avg > 1 / 36 && prNow > 1) {
      prNow = Math.max(1, Math.round(prNow * 0.7 * 100) / 100);
      renderer.setPixelRatio(prNow);
      post.setPixelRatio(prNow, innerWidth, innerHeight, mqMobile.matches);
      stars.uniforms.uPR.value = prNow;
      motes.uniforms.uPR.value = prNow;
    } else {
      perfN = -1; // passt (oder geht nicht besser) — nicht weiter messen
      // Selbst bei voller Reduktion kaum 14 fps: zu schwaches Gerät → Listenansicht
      if (avg > 1 / 14) opts.onSlow?.();
    }
  };

  let raf = 0;
  let last = performance.now();
  const loop = (t: number) => {
    const raw = (t - last) / 1000;
    const dt = clamp(raw, 0, 0.05);
    last = t;
    measure(raw);
    now += dt;
    // Shader-Zeit (Flimmern, Pulse, Nebel-Schlieren) läuft bei reduzierter Bewegung langsamer
    ctx.uTime.value += dt * (reduced ? 0.3 : 1);
    post.grain.uniforms.uTime.value = now;
    hoverPick();
    update(dt);
    post.composer.render(dt);
    raf = requestAnimationFrame(loop);
  };

  resize();
  camera.rotation.set(pitch, -yaw, 0, "YXZ");
  if (opts.intro !== false && !reduced && !params.has("nointro")) {
    // Bis die UI meldet, ob eine Titelkarte kommt, auf die Sonne zielen
    titleCard = true;
    settle = true;
    yaw = INTRO_POSE.yaw;
    pitch = INTRO_POSE.pitch;
    intro = { t0: 0, dur: 3.4, p0: INTRO_POSE.pitch + 0.05, y0: INTRO_POSE.yaw, gy: INTRO_POSE.yaw, gp: INTRO_POSE.pitch };
    // Mit Eröffnungsfahrt startet der Ring unsichtbar; ob eine Titelkarte kommt, meldet die UI.
    ringShow.value = 0;
    ringOn = false;
  }
  update(0);
  // Shader parallel kompilieren (KHR_parallel_shader_compile), statt beim ersten
  // Bild den Haupt-Thread sekundenlang zu blockieren. Erst danach startet die Schleife.
  // Ohne die Erweiterung (z. B. manche Safari-Versionen) einmal synchron vorkompilieren.
  let dead = false;
  let started = false;
  let paused = false;
  const setPaused = (p: boolean) => {
    if (p === paused) return;
    paused = p;
    if (p) cancelAnimationFrame(raf);
    else if (started && !dead) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  const compiled: Promise<unknown> = renderer.extensions.has("KHR_parallel_shader_compile")
    ? renderer.compileAsync(scene, camera)
    : new Promise((res) => setTimeout(() => res(renderer.compile(scene, camera)), 0));
  const ready = compiled
    .catch(() => undefined)
    .then(() => {
      if (dead) return;
      post.composer.render(0);
      started = true;
      last = performance.now();
      if (!paused) raf = requestAnimationFrame(loop);
    });

  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    dead = true;
    console.warn("WebGL-Kontext verloren");
    opts.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const destroy = () => {
    dead = true;
    cancelAnimationFrame(raf);
    canvas.removeEventListener("webglcontextlost", onLost);
    for (const t of timers) clearTimeout(t);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onWinMove);
    document.removeEventListener("pointerout", onWinOut);
    mqReduce.removeEventListener("change", onReduce);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("pointerenter", onEnter);
    const mats = new Set<THREE.Material>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material;
      if (Array.isArray(mat)) mat.forEach((x) => mats.add(x));
      else if (mat) mats.add(mat);
    });
    mats.forEach((m) => m.dispose());
    skyRT.dispose();
    baker.dispose();
    post.dispose();
    renderer.dispose();
  };

  return {
    ready,
    focus,
    home,
    setLabelHover: (id) => {
      labelHover = id;
    },
    reveal,
    setSubAuto: (i) => {
      subAuto = i;
    },
    setSubHover: (i) => {
      subHover = i;
    },
    toggleSub: togglePin,
    setPaused,
    setOpening: (active) => {
      ringOn = !active;
      titleCard = active;
    },
    destroy,
  };
}
