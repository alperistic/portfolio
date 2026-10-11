import * as THREE from "three";
import { NOISE } from "../glsl";
import type { Celestial, SceneCtx } from "../types";
import { frameAt } from "../util";
import { makeSun } from "./sun";

/**
 * Evidence-First Pipeline: Doppelstern — Behauptung ↔ Beleg, die sich gegenseitig prüfen.
 * Zwei Sonnen kreisen um den gemeinsamen Schwerpunkt; die Bahnebene ist
 * zum Betrachter geneigt, damit man die Bewegung sieht.
 * Ein feiner Materiestrom fließt vom warmen zum blauen Stern und speist dort
 * eine kleine Akkretionsscheibe — die Kopplung wird sichtbar, ohne laut zu sein.
 */
export function makeBinary(ctx: SceneCtx, pos: THREE.Vector3): Celestial {
  const root = new THREE.Group();
  const hover = { value: 0 };
  const a = makeSun(ctx, {
    radius: 1.45,
    color: [1.0, 0.55, 0.22],
    hot: [1.0, 0.8, 0.55],
    corona: [1.0, 0.68, 0.36],
    intensity: 0.95,
    coronaI: 0.46,
    ext: 3.2,
    hover,
  });
  const b = makeSun(ctx, {
    radius: 1.0,
    // Kern bewusst nicht fast weiß: Das Tone-Mapping erhält den Farbton,
    // also muss er auch drinstecken, damit der Stern blau wirkt.
    color: [0.15, 0.3, 1.0],
    hot: [0.3, 0.48, 1.0],
    corona: [0.3, 0.5, 1.0],
    intensity: 0.85,
    coronaI: 0.42,
    ext: 3.6,
    hover,
  });
  root.add(a.group, b.group);

  // Bahnebene: Basis (u, v) im Raum, um ~62° aus der Blickebene gekippt.
  const f = frameAt(pos);
  const tiltA = 1.08;
  const u = f.right.clone();
  const v = f.up.clone().multiplyScalar(Math.cos(tiltA)).addScaledVector(f.a, Math.sin(tiltA));
  const rA = 2.3;
  const rB = 4.3; // leichterer Begleiter läuft weiter außen

  // Zarte Bahnlinien — nur ein Hauch, heller bei Hover/Fokus
  const orbitMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.7, 0.75, 0.95),
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (const r of [rA, rB]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      pts.push(u.clone().multiplyScalar(Math.cos(t) * r).addScaledVector(v, Math.sin(t) * r));
    }
    root.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), orbitMat));
  }

  /* ---------- Materiestrom A → B ---------- */
  const SN = ctx.q.small ? 260 : 520;
  const seed = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) seed.set([ctx.rng.rand(), ctx.rng.gauss(), ctx.rng.gauss()], i * 3);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SN * 3), 3));
  sg.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
  const uA = { value: new THREE.Vector3() };
  const uB = { value: new THREE.Vector3() };
  const uC = { value: new THREE.Vector3() };
  const stream = new THREE.Points(
    sg,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uA, uB, uC, uTime: ctx.uTime, uProj: ctx.uProj, uHover: hover },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed; uniform vec3 uA, uB, uC; uniform float uTime, uProj, uHover; varying vec3 vC;
        void main(){
          float s = fract(aSeed.x + uTime*0.16);
          float m = 1.0 - s;
          vec3 p = m*m*uA + 2.0*m*s*uC + s*s*uB;                 // quadratische Bézier-Kurve
          vec3 side = normalize(cross(uB - uA, vec3(0.0,1.0,0.0)) + 1e-4);
          vec3 up2 = normalize(cross(side, uB - uA));
          float w = 0.05 + 0.12*s;                               // fächert zum Ziel hin auf
          p += side*aSeed.y*w + up2*aSeed.z*w;
          vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv;
          float sz = 0.14*uProj/max(-mv.z,0.1); float k = 1.0; if (sz < 1.5) { k = sz*sz/2.25; sz = 1.5; }
          gl_PointSize = min(sz, 20.0);
          float fade = smoothstep(0.0, 0.12, s) * (1.0 - smoothstep(0.8, 1.0, s));
          vC = mix(vec3(1.0,0.7,0.42), vec3(0.55,0.72,1.0), s) * fade * k * (0.35 + 0.4*uHover);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC;
        void main(){ vec2 c = gl_PointCoord-0.5; gl_FragColor = vec4(vC*exp(-dot(c,c)*16.0), 1.0); }`,
    }),
  );
  stream.frustumCulled = false;
  root.add(stream);

  /* ---------- Akkretionsscheibe um B (in der Bahnebene) ----------
     Bewusst klein und ohne Außenkante: ein heißer, wirbelnder Saum um den Stern,
     kein Ring — sonst liest es sich wie ein Planet mit Ringen. */
  const disk = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 2.0, 96, 1),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      defines: { OCT: 3 },
      uniforms: { uTime: ctx.uTime, uHover: hover },
      vertexShader: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uTime, uHover; varying vec2 vP;
        void main(){
          float r = length(vP); float th = atan(vP.y, vP.x);
          float swirl = fbm(vec3(cos(th - uTime*0.5 + r*2.0)*1.6, sin(th - uTime*0.5 + r*2.0)*1.6, r*2.5));
          float a = exp(-(r - 1.0)*4.0) * (0.5 + 0.5*swirl) * (1.0 - smoothstep(1.3, 2.0, r));
          gl_FragColor = vec4(mix(vec3(0.7,0.84,1.0), vec3(1.0,0.8,0.64), smoothstep(1.1, 1.8, r)) * a * (0.3 + 0.2*uHover), 1.0);
        }`,
    }),
  );
  // Ring liegt in xy → per Basis in die Bahnebene (u, v) drehen
  disk.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, new THREE.Vector3().crossVectors(u, v)));
  b.group.add(disk);

  let phase = 0.6;
  const perp = new THREE.Vector3();
  const place = () => {
    const c = Math.cos(phase);
    const s = Math.sin(phase);
    a.group.position.copy(u).multiplyScalar(-c * rA).addScaledVector(v, -s * rA);
    b.group.position.copy(u).multiplyScalar(c * rB).addScaledVector(v, s * rB);
    // Strom startet an A (zu B hin), biegt hinter der Bahnbewegung her und endet am Scheibenrand
    perp.copy(u).multiplyScalar(-s).addScaledVector(v, c); // Bewegungsrichtung von B
    uC.value.lerpVectors(a.group.position, b.group.position, 0.55).addScaledVector(perp, -1.3);
    uA.value.copy(uC.value).sub(a.group.position).setLength(1.35).add(a.group.position);
    uB.value.copy(uC.value).sub(b.group.position).setLength(2.2).add(b.group.position);
  };
  place();

  return {
    root,
    hover,
    visR: 7.5,
    labelR: 6,
    hitR: 7,
    update: ({ dt, rs }) => {
      phase += dt * 0.32 * rs;
      place();
      a.core.rotation.y += dt * 0.05 * rs;
      b.core.rotation.y += dt * 0.07 * rs;
      orbitMat.opacity = 0.04 + 0.06 * hover.value;
    },
  };
}
