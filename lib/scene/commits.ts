import * as THREE from "three";
import type { SceneCtx, Uniform } from "./types";
import { createRng } from "./util";

/** Wo die Commit-Sterne eines Objekts sitzen. */
export type CommitHost = {
  /** Gruppe, an die die Sterne gehängt werden (dreht sich mit dem Objekt). */
  obj: THREE.Object3D;
  /**
   * `disk`: in der Scheibe entlang der Spiralarme (Galaxie, `armPhase` gibt die
   * Arm-Lage je Radius). `halo`: als lockere Hülle ums Objekt.
   */
  shape: "disk" | "halo";
  r: number;
  armPhase?: (r: number) => number;
};

/** Tage, die als „frisch“ gelten — diese Commits glimmen etwas wärmer. */
const RECENT = 14;
const DAY = 86400000;

/**
 * Commit-Sterne: ein kleiner Stern je Commit, wie Jahresringe angeordnet —
 * die ältesten innen, die neuesten außen. So wächst ein Projekt im Himmel mit
 * der Arbeit daran. Frische Commits (letzte zwei Wochen vor dem Datenstand)
 * sind wärmer und flackern leicht.
 *
 * Eigener Zufallsgenerator je Objekt: Die übrige Szene bleibt dadurch exakt
 * gleich, egal wie viele Commits dazukommen.
 */
export function makeCommitStars(
  ctx: SceneCtx,
  host: CommitHost,
  days: Record<string, number>,
  asOf: string,
  tint: THREE.Color,
  hover: Uniform<number>,
) {
  // Ein Eintrag je Commit, zeitlich sortiert
  const dates = Object.keys(days).sort();
  const times: number[] = [];
  for (const d of dates) for (let k = 0; k < days[d]; k++) times.push(Date.parse(d));
  const N = times.length;
  if (!N) return null;
  const t0 = times[0];
  const t1 = Math.max(times[N - 1], t0 + DAY);
  const end = Date.parse(asOf);

  const { rand, gauss } = createRng(1000 + N * 7 + Math.round(host.r * 13));
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const fresh = new Float32Array(N);
  const warm = new THREE.Color(1.0, 0.82, 0.55);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    // Zeit → Radius: innen alt, außen neu (Zeit der Commits, nicht ihre Nummer)
    const u = (times[i] - t0) / (t1 - t0);
    const recent = Math.max(0, 1 - (end - times[i]) / (RECENT * DAY));
    let x: number;
    let y: number;
    let z: number;
    if (host.shape === "disk") {
      const r = host.r * (0.22 + 0.78 * Math.pow(u, 0.9)) * (0.96 + rand() * 0.08);
      const a = (i % 2) * Math.PI + (host.armPhase?.(r) ?? 0) + gauss() * 0.22;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.18;
    } else {
      const r = host.r * (0.75 + 0.55 * u) * (0.94 + rand() * 0.12);
      // gleichmäßig auf der Kugel, etwas abgeflacht
      const th = rand() * Math.PI * 2;
      const ct = rand() * 2 - 1;
      const st = Math.sqrt(1 - ct * ct);
      x = Math.cos(th) * st * r;
      y = ct * r * 0.6;
      z = Math.sin(th) * st * r;
    }
    pos.set([x, y, z], i * 3);
    c.copy(tint).lerp(warm, recent * 0.7);
    const b = 0.3 + Math.pow(rand(), 3) * 0.3 + recent * 0.25;
    col.set([c.r * b, c.g * b, c.b * b], i * 3);
    size[i] = 0.09 + rand() * 0.06 + recent * 0.03;
    fresh[i] = recent > 0 ? 0.5 + rand() * 0.5 : 0;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aFresh", new THREE.BufferAttribute(fresh, 1));
  const pts = new THREE.Points(
    g,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uProj: ctx.uProj, uHover: hover, uTime: ctx.uTime },
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute float aSize, aFresh; uniform float uProj, uHover, uTime; varying vec3 vColor;
        void main(){
          vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
          float s = aSize*uProj/max(-mv.z, 0.1);
          float k = 1.0; if (s < 1.2) { k = (s*s)/(1.2*1.2); s = 1.2; }
          gl_PointSize = min(s, 18.0);
          // frische Commits flackern leise, jeder in eigenem Takt
          float fl = 1.0 + aFresh*0.45*sin(uTime*(1.3 + aFresh) + position.x*3.1 + position.z*1.7);
          vColor = aColor*k*fl*(1.0 + 0.6*uHover);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main(){ vec2 c = gl_PointCoord-0.5; float a = exp(-dot(c,c)*14.0)*(1.0 - smoothstep(0.35, 0.5, length(c))); gl_FragColor = vec4(vColor*a, 1.0); }`,
    }),
  );
  pts.renderOrder = 1;
  pts.frustumCulled = false;
  host.obj.add(pts);
  return pts;
}
