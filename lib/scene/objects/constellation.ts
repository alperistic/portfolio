import * as THREE from "three";
import type { Celestial, SceneCtx } from "../types";
import { lerp } from "../util";

/** Wann das Zeichnen nach dem Fokus beginnt (s) und wie lange eine Verbindung braucht. */
const DRAW_DELAY = 1.2;
const DRAW_SEG = 0.55;

/**
 * Werdegang: Sternbild. Ein Stern pro Station — die Punkte werden aus der
 * Anzahl der sichtbaren Stationen erzeugt, das Sternbild wächst also mit.
 *
 * Beim Anflug zeichnet sich das Sternbild neu: Die Stationen zünden der Reihe
 * nach, die Linie zieht sich mit einem Funken an der Spitze von Stern zu Stern.
 * `uDraw` ist der Fortschritt in Stationen (0 = erste Station, n-1 = alles).
 * Die Anker bekommen `userData.lit`, damit die Engine die Stations-Labels im
 * selben Takt zeigt.
 */
export function makeConstellation(ctx: SceneCtx, count: number): Celestial {
  const n = Math.max(1, count);
  const width = Math.max(10, (n - 1) * 6.4);
  const P: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const zig = n > 2 ? (i % 2 ? 1.5 : -1.1) : 0;
    P.push(new THREE.Vector3((t - 0.5) * width, lerp(-4.6, 4.6, t) + zig, (i % 2 ? -1.2 : 1) * 1.2));
  }

  const group = new THREE.Group();
  const hover = { value: 0 };
  const focus = { value: 0 };
  // Ruhezustand: weit hinter der letzten Station (alles gezeichnet, kein Aufblitzen mehr)
  const REST = n + 2;
  const draw = { value: REST };
  const g = new THREE.BufferGeometry().setFromPoints(P);
  g.setAttribute("aIdx", new THREE.BufferAttribute(new Float32Array(n).map((_, i) => i), 1));
  // jüngste Station (heute) etwas heller
  const sizes = new Float32Array(n).map((_, i) => 1.5 + (i === n - 1 ? 0.9 : i * 0.12));
  g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  group.add(
    new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uProj: ctx.uProj, uHover: hover, uFocus: focus, uTime: ctx.uTime, uDraw: draw },
        vertexShader: /* glsl */ `
          attribute float aSize, aIdx; uniform float uProj, uTime, uDraw; varying float vI;
          void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
            // noch nicht gezündet: glimmt nur; beim Zünden kurz aufblitzen
            float lit = smoothstep(aIdx - 0.35, aIdx, uDraw);
            float since = uDraw - aIdx;
            float flash = since >= 0.0 ? exp(-since*2.6)*1.6 : 0.0;
            float boost = mix(0.28, 1.0, lit) + flash;
            gl_PointSize = clamp(aSize*uProj/max(-mv.z,0.1), 10.0, 180.0) * (1.0 + 0.35*flash);
            vI = (0.9 + 0.1*sin(uTime*1.7 + position.x)) * boost; }`,
        fragmentShader: /* glsl */ `
          uniform float uHover, uFocus; varying float vI;
          void main(){
            vec2 c = (gl_PointCoord-0.5)*2.0; float r = length(c);
            float core = exp(-r*r*70.0)*3.2 + exp(-r*r*10.0)*0.35 + exp(-r*3.0)*0.08;
            float sx = exp(-abs(c.y)*70.0)*pow(max(1.0-abs(c.x),0.0),4.0);
            float sy = exp(-abs(c.x)*70.0)*pow(max(1.0-abs(c.y),0.0),4.0);
            float k = (core + (sx+sy)*0.45) * vI * (1.0 + 0.4*uHover + 0.3*uFocus);
            gl_FragColor = vec4(vec3(0.82,0.88,1.0)*k, 1.0);
          }`,
      }),
    ),
  );
  // Linien: je Verbindung eine Strecke; aT läuft von i (Start) bis i+1 (Ziel) und
  // wird über die Linie interpoliert — so kann der Shader sie bis `uDraw` kappen.
  const segs: THREE.Vector3[] = [];
  const segT: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = P[i];
    const b = P[i + 1];
    const d = b.clone().sub(a).normalize();
    segs.push(a.clone().addScaledVector(d, 0.9), b.clone().addScaledVector(d, -0.9));
    segT.push(i, i + 1);
  }
  const lineOp = { value: 0.28 };
  const lineMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uDraw: draw, uOp: lineOp },
    vertexShader: /* glsl */ `
      attribute float aT; varying float vT;
      void main(){ vT = aT; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw, uOp; varying float vT;
      void main(){
        if (vT > uDraw) discard;
        // Funke an der Zeichenspitze, solange gezeichnet wird
        float head = exp(-(uDraw - vT)*9.0) * step(uDraw, ${(n - 1).toFixed(1)} - 0.001);
        gl_FragColor = vec4(vec3(0.55,0.65,0.95)*uOp + vec3(0.9,0.94,1.0)*head*1.4, 1.0);
      }`,
  });
  if (segs.length) {
    const lg = new THREE.BufferGeometry().setFromPoints(segs);
    lg.setAttribute("aT", new THREE.Float32BufferAttribute(segT, 1));
    group.add(new THREE.LineSegments(lg, lineMat));
  }

  const anchors = P.map((p) => {
    const a = new THREE.Object3D();
    a.position.copy(p);
    group.add(a);
    return a;
  });
  let seq = -1;
  let wasOn = false;
  const ext = Math.max(...P.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));

  return {
    root: group,
    hover,
    visR: ext + 2.5,
    labelR: ext * 0.6 + 2,
    hitR: ext + 1,
    anchors,
    update: ({ dt, focused, rs }) => {
      const on = focused === "werdegang";
      focus.value = lerp(focus.value, on ? 1 : 0, 1 - Math.exp(-dt * 3));
      lineOp.value = 0.26 + 0.3 * Math.max(hover.value, focus.value);
      // Neu zeichnen bei jedem Anflug (nicht bei reduzierter Bewegung)
      if (on && !wasOn && rs === 1 && n > 1) seq = 0;
      wasOn = on;
      if (seq >= 0) {
        seq += dt;
        draw.value = on ? Math.min((seq - DRAW_DELAY) / DRAW_SEG, REST) : REST;
        if (draw.value >= REST) seq = -1;
      }
      anchors.forEach((a, i) => (a.userData.lit = draw.value >= i - 0.05));
    },
  };
}
