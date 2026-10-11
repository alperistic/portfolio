import * as THREE from "three";
import { NOISE } from "../glsl";
import type { Celestial, SceneCtx } from "../types";
import { lerp, UV_VERT } from "../util";
import { billboard } from "./billboard";

/** Spiral-Geometrie (Arme bei Phase 0 / π), identisch in JS und GLSL. */
const WIND = 2.25;
const armPhase = (r: number) => Math.log(1 + r * 0.35) * WIND;

/**
 * GLSL: Felder der Scheibe in Welt-Einheiten (p = Scheibenebene, R = Radius).
 * Liefert Arm-Dichte, Staubbahnen und radiale Koordinate — dieselben Formeln für
 * Leuchten und Absorption, damit die Bahnen genau an den Armen sitzen.
 */
const FIELDS = /* glsl */ `
  uniform float uR;
  struct Gal { float arm; float lane; float t; float clump; };
  Gal galaxy(vec2 p){
    Gal g;
    float r = length(p); g.t = r/uR;
    float th = atan(p.y, p.x);
    float warp = fbm(vec3(p*0.09, 3.0));                          // bricht die perfekte Symmetrie
    float ph = th - log(1.0 + r*0.35)*${WIND.toFixed(2)} + warp*0.55;
    g.arm = pow(max(0.5 + 0.5*cos(2.0*ph), 0.0), 1.7);
    g.clump = fbm(vec3(p*0.42, 7.0))*0.5 + 0.5;                  // Sternwolken entlang der Arme
    // Staubbahnen auf der Innenseite der Arme, von Rauschen zerrissen, plus feine Staubsporne
    float laneCore = pow(max(0.5 + 0.5*cos(2.0*ph - 0.8), 0.0), 16.0);
    float torn = smoothstep(-0.25, 0.35, fbm(vec3(p*0.28, 11.0)));
    float spurs = pow(max(fbm(vec3(p*0.55 + warp, 17.0)), 0.0), 1.4) * 1.6;
    g.lane = (laneCore*torn + spurs*g.arm*0.35) * smoothstep(0.07, 0.25, g.t) * (1.0 - smoothstep(0.7, 1.0, g.t));
    return g;
  }`;

/**
 * offerre: Spiralgalaxie — das größte, ausgereifteste Werk.
 *
 * Das Licht kommt vor allem aus einer glatten Shader-Scheibe (Arme, Sternwolken,
 * Bulge); die Partikel sind nur noch feine Einzelsterne darüber. So wirkt die
 * Galaxie aus der Nähe weich statt körnig. Eine zweite, absorbierende Scheibe
 * legt Staubbahnen auf die Innenseite der Arme — die schlucken Licht der Galaxie
 * und der Sterne dahinter, statt nur „weniger Leuchten“ zu sein.
 */
export function makeGalaxy(ctx: SceneCtx, pos: THREE.Vector3, R: number): Celestial {
  const { rand, gauss } = ctx.rng;
  const holder = new THREE.Group();
  const tilt = new THREE.Group();
  const rot = new THREE.Group();
  tilt.add(rot);
  holder.add(tilt);

  /* ---------- Einzelsterne ---------- */
  const N = ctx.q.galaxy;
  const posA = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  let i = 0;
  const put = (x: number, y: number, z: number, c: number[], b: number, s: number) => {
    if (i >= N) return;
    posA.set([x, y, z], i * 3);
    col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    size[i++] = s;
  };
  while (i < N) {
    const kind = rand();
    if (kind < 0.14) {
      // Bulge: dicht, warm, klein
      const r = Math.abs(gauss()) * R * 0.1;
      const a = rand() * Math.PI * 2;
      put(Math.cos(a) * r, gauss() * R * 0.045 * (1 - r / (R * 0.4)), Math.sin(a) * r, [1.0, 0.8, 0.56], 0.05 + rand() * 0.07, 0.06 + rand() * 0.1);
    } else if (kind < 0.3) {
      // Scheibe zwischen den Armen: schwach, gleichmäßig
      const r = Math.pow(rand(), 0.85) * R;
      const a = rand() * Math.PI * 2;
      const t = r / R;
      put(Math.cos(a) * r, gauss() * 0.2, Math.sin(a) * r, [lerp(1.0, 0.7, t), lerp(0.88, 0.78, t), lerp(0.74, 0.96, t)], 0.02 + rand() * 0.04, 0.05 + rand() * 0.08);
    } else if (kind < 0.996) {
      // Armsterne: meist schwach, wenige hell; junge blaue Sterne sitzen auf den Armkämmen
      const r = Math.pow(rand(), 1.1) * R;
      const t = r / R;
      const spread = gauss() * (0.2 + 0.18 * (1 - t));
      const a = (i % 2) * Math.PI + armPhase(r) + spread;
      const off = gauss() * (0.25 + 0.6 * t);
      const young = Math.abs(spread) < 0.1 && rand() < 0.2;
      const c = young ? [0.62, 0.74, 1.0] : [lerp(1.0, 0.72, t), lerp(0.9, 0.78, t), lerp(0.78, 0.98, t)];
      const b = young ? 0.08 + Math.pow(rand(), 3) * 0.35 : 0.025 + Math.pow(rand(), 6) * 0.22;
      put(Math.cos(a) * r + off * 0.35, gauss() * (0.12 + 0.18 * (1 - t)), Math.sin(a) * r + off * 0.35, c, b, 0.05 + rand() * 0.09);
    } else {
      // H-II-Gebiete: kleine rosa Knoten aus ein paar Sternen, nur auf den Armen
      const r = (0.3 + rand() * 0.6) * R;
      const a = (rand() < 0.5 ? 0 : Math.PI) + armPhase(r) + gauss() * 0.05;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      for (let k = 0; k < 6; k++) put(cx + gauss() * 0.22, gauss() * 0.08, cz + gauss() * 0.22, [1.0, 0.56, 0.66], 0.1 + rand() * 0.16, 0.07 + rand() * 0.08);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(posA, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const hover = { value: 0 };
  const pts = new THREE.Points(
    g,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uProj: ctx.uProj, uHover: hover },
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute float aSize; uniform float uProj, uHover; varying vec3 vColor;
        void main(){
          vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
          float s = aSize*uProj/max(-mv.z, 0.1);
          float k = 1.0; if (s < 1.2) { k = (s*s)/(1.2*1.2); s = 1.2; }   // Lichtmenge bleibt gleich
          gl_PointSize = min(s, 24.0);
          vColor = aColor*k*(1.0 + 0.3*uHover);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main(){ vec2 c = gl_PointCoord-0.5; float a = exp(-dot(c,c)*14.0)*(1.0 - smoothstep(0.35, 0.5, length(c))); gl_FragColor = vec4(vColor*a, 1.0); }`,
    }),
  );

  /* ---------- Scheibe: Leuchten (rgb) + Staub (a), einmal vorberechnet ----------
     Die Felder hängen nur von der Lage in der Scheibe ab (die Scheibe dreht sich
     als Ganzes) — also einmal in eine Textur rechnen statt jedes Frame ~40×
     Rauschen pro Pixel. */
  const S = R * 2.3;
  const res = ctx.q.small ? 768 : 1024;
  const tex = ctx.bake({
    width: res,
    height: res,
    defines: { OCT: 5 },
    uniforms: { uR: { value: R }, uS: { value: S } },
    fragmentShader:
      NOISE +
      FIELDS +
      /* glsl */ `
      uniform float uS; varying vec2 vUv;
      void main(){
        // Plane liegt nach rotateX(−π/2) in xz: x = (u−½)·S, z = (½−v)·S
        vec2 p = vec2(vUv.x - 0.5, 0.5 - vUv.y) * uS;
        Gal g = galaxy(p);
        float t = g.t;
        float edge = 1.0 - smoothstep(0.72, 1.08, t);
        float arms = g.arm * (0.35 + 0.9*g.clump*g.clump) * exp(-t*2.1);
        float bulge = exp(-t*t*55.0)*1.1 + exp(-t*9.0)*0.25;
        float disk = exp(-t*3.4)*0.1;
        float lane = clamp(g.lane, 0.0, 1.0);
        float a = (arms*0.8 + disk + bulge) * edge * (1.0 - 0.6*lane);
        vec3 armCol = mix(vec3(0.95,0.86,0.78), vec3(0.58,0.7,1.0), smoothstep(0.1, 0.65, t));
        vec3 col = mix(armCol, vec3(1.0,0.8,0.56), clamp(bulge, 0.0, 1.0));
        gl_FragColor = vec4(col * a * 0.5, lane * 0.72);
      }`,
  });
  const diskGeo = new THREE.PlaneGeometry(S, S, 1, 1);
  diskGeo.rotateX(-Math.PI / 2);
  const glow = new THREE.Mesh(
    diskGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uTex: { value: tex }, uHover: hover },
      vertexShader: UV_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex; uniform float uHover; varying vec2 vUv;
        void main(){ gl_FragColor = vec4(texture2D(uTex, vUv).rgb * (1.0 + 0.3*uHover), 1.0); }`,
    }),
  );

  /* ---------- Staubbahnen (absorbierend: Ziel × (1 − Staub)) ---------- */
  const dust = new THREE.Mesh(
    diskGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcColorFactor,
      uniforms: { uTex: { value: tex } },
      vertexShader: UV_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex; varying vec2 vUv;
        void main(){
          float d = texture2D(uTex, vUv).a;
          gl_FragColor = vec4(d*0.86, d*0.93, d, 1.0);   // Staub rötet: schluckt Blau etwas stärker
        }`,
    }),
  );
  // Erst Sterne + Leuchten, dann der Staub darüber, dann der Kern.
  pts.renderOrder = 1;
  glow.renderOrder = 1;
  dust.renderOrder = 2;
  rot.add(glow, pts, dust);

  // Kernleuchten
  const core = billboard(
    ctx,
    R * 1.1,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uHover: hover },
      vertexShader: UV_VERT,
      fragmentShader: `uniform float uHover; varying vec2 vUv; void main(){ float r = length(vUv-0.5)*2.0; float g = exp(-r*r*120.0)*1.1 + exp(-r*9.0)*0.35 + exp(-r*3.2)*0.06; gl_FragColor = vec4(vec3(1.0,0.8,0.56)*g*(1.0+0.3*uHover)*(1.0-smoothstep(0.7,1.0,r)), 1.0); }`,
    }),
  );
  core.renderOrder = 3;
  holder.add(core);

  // Schräg zum Betrachter im Zentrum geneigt (wie im Prototyp)
  tilt.lookAt(pos.clone().negate());
  tilt.rotateX(-1.08);
  tilt.rotateY(0.5);

  return {
    root: holder,
    hover,
    visR: R * 0.85,
    labelR: R * 0.72,
    hitR: R * 0.75,
    commitHost: { obj: rot, shape: "disk", r: R * 0.95, armPhase },
    update: ({ dt, rs }) => {
      rot.rotation.y += dt * 0.012 * rs;
    },
  };
}
