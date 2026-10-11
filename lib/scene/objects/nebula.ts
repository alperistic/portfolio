import * as THREE from "three";
import { NOISE } from "../glsl";
import type { Celestial, SceneCtx } from "../types";
import { UV_VERT } from "../util";
import { billboard } from "./billboard";

/**
 * GLSL: gemeinsame Felder des Nebels in Ebenen-Koordinaten p ∈ [−1, 1].
 * uStar = Lage des Protosterns. Die Staubsäulen stehen nur auf einer Seite und
 * zeigen zum Stern (wie die „Säulen der Schöpfung“) — das bricht die Rundung.
 */
const FIELDS = /* glsl */ `
  uniform vec2 uStar; uniform float uSeed;
  float envelope(vec2 p, vec3 w){
    // gestreckte, gedrehte, verbeulte Hülle — bewusst nicht um den Stern zentriert
    vec2 e = mat2(0.8, -0.6, 0.6, 0.8) * (p - vec2(0.1, -0.06));
    e.x *= 0.64;
    float edge = 1.0 - smoothstep(0.6, 0.98, length(p));                   // nie an die Quadkante
    return (1.0 - smoothstep(0.2, 0.95, length(e) + 0.42*w.x + 0.2*w.z)) * edge;
  }
  float pillars(vec2 p, out float tip){
    vec2 d = p - uStar; float r = length(d); vec2 n = d/max(r, 1e-4);
    float ang = atan(d.y, d.x);
    float side = smoothstep(0.0, 0.7, dot(n, vec2(-0.55, -0.83)));          // nur unten links
    float cols = smoothstep(0.1, 0.42, fbm(vec3(ang*3.1, r*0.7, uSeed + 5.0)));
    float rs = 0.3 + 0.2*(fbm(vec3(ang*5.0, 2.0, uSeed))*0.5 + 0.5);        // wo die Säule beginnt
    float body = cols * side * smoothstep(rs, rs + 0.05, r) * (1.0 - smoothstep(0.75, 1.0, r));
    body *= 0.6 + 0.4*smoothstep(-0.3, 0.3, fbm(vec3(p*7.0, uSeed + 9.0)));   // ausgefranst
    float k = (r - rs)/0.03;
    tip = cols * side * exp(-k*k);
    return body;
  }`;

/**
 * insertcoin.lol: Sternentstehungs-Nebel mit Protostern — entsteht gerade.
 * Farbwelt leicht „arcade“ (Magenta außen, Cyan im heißen Inneren).
 * Asymmetrisch aufgebaut: gestreckte Hülle, vom Protostern ausgeblasene Blase mit
 * leuchtender Ionisationsfront, einseitige Staubsäulen mit hellen Spitzen, dazu
 * eine absorbierende Staubschicht. Zurückhaltend dosiert — Akzent, nicht Tapete.
 */
export function makeNebula(ctx: SceneCtx): Celestial {
  const { rand, gauss } = ctx.rng;
  const root = new THREE.Group();
  const hover = { value: 0 };
  const star = new THREE.Vector2(-0.14, 0.08);
  const S = 30;

  /* Alle Nebel-Felder sind statisch → einmal beim Start in Texturen rechnen
     (Hauptschicht: rgb = Leuchten, a = Staub). Pro Frame bleibt ein Lookup. */
  const bakeLayer = (seed: number, intensity: number, features: boolean, res: number) =>
    ctx.bake({
      width: res,
      height: res,
      defines: { OCT: 4, FEATURES: features ? 1 : 0 },
      uniforms: { uSeed: { value: seed }, uI: { value: intensity }, uStar: { value: star } },
      fragmentShader:
        NOISE +
        FIELDS +
        /* glsl */ `
        uniform float uI; varying vec2 vUv;
        void main(){
          vec2 p = (vUv - 0.5)*2.0;
          vec3 q = vec3(p*1.4, uSeed);
          vec3 w = vec3(fbm(q), fbm(q + vec3(5.2,1.3,2.8)), fbm(q + vec3(1.7,9.2,4.4)));
          float n = fbm(q*1.6 + w*0.8);
          float env = envelope(p, w);
          float dens = smoothstep(-0.2, 0.55, n) * env;
          float ridge = pow(max(1.0 - abs(snoise(q*2.6 + w*1.2)), 0.0), 7.0) * env;
          vec3 magenta = vec3(0.78,0.16,0.52), cyan = vec3(0.12,0.66,0.9), pale = vec3(1.0,0.8,0.92);
        #if FEATURES
          float rs = length(p - uStar);
          float bub = 0.3 + 0.08*w.y;
          float cavity = smoothstep(0.05, bub, rs);                              // ausgeblasene Blase
          float fk = (rs - bub)/0.07;
          float front = exp(-fk*fk) * smoothstep(-0.1, 0.4, n); // Ionisationsfront
          float tip; float pil = pillars(p, tip);
          float emit = dens*(0.25 + 0.75*cavity) + front*env*0.9 + ridge*0.25;
          emit *= 1.0 - 0.85*pil;
          vec3 col = mix(cyan, magenta, smoothstep(0.18, 0.6, rs + 0.25*w.x));
          col = mix(col, pale, front*0.35);
          vec3 c = col*emit + pale*tip*1.3*env;
          // Staub: Säulen + Schlieren + kleine Globulen (außerhalb der Blase)
          float lanes = smoothstep(0.12, 0.5, fbm(vec3(p*2.3, uSeed + 20.0) + w)) * env;
          float globs = smoothstep(0.35, 0.6, fbm(vec3(p*6.0, uSeed + 31.0))) * env * smoothstep(0.25, 0.5, rs);
          float d = clamp(pil*0.8 + lanes*0.45 + globs*0.4, 0.0, 0.9);
        #else
          float emit = (dens*0.8 + ridge*0.2) * (1.0 - smoothstep(0.55, 0.98, length(p)));
          vec3 c = mix(magenta, cyan, smoothstep(-0.3, 0.5, w.y - 0.3*p.x)) * emit;
          float d = 0.0;
        #endif
          gl_FragColor = vec4(c * uI, d);
        }`,
    });

  const layerMat = (tex: THREE.Texture) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTex: { value: tex }, uHover: hover },
      vertexShader: UV_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex; uniform float uHover; varying vec2 vUv;
        void main(){ gl_FragColor = vec4(texture2D(uTex, vUv).rgb * (1.0 + 0.4*uHover), 1.0); }`,
    });

  // Hauptschicht (mit Stern, Blase, Säulen) + zwei schwache, versetzte Schleier für Tiefe
  const mainTex = bakeLayer(3.1, 0.24, true, ctx.q.small ? 768 : 1024);
  const main = billboard(ctx, S, layerMat(mainTex));
  root.add(main);
  const veils: [number, number, number, [number, number, number]][] = [
    [34, 11.7, 0.09, [5.5, -2.5, -5]],
    [20, 27.3, 0.08, [-7, 4.5, 3]],
  ];
  for (const [size, seed, intensity, off] of veils) {
    const m = billboard(ctx, size, layerMat(bakeLayer(seed, intensity, false, 512)));
    m.position.set(...off);
    root.add(m);
  }

  // Staub: aus dem Alpha-Kanal der Hauptschicht, absorbierend (Ziel × (1 − Staub))
  const dust = new THREE.Mesh(
    new THREE.PlaneGeometry(S, S),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcColorFactor,
      uniforms: { uTex: { value: mainTex } },
      vertexShader: UV_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex; varying vec2 vUv;
        void main(){ float d = texture2D(uTex, vUv).a; gl_FragColor = vec4(d*0.85, d*0.92, d, 1.0); }`,
    }),
  );
  dust.renderOrder = 2;
  ctx.billboards.push(dust);
  root.add(dust);

  // Protostern: sitzt in der Blase der Hauptschicht (Kind der Schicht → dreht mit)
  const proto = new THREE.Group();
  proto.position.set((star.x * S) / 2, (star.y * S) / 2, 0.2);
  main.add(proto);
  proto.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.86, 0.95).multiplyScalar(4) }),
    ),
  );
  const glow = billboard(
    ctx,
    16,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      defines: { OCT: 3 },
      uniforms: { uHover: hover, uTime: ctx.uTime },
      vertexShader: UV_VERT,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uHover, uTime; varying vec2 vUv;
        void main(){
          vec2 c = (vUv-0.5)*2.0; float r = length(c);
          float g = exp(-r*r*140.0)*1.2 + exp(-r*9.0)*0.22;
          // gebündelte Jets entlang einer schrägen Achse, mit Herbig-Haro-Knoten
          vec2 j = mat2(0.94, 0.34, -0.34, 0.94) * c;
          float along = abs(j.y);
          float jet = exp(-abs(j.x)*(90.0 - 50.0*along)) * exp(-along*3.0) * smoothstep(0.02, 0.1, along);
          float knots = 0.55 + 0.45*smoothstep(0.1, 0.6, snoise(vec3(along*9.0 - uTime*0.15, 0.0, 2.0)));
          float k = (g + jet*knots*0.6) * (0.94 + 0.06*sin(uTime*1.7)) * (1.0 + 0.3*uHover);
          gl_FragColor = vec4(mix(vec3(1.0,0.72,0.92), vec3(0.7,0.9,1.0), smoothstep(0.1,0.6,along))*k*(1.0 - smoothstep(0.8,1.0,r)), 1.0);
        }`,
    }),
  );
  glow.renderOrder = 3; // nach dem Staub: der Stern leuchtet durch
  proto.add(glow);

  // junge Sterne: gehäuft in und an der Blase, nicht als gleichmäßige Kugel
  const N = ctx.q.small ? 22 : 40;
  const p = new Float32Array(N * 3);
  const s = new Float32Array(N);
  const cx = (star.x * S) / 2;
  const cy = (star.y * S) / 2;
  for (let i = 0; i < N; i++) {
    const near = rand() < 0.7;
    const rr = near ? Math.abs(gauss()) * 3.2 : 4 + rand() * 7;
    const a = rand() * Math.PI * 2;
    p.set([cx + Math.cos(a) * rr * 1.2, cy + Math.sin(a) * rr * 0.85, gauss() * 2], i * 3);
    s[i] = 0.14 + Math.pow(rand(), 3) * (near ? 0.4 : 0.25);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(s, 1));
  const young = new THREE.Points(
    g,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uProj: ctx.uProj },
      vertexShader: /* glsl */ `
        attribute float aSize; uniform float uProj; varying float vK;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
          float s = aSize*uProj/max(-mv.z,0.1); vK = 1.0; if (s < 2.0) { vK = s*s/4.0; s = 2.0; }
          gl_PointSize = min(s, 48.0); }`,
      fragmentShader: /* glsl */ `
        varying float vK;
        void main(){ vec2 c = gl_PointCoord-0.5; float a = exp(-dot(c,c)*22.0); gl_FragColor = vec4(vec3(0.8,0.9,1.0)*a*vK*1.4, 1.0); }`,
    }),
  );
  young.renderOrder = 3;
  root.add(young);

  return { root, hover, visR: 11, labelR: 9, hitR: 10 };
}
