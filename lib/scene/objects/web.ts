import * as THREE from "three";
import type { ObjectId } from "@/content/types";
import type { Celestial, SceneCtx } from "../types";
import { UV_VERT } from "../util";
import { billboard } from "./billboard";

export type WebTarget = { id: ObjectId; pos: THREE.Vector3; radius: number };

const MAX_STRANDS = 8;

/**
 * Late: kosmisches Netz. Ein Knoten, von dem Filamente zu den Projekten laufen,
 * die unter Late entstanden sind (plus ein paar Stränge ins Leere).
 *
 * - Jedes Filament besteht aus mehreren locker verdrillten Fasern mit Verdichtungen
 *   (wie echte Filamente, an denen Galaxien perlen) und einem feinen Leuchtfaden,
 *   der auch aus großer Entfernung noch als Verbindung lesbar ist.
 * - Im Ruhezustand kaum sichtbar. Bei Hover/Fokus auf Late leuchten die Filamente
 *   zu den Projekten auf, Pulse wandern vom Knoten zu ihnen, und an jedem Projekt
 *   glimmt ein Andockpunkt. Hover auf ein Projekt lässt „seinen“ Strang leicht mitleuchten.
 */
export function makeWeb(ctx: SceneCtx, nodePos: THREE.Vector3, targets: WebTarget[], view: THREE.Vector3): Celestial {
  const { rand, gauss } = ctx.rng;
  const root = new THREE.Group();
  const hover = { value: 0 };
  const uLv = { value: new Array<number>(MAX_STRANDS).fill(0) };

  type Strand = { curve: THREE.CubicBezierCurve3; linked: boolean; share: number; target?: WebTarget };
  const strands: Strand[] = [];
  const side = new THREE.Vector3();
  const rndDir = () => new THREE.Vector3(gauss(), gauss(), gauss()).normalize();
  for (const t of targets) {
    const to = t.pos.clone().sub(nodePos);
    const len = to.length();
    to.setLength(len - t.radius * 1.15); // kurz vor dem Objekt enden
    side.copy(rndDir()).cross(to).normalize();
    const c1 = to.clone().multiplyScalar(0.33).addScaledVector(side, len * 0.12);
    const c2 = to.clone().multiplyScalar(0.7).addScaledVector(side, -len * 0.06).addScaledVector(rndDir(), len * 0.05);
    strands.push({ curve: new THREE.CubicBezierCurve3(new THREE.Vector3(), c1, c2, to), linked: true, share: 1, target: t });
  }
  const loose = Math.min(ctx.q.small ? 3 : 5, MAX_STRANDS - strands.length);
  for (let i = 0; i < loose; i++) {
    const d = rndDir();
    const len = 30 + rand() * 45;
    const end = d.clone().multiplyScalar(len);
    side.copy(rndDir()).cross(d).normalize();
    const c1 = d.clone().multiplyScalar(len * 0.35).addScaledVector(side, len * 0.15);
    const c2 = d.clone().multiplyScalar(len * 0.7).addScaledVector(side, -len * 0.1);
    strands.push({ curve: new THREE.CubicBezierCurve3(new THREE.Vector3(), c1, c2, end), linked: false, share: 0.4 });
  }

  /* ---------- Partikel: Knoten + Fasern ---------- */
  const total = ctx.q.web;
  const nodeCount = Math.round(total * 0.08);
  const shareSum = strands.reduce((s, x) => s + x.share, 0);
  const perStrand = strands.map((s) => Math.round(((total - nodeCount) * s.share) / shareSum));
  const N = nodeCount + perStrand.reduce((a, b) => a + b, 0);
  const pos = new Float32Array(N * 3);
  const aT = new Float32Array(N);
  const aS = new Float32Array(N);
  const aB = new Float32Array(N);
  const aSz = new Float32Array(N);
  let k = 0;
  const pt = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const n1 = new THREE.Vector3();
  const n2 = new THREE.Vector3();
  for (let i = 0; i < nodeCount; i++, k++) {
    // Knoten: dichter, leicht abgeplatteter Haufen
    const r = Math.pow(rand(), 1.8) * 5.5;
    pt.copy(rndDir()).multiplyScalar(r);
    pt.y *= 0.6;
    pos.set([pt.x, pt.y, pt.z], k * 3);
    aT[k] = 0;
    aS[k] = -1;
    aB[k] = 0.25 + rand() * 0.5 * (1 - r / 6);
    aSz[k] = 0.1 + rand() * 0.2;
  }
  strands.forEach((s, si) => {
    // 3 Fasern pro Strang, jede mit eigener Phase/Amplitude; Knoten (Verdichtungen) an zufälligen Stellen
    const fibers = [0, 1, 2].map(() => ({ ph: rand() * 6.28, amp: 0.6 + rand() * 1.4, freq: 2 + rand() * 3 }));
    const knots = Array.from({ length: s.linked ? 5 : 2 }, () => 0.15 + rand() * 0.75);
    for (let i = 0; i < perStrand[si]; i++, k++) {
      let t = rand();
      if (rand() < 0.22) t = knots[Math.floor(rand() * knots.length)] + gauss() * 0.012;
      t = Math.min(1, Math.max(0, t));
      s.curve.getPoint(t, pt);
      s.curve.getTangent(t, tan);
      n1.copy(tan).cross(Math.abs(tan.y) < 0.9 ? THREE.Object3D.DEFAULT_UP : side.set(1, 0, 0)).normalize();
      n2.crossVectors(tan, n1);
      const f = fibers[i % 3];
      const bulge = Math.sin(Math.PI * t);
      const a = f.ph + t * f.freq * Math.PI * 2;
      const spread = f.amp * bulge * (s.linked ? 1.4 : 1);
      pt.addScaledVector(n1, Math.cos(a) * spread).addScaledVector(n2, Math.sin(a) * spread);
      // feine Streuung um die Faser — dünner als früher, damit es fädig statt wolkig wirkt
      const w = 0.12 + 0.55 * bulge;
      pt.addScaledVector(rndDir(), Math.abs(gauss()) * w);
      pos.set([pt.x, pt.y, pt.z], k * 3);
      aT[k] = t;
      aS[k] = si;
      aB[k] = 0.2 + Math.pow(rand(), 3) * 0.8;
      aSz[k] = 0.08 + rand() * 0.18;
    }
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
  g.setAttribute("aS", new THREE.BufferAttribute(aS, 1));
  g.setAttribute("aB", new THREE.BufferAttribute(aB, 1));
  g.setAttribute("aSize", new THREE.BufferAttribute(aSz, 1));
  const linkedFlags = strands.map((s) => (s.linked ? 1 : 0));
  while (linkedFlags.length < MAX_STRANDS) linkedFlags.push(0);
  const shared = {
    uProj: ctx.uProj,
    uTime: ctx.uTime,
    uHover: hover,
    uLv,
    uLinked: { value: linkedFlags },
  };
  // Pro Strang: Leuchtstärke (verbundene: uLv, lose: nur ein Hauch von uHover)
  const LEVEL = /* glsl */ `
    uniform float uLv[${MAX_STRANDS}]; uniform float uLinked[${MAX_STRANDS}]; uniform float uHover;
    float strandLevel(float s, out float linked){
      if (s < 0.0) { linked = 1.0; return uHover; }
      int i = int(s + 0.5); linked = uLinked[i];
      return linked > 0.5 ? uLv[i] : uHover*0.35;
    }`;
  const pts = new THREE.Points(
    g,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: shared,
      vertexShader:
        LEVEL +
        /* glsl */ `
        attribute float aT, aS, aB, aSize; uniform float uProj, uTime; varying vec3 vC;
        void main(){
          vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
          float s = aSize*uProj/max(-mv.z,0.1); float k = 1.0; if (s < 1.5) { k = s*s/2.25; s = 1.5; }
          gl_PointSize = min(s, 36.0);
          float linked; float lv = strandLevel(aS, linked);
          float fade = mix(1.0 - aT*0.9, 1.0, linked);               // lose Stränge laufen aus
          float base = 0.14 + 0.42*lv;                               // ruhig → leuchtend
          float wave = linked * pow(max(0.5 + 0.5*sin(aT*14.0 - uTime*1.8), 0.0), 10.0) * lv * 1.4;
          vec3 col = mix(vec3(0.46,0.46,1.0), vec3(0.8,0.7,1.0), aB);
          vC = col * aB * k * fade * (base + wave);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC;
        void main(){ vec2 c = gl_PointCoord-0.5; float a = exp(-dot(c,c)*16.0); gl_FragColor = vec4(vC*a, 1.0); }`,
    }),
  );
  pts.frustumCulled = false; // Filamente reichen weit über die Bounding-Sphere des Knotens hinaus
  root.add(pts);

  /* ---------- Leuchtfäden (1 px Linien) — lesbar auch aus der Distanz ---------- */
  const SEG = 160;
  const lp: number[] = [];
  const lt: number[] = [];
  const ls: number[] = [];
  const idx: number[] = [];
  strands.forEach((s, si) => {
    const base = lp.length / 3;
    for (let i = 0; i <= SEG; i++) {
      s.curve.getPoint(i / SEG, pt);
      lp.push(pt.x, pt.y, pt.z);
      lt.push(i / SEG);
      ls.push(si);
      if (i > 0) idx.push(base + i - 1, base + i);
    }
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
  lg.setAttribute("aT", new THREE.Float32BufferAttribute(lt, 1));
  lg.setAttribute("aS", new THREE.Float32BufferAttribute(ls, 1));
  lg.setIndex(idx);
  const threads = new THREE.LineSegments(
    lg,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: shared,
      vertexShader:
        LEVEL +
        /* glsl */ `
        attribute float aT, aS; uniform float uTime; varying float vI;
        void main(){
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
          float linked; float lv = strandLevel(aS, linked);
          float fade = mix((1.0 - aT)*(1.0 - aT), 1.0 - 0.3*aT, linked);
          float pulse = linked * pow(max(0.5 + 0.5*sin(aT*14.0 - uTime*1.8), 0.0), 12.0);
          vI = fade * (0.03 + 0.2*lv + pulse*lv*0.9);
        }`,
      fragmentShader: /* glsl */ `
        varying float vI;
        void main(){ gl_FragColor = vec4(vec3(0.66,0.6,1.0)*vI, 1.0); }`,
    }),
  );
  threads.frustumCulled = false;
  root.add(threads);

  /* ---------- Andockpunkte an den Projekten ---------- */
  const docks: { lv: { value: number } }[] = [];
  strands.forEach((s, si) => {
    if (!s.linked) return;
    const lv = { value: 0 };
    const m = billboard(
      ctx,
      7,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uLv: lv, uTime: ctx.uTime, uPh: { value: si * 1.7 } },
        vertexShader: UV_VERT,
        fragmentShader: /* glsl */ `
          uniform float uLv, uTime, uPh; varying vec2 vUv;
          void main(){ float r = length(vUv-0.5)*2.0;
            float g = exp(-r*r*60.0)*0.9 + exp(-r*4.0)*0.12;
            float beat = 0.8 + 0.2*sin(uTime*1.8 + uPh);
            gl_FragColor = vec4(vec3(0.75,0.66,1.0)*g*uLv*beat*(1.0-smoothstep(0.7,1.0,r)), 1.0); }`,
      }),
    );
    m.position.copy(s.curve.v3);
    root.add(m);
    docks.push({ lv });
  });

  /* ---------- Knotenleuchten ---------- */
  root.add(
    billboard(
      ctx,
      22,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uHover: hover },
        vertexShader: UV_VERT,
        fragmentShader: /* glsl */ `
          uniform float uHover; varying vec2 vUv;
          void main(){ float r = length(vUv-0.5)*2.0;
            float g = exp(-r*r*120.0)*0.5 + exp(-r*r*14.0)*0.08 + exp(-r*5.0)*0.05;
            gl_FragColor = vec4(vec3(0.72,0.62,1.0)*g*(0.7 + 0.5*uHover)*(1.0-smoothstep(0.75,1.0,r)), 1.0); }`,
      }),
    ),
  );

  // Anflug als Übersicht: Knoten + die verbundenen Projekte gemeinsam im Bild
  const spheres = [{ pos: nodePos.clone(), r: 8 }, ...targets.map((t) => ({ pos: t.pos.clone(), r: t.radius }))];

  return {
    root,
    hover,
    visR: 14,
    labelR: 5,
    hitR: 8,
    framing: targets.length ? { spheres, view } : undefined,
    update: ({ level }) => {
      let d = 0;
      strands.forEach((s, i) => {
        if (!s.target) return;
        const lv = Math.max(hover.value, 0.6 * level(s.target.id));
        uLv.value[i] = lv;
        docks[d++].lv.value = lv;
      });
    },
  };
}
