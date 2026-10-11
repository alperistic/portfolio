import * as THREE from "three";

export const D2R = Math.PI / 180;
export const UP = new THREE.Vector3(0, 1, 0);

/** Blickrichtung aus Azimut/Höhe in Grad (0° = -Z, positiv nach rechts/oben). */
export const dirFrom = (yawDeg: number, pitchDeg: number) => {
  const y = yawDeg * D2R;
  const p = pitchDeg * D2R;
  return new THREE.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
};

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Deterministischer Zufall: gleiche Szene bei jedem Laden. */
export function createRng(seed = 7) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const gauss = () => {
    let u = 0;
    while (u === 0) u = rand();
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { rand, gauss };
}
export type Rng = ReturnType<typeof createRng>;

/** Basis mit Blick vom Zentrum auf `pos`: a = Blickachse, right/up = Bildebene. */
export function frameAt(pos: THREE.Vector3) {
  const a = pos.clone().normalize();
  const right = new THREE.Vector3().crossVectors(a, UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, a).normalize();
  return { a, right, up };
}

/** Vertex-Shader für Billboards/Quads mit UV. */
export const UV_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
