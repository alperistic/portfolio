import * as THREE from "three";
import { makeStarPoints } from "./commits";
import type { SceneCtx, Uniform } from "./types";
import { createRng, D2R } from "./util";

/** Beiträge je Tag ab `from` (einem Sonntag), Stand `asOf` — siehe content/contributions.ts. */
export type ContributionData = { asOf: string; from: string; counts: number[] };

/* Maße relativ zur Sonne (Radius 5,2; Korona sichtbar bis ~15). Innenradius so,
   dass der Ring klar außerhalb von Korona und Bloom liegt und das Sonnen-Label
   (7,2 unter der Mitte) im Loch des Rings bleibt, statt von Punkten gekreuzt zu werden. */
const R_IN = 18;
/** Ringbreite: 7 Spuren (So innen … Sa außen), 20 % des Innenradius — schmal. */
const WIDTH = R_IN * 0.2;
/** Naht zwischen neuester und ältester Woche, in Wochen. */
const SEAM = 1.25;
/**
 * Neigung um die Querachse: Die Kamera schaut aus der Startansicht ~40° von oben
 * auf die Ringebene (Sonne steht 3° über dem Horizont) — offene Ellipse, weder Strich
 * noch Scheibe. Dazu ein kleiner Rollwinkel gegen den Lineal-Look.
 */
const TILT = 43 * D2R;
const ROLL = 6 * D2R;
/** Tage, die als „frisch“ gelten — sie flackern leise wärmer (wie bei den Commit-Sternen). */
const RECENT = 14;
const DAY = 86400000;

/**
 * Jahresring: Alpers GitHub-Beitragskalender des letzten Jahres als Ring aus
 * Lichtpunkten um die Sonne. Das GitHub-Raster (Wochen × 7 Wochentage) ist zu
 * einem Ring gerollt: die Wochen laufen im Winkel um die Sonne, die Wochentage
 * sind sieben Spuren von innen (Sonntag) nach außen (Samstag) — wie bei GitHub
 * von oben nach unten. Ein Punkt je Tag; die Helligkeit folgt der Aktivität,
 * Tage ohne Beitrag sind nur schwacher Staub.
 *
 * Laufrichtung wie ein Zifferblatt: Die Naht liegt oben (12 Uhr, hinter der
 * Sonne), die Zeit läuft aus der Startansicht im Uhrzeigersinn — älteste Woche
 * rechts neben der Naht, über rechts, vorne unten und links zurück bis zur
 * neuesten Woche links neben der Naht. Der Uhrzeigersinn ist die vertrauteste
 * Lesart für „Zeit läuft vorwärts“ auf einem Kreis.
 *
 * Statisch (keine Drehung), damit die Naht an ihrem Platz bleibt. Eigener
 * Zufallsgenerator: Die übrige Szene bleibt dadurch exakt gleich.
 */
export function makeContributionRing(
  ctx: SceneCtx,
  parent: THREE.Object3D,
  data: ContributionData,
  tint: THREE.Color,
  hover: Uniform<number>,
  /** 0…1: Einblenden nach der Eröffnung (die Engine steuert das). */
  show: Uniform<number>,
) {
  const { counts } = data;
  const N = counts.length;
  if (!N) return null;
  const weeks = Math.ceil(N / 7);
  const dA = (Math.PI * 2) / (weeks + SEAM);
  const dR = WIDTH / 6;
  const t0 = Date.parse(data.from);
  const end = Date.parse(data.asOf);

  // Normierung über das 95. Perzentil der aktiven Tage (log): ein Ausreißer drückt nicht alles platt
  const active = counts.filter((n) => n > 0).sort((a, b) => a - b);
  const p95 = active.length ? active[Math.floor(0.95 * (active.length - 1))] : 1;
  const norm = Math.log1p(Math.max(p95, 1));

  const { rand, gauss } = createRng(5113 + N);
  // leichtes Zittern (Gauß, auf ±25 % des Zellabstands begrenzt): kein CAD-Raster, Spuren bleiben lesbar
  const jit = () => Math.max(-0.25, Math.min(0.25, gauss() * 0.1));
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const fresh = new Float32Array(N);
  const white = new THREE.Color(1.0, 0.93, 0.82);
  const amber = new THREE.Color(1.0, 0.6, 0.3);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const w = Math.floor(i / 7);
    const day = i % 7;
    // Winkel 0 = oben (hinten), wachsend = im Uhrzeigersinn aus der Startansicht
    const a = (SEAM / 2 + w + 0.5 + jit()) * dA;
    const r = R_IN + (day + jit()) * dR;
    pos.set([Math.sin(a) * r, gauss() * dR * 0.12, -Math.cos(a) * r], i * 3);

    const n = counts[i];
    const recent = Math.max(0, 1 - (end - (t0 + i * DAY)) / (RECENT * DAY));
    let b: number;
    if (n > 0) {
      const v = Math.min(1, Math.log1p(n) / norm);
      c.copy(tint).lerp(white, v * v * 0.7);
      b = 0.2 + 0.38 * v;
      size[i] = 0.17 + 0.17 * v;
    } else {
      // Staub: gerade noch da, damit das Raster erahnbar bleibt. Nicht kleiner als
      // ~2 px zeichnen — noch kleinere Punkte fallen zwischen die Pixel und verschwinden.
      c.copy(tint);
      b = 0.16 + rand() * 0.03;
      size[i] = 0.15;
    }
    c.lerp(amber, recent * 0.35);
    col.set([c.r * b, c.g * b, c.b * b], i * 3);
    fresh[i] = recent > 0 ? 0.5 + rand() * 0.5 : 0;
  }

  const pts = makeStarPoints(ctx, { pos, col, size, fresh }, hover, show);
  pts.rotation.set(TILT, 0, ROLL, "ZXY");
  parent.add(pts);
  return pts;
}
