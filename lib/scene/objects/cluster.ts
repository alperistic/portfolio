import * as THREE from "three";
import { NOISE } from "../glsl";
import type { Celestial, SceneCtx } from "../types";
import { createRng, lerp, UV_VERT, type Rng } from "../util";

const STAR_VERT = /* glsl */ `
  attribute float aSize; attribute float aB; attribute vec3 aTint; attribute float aGroup;
  uniform float uProj, uTime, uMin, uAny; uniform float uLv[NG];
  varying float vI; varying vec3 vTint;
  void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
    float s = aSize*uProj/max(-mv.z,0.1); float k = 1.0; if (s < uMin) { k = s/uMin; s = uMin; }
    // aktive Skill-Gruppe hell, alle anderen Sterne treten zurück
    float lv = aGroup < -0.5 ? 0.0 : uLv[int(aGroup + 0.5)];
    gl_PointSize = min(s*(1.0 + 0.25*lv), 160.0);
    vI = aB*k*(0.94 + 0.06*sin(uTime*1.3 + position.x*3.0))*(1.0 - 0.5*uAny + 1.3*lv); vTint = aTint; }`;
const STAR_FRAG = /* glsl */ `
  uniform float uHover, uSpike; varying float vI; varying vec3 vTint;
  void main(){
    vec2 c = (gl_PointCoord-0.5)*2.0; float r = length(c);
    float core = exp(-r*r*70.0)*3.0 + exp(-r*r*10.0)*0.3 + exp(-r*3.0)*0.06;
    float sx = exp(-abs(c.y)*70.0)*pow(max(1.0-abs(c.x),0.0),4.0);
    float sy = exp(-abs(c.x)*70.0)*pow(max(1.0-abs(c.y),0.0),4.0);
    float k = (core + (sx+sy)*0.4*uSpike) * vI * (1.0 + 0.4*uHover);
    gl_FragColor = vec4(vTint*k, 1.0);
  }`;

/* Aufbau in der Bildebene des Haufens (x rechts, y oben, z zur Kamera), in Szene-Einheiten. */
const ROW = 10; // Abstand zweier Gruppen in derselben Spalte
const COL_X = 4.4; // Abstand der Gruppen-Sterne von der Mitte
const STEP = 1.4; // Abstand der Skills entlang ihres Bogens (≈ eine Label-Zeile beim Fokus)

type Star = { p: THREE.Vector3; group: number };

/**
 * Anordnung aus den Daten: Gruppen in zwei gegeneinander versetzten Spalten,
 * die Skills jeder Gruppe auf einem Bogen um ihren Stern, nach außen geöffnet.
 * Links stehen die Skill-Namen links, rechts rechts; der Gruppenname zeigt
 * nach innen. Mehr Gruppen oder Skills = der Haufen wächst, kein Code-Umbau.
 */
function layout({ rand, gauss }: Rng, skills: number[]) {
  const n = skills.length;
  const rows = [Math.ceil(n / 2), Math.floor(n / 2)];
  const stagger = n > 1 ? ROW / 4 : 0;
  const groups: (Star & { side: -1 | 1 })[] = [];
  const children: Star[][] = [];
  skills.forEach((k, i) => {
    const col = i % 2;
    const side = col === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const gy = ((rows[col] - 1) / 2 - row) * ROW + (col === 0 ? stagger : -stagger) + (rand() - 0.5) * 1.0;
    const gx = side * (COL_X + (rand() - 0.5) * 1.2);
    const gz = gauss() * 0.9;
    groups.push({ p: new THREE.Vector3(gx, gy, gz), group: i, side });

    const half = ((k - 1) / 2) * STEP;
    const R = Math.max(half + 1.0, 2.4);
    const list: Star[] = [];
    for (let j = 0; j < k; j++) {
      const dy = half - j * STEP + (rand() - 0.5) * 0.24;
      const dx = Math.max(Math.sqrt(Math.max(R * R - dy * dy, 0)) * (0.88 + rand() * 0.24), 1.1);
      list.push({ p: new THREE.Vector3(gx + side * dx, gy + dy, gz + gauss() * 0.6), group: i });
    }
    children.push(list);
  });
  return { groups, children };
}

/**
 * Skills: offener Sternhaufen mit blauem Reflexionsnebel (Plejaden-artig).
 * Jeder helle Stern steht für eine Skill-Gruppe, jeder kleinere Stern um ihn
 * herum für einen einzelnen Skill (Anker für die Beschriftungen).
 * Der Nebel ist Staub, den die hellen Sterne anstrahlen: er leuchtet dicht um
 * sie herum und läuft in feinen, gleichgerichteten Schlieren aus.
 */
export function makeCluster(ctx: SceneCtx, skills: number[]): Celestial {
  // Eigener Zufall: wie viele Skills es gibt, soll Kontakt und Late (danach gebaut) nicht verändern.
  // Den gemeinsamen Zufall drehen wir so weit weiter wie der Haufen vor Etappe 4.
  for (let i = 0; i < ctx.q.cluster * 3; i++) ctx.rng.gauss();
  for (let i = 0; i < ctx.q.cluster * 3; i++) ctx.rng.rand();
  const rng = createRng(29);
  const { rand, gauss } = rng;
  const root = new THREE.Group();
  const hover = { value: 0 };
  const NG = Math.max(skills.length, 1);
  const lv = new Array<number>(NG).fill(0);
  const uLv = { value: lv };
  const uAny = { value: 0 };
  const { groups, children } = layout(rng, skills);

  const stars = (S: Star[], size: number[], bright: number[], spike: number, min: number, tint: number[][]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(S.flatMap((s) => s.p.toArray())), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(size), 1));
    g.setAttribute("aB", new THREE.BufferAttribute(new Float32Array(bright), 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(new Float32Array(tint.flat()), 3));
    g.setAttribute("aGroup", new THREE.BufferAttribute(new Float32Array(S.map((s) => s.group)), 1));
    return new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        defines: { NG },
        uniforms: {
          uProj: ctx.uProj,
          uTime: ctx.uTime,
          uHover: hover,
          uSpike: { value: spike },
          uMin: { value: min },
          uLv,
          uAny,
        },
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
      }),
    );
  };

  // Gruppen: die hellen Sterne
  root.add(
    stars(
      groups,
      groups.map((_, i) => 2.1 + (i % 3) * 0.35),
      groups.map(() => 1),
      1,
      9,
      groups.map(() => [0.74, 0.84, 1.0]),
    ),
  );
  // Skills: kleinere Sterne, klar heller als die schwachen Haufen-Mitglieder
  const skillStars = children.flat();
  root.add(
    stars(
      skillStars,
      skillStars.map(() => 0.85 + rand() * 0.35),
      skillStars.map(() => 0.75 + rand() * 0.2),
      0.35,
      5,
      skillStars.map(() => (rand() < 0.2 ? [1.0, 0.92, 0.8] : [0.8, 0.88, 1.0])),
    ),
  );
  // schwache Mitglieder rundherum
  const M = ctx.q.cluster;
  const faint: Star[] = [];
  for (let i = 0; i < M; i++) faint.push({ p: new THREE.Vector3(gauss() * 7, gauss() * 6.5, gauss() * 3), group: -1 });
  root.add(
    stars(
      faint,
      faint.map(() => 0.35 + Math.pow(rand(), 3) * 0.9),
      faint.map(() => 0.35 + rand() * 0.5),
      0,
      2,
      // meist blau-weiß wie die hellen, vereinzelt gelbliche Mitglieder
      faint.map(() => (rand() < 0.15 ? [1.0, 0.9, 0.74] : [0.74, 0.84, 1.0])),
    ),
  );

  // Reflexionsnebel: feste Fläche in der Haufen-Ebene (der Haufen blickt zum Zentrum),
  // beleuchtet von den hellen Sternen — deren Lage kennt der Shader.
  const W = 46;
  const H = 40;
  const lit = groups.map(({ p }) => new THREE.Vector2(p.x / (W / 2), p.y / (H / 2)));
  if (!lit.length) lit.push(new THREE.Vector2(9, 9));
  // Statisch → einmal beim Start in eine Textur rechnen (5 Oktaven × 3 Felder pro Pixel wären pro Frame teuer).
  const res = ctx.q.small ? 512 : 1024;
  const tex = ctx.bake({
    width: res,
    height: Math.round((res * H) / W),
    defines: { OCT: 5, NB: lit.length },
    uniforms: { uLit: { value: lit }, uAsp: { value: W / H } },
    fragmentShader:
      NOISE +
      /* glsl */ `
      uniform float uAsp; uniform vec2 uLit[NB]; varying vec2 vUv;
      void main(){
        vec2 p = (vUv-0.5)*2.0;
        // Beleuchtung: Summe weicher Lichthöfe um die hellen Sterne
        float light = 0.0;
        for (int i = 0; i < NB; i++) { vec2 d = (p - uLit[i]) * vec2(uAsp, 1.0); light += exp(-dot(d,d)*9.0) + exp(-dot(d,d)*55.0)*0.8; }
        // Staub: feine, gleichgerichtete Schlieren (wie bei den Plejaden) + lockere Wolken
        vec2 sp = mat2(0.87,-0.5,0.5,0.87)*p;
        float warp = fbm(vec3(p*1.3, 2.0));
        float streak = fbm(vec3(sp.x*1.1 + warp*0.3, sp.y*7.5 + warp, 4.0));
        float cloud = fbm(vec3(p*1.8, 9.0))*0.5 + 0.5;
        float dust = smoothstep(-0.05, 0.6, streak*0.7 + (cloud - 0.5)*0.9);
        float edge = 1.0 - smoothstep(0.45, 1.0, length(p));
        float a = dust * (0.12 + light*0.9) * edge;
        gl_FragColor = vec4(vec3(0.24,0.42,1.0)*a*0.15, 1.0);
      }`,
  });
  const neb = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uHover: hover, uTex: { value: tex } },
      vertexShader: UV_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex; uniform float uHover; varying vec2 vUv;
        void main(){ gl_FragColor = vec4(texture2D(uTex, vUv).rgb*(1.0 + 0.4*uHover), 1.0); }`,
    }),
  );
  root.add(neb);

  const anchor = (p: THREE.Vector3, side: "l" | "r") => {
    const a = new THREE.Object3D();
    a.position.copy(p);
    a.userData.side = side;
    root.add(a);
    return a;
  };
  // Gruppenname nach innen, Skill-Namen nach außen
  const anchors = groups.map((g) => anchor(g.p, g.side < 0 ? "r" : "l"));
  const childAnchors = children.map((list, i) => list.map((c) => anchor(c.p, groups[i].side < 0 ? "l" : "r")));

  return {
    root,
    hover,
    visR: 13,
    labelR: 12,
    hitR: 17,
    anchors,
    childAnchors,
    update: ({ dt, sub, focused }) => {
      const k = 1 - Math.exp(-dt * 6);
      let any = 0;
      for (let i = 0; i < NG; i++) {
        lv[i] = lerp(lv[i], focused === "skills" && sub === i ? 1 : 0, k);
        any = Math.max(any, lv[i]);
      }
      uAny.value = any;
    },
  };
}
