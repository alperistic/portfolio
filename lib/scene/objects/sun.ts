import * as THREE from "three";
import { NOISE } from "../glsl";
import type { SceneCtx, Uniform } from "../types";
import { UV_VERT } from "../util";
import { billboard } from "./billboard";

type RGB = [number, number, number];

export type SunOptions = {
  radius: number;
  color: RGB;
  hot: RGB;
  corona: RGB;
  intensity?: number;
  coronaI?: number;
  ext?: number;
  streak?: number;
  /** Gemeinsamer Hover-Wert, z. B. für beide Sterne eines Doppelsterns. */
  hover?: Uniform<number>;
};

/**
 * Zellrauschen (Worley) in 3D: Abstand zum nächsten und zweitnächsten Zellkern.
 * `F2 − F1` ist an den Zellgrenzen 0 und in der Zellmitte groß — genau das Muster
 * der Granulation: helle, aufsteigende Zellen, dunkle Fugen dazwischen. Die Kerne
 * wandern langsam (uTime), dadurch „kocht“ die Oberfläche, ohne zu fließen.
 */
const CELL = /* glsl */ `
  vec3 hash3(vec3 p){
    p = vec3(dot(p, vec3(127.1,311.7,74.7)), dot(p, vec3(269.5,183.3,246.1)), dot(p, vec3(113.5,271.9,124.6)));
    return fract(sin(p)*43758.5453);
  }
  vec2 cell(vec3 p, float t){
    vec3 i = floor(p), f = fract(p);
    float d1 = 8.0, d2 = 8.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
      vec3 g = vec3(float(x), float(y), float(z));
      vec3 o = 0.5 + 0.42*sin(t + 6.2831*hash3(i + g));
      vec3 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
    return sqrt(vec2(d1, d2));
  }
`;

/**
 * Stern mit kochender Oberfläche: Granulation aus Zellrauschen in zwei Größen,
 * aktive Regionen (heller) und wenige Flecken (dunkel), Randverdunkelung mit
 * Rötung zum Rand. Die Helligkeit bleibt so niedrig, dass das Tone-Mapping die
 * Struktur nicht zu einer weißen Scheibe ausbrennt — das Glühen kommt aus Bloom
 * und Korona, nicht aus einem überstrahlten Kern.
 *
 * Korona wie auf Finsternis-Fotos: steiler innerer Schein, wenige breite
 * Strahlenbüschel, darin feine Strahlen; am Rand unregelmäßige Protuberanzen.
 */
export function makeSun(ctx: SceneCtx, o: SunOptions) {
  const { radius, color, hot, corona, intensity = 2, coronaI = 0.7, ext = 4.2, streak = 1 } = o;
  const group = new THREE.Group();
  const hover = o.hover ?? { value: 0 };
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 48),
    new THREE.ShaderMaterial({
      defines: { OCT: 3, FINE: ctx.q.small ? 0 : 1 },
      uniforms: {
        uTime: ctx.uTime,
        uColor: { value: new THREE.Color(...color) },
        uHot: { value: new THREE.Color(...hot) },
        uI: { value: intensity },
        uHover: hover,
      },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vP; varying vec3 vV;
        void main(){ vN = normalize(normalMatrix*normal); vP = position; vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader:
        NOISE +
        CELL +
        /* glsl */ `
        uniform float uTime, uI, uHover; uniform vec3 uColor, uHot;
        varying vec3 vN; varying vec3 vP; varying vec3 vV;
        void main(){
          float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
          vec3 p = normalize(vP);
          // großräumige Strömung verzieht das Zellmuster leicht
          vec3 flow = vec3(snoise(p*1.7 + uTime*0.010), snoise(p*1.7 + 7.0 - uTime*0.012), snoise(p*1.7 + 13.0));
          vec3 q = p + flow*0.05;
          vec2 c1 = cell(q*11.0, uTime*0.22);
          float g = smoothstep(0.0, 0.34, c1.y - c1.x)*(0.70 + 0.30*(1.0 - smoothstep(0.0, 0.8, c1.x)));
          #if FINE
          vec2 c2 = cell(q*27.0 + 3.0, uTime*0.4 + 2.0);
          g = g*0.55 + smoothstep(0.0, 0.36, c2.y - c2.x)*0.45;
          #endif
          float big = fbm(p*2.1 + vec3(uTime*0.010));
          float act = smoothstep(0.05, 0.55, big);
          float spot = smoothstep(0.46, 0.60, fbm(p*2.9 + 20.0 + vec3(0.0, uTime*0.004, 0.0)));
          float pen = smoothstep(0.36, 0.50, fbm(p*2.9 + 20.0 + vec3(0.0, uTime*0.004, 0.0)));
          // „Temperatur“ 0…~1.25
          float T = 0.30 + 0.42*g + 0.34*act*(0.55 + 0.45*g);
          T *= (1.0 - 0.30*pen) * (1.0 - 0.72*spot);
          float limb = 1.0 - 0.72*(1.0 - pow(mu, 0.55));
          T *= limb;
          vec3 deep = uColor*vec3(0.50, 0.24, 0.16);
          vec3 white = mix(uHot, vec3(1.0), 0.35);
          vec3 c = mix(deep, uColor, smoothstep(0.05, 0.5, T));
          c = mix(c, uHot, smoothstep(0.55, 1.02, T));
          c = mix(c, white, smoothstep(1.02, 1.3, T));
          c *= (0.10 + 1.25*T) * uI * (1.0 + 0.22*uHover);
          // Chromosphäre: dünner, satter Saum am Rand
          c += uColor * pow(1.0 - mu, 4.0) * 0.9 * uI;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  group.add(core);
  const cor = billboard(
    ctx,
    radius * 2 * ext,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: ctx.uTime,
        uColor: { value: new THREE.Color(...corona) },
        uExt: { value: ext },
        uCI: { value: coronaI },
        uHover: hover,
        uStreak: { value: streak },
      },
      vertexShader: UV_VERT,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uTime, uExt, uCI, uHover, uStreak; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          vec2 p = (vUv - 0.5)*2.0*uExt;
          float r = length(p);
          vec2 dir = p / max(r, 1e-4);
          float rr = max(r - 0.985, 0.0);
          // innerer Schein fällt steil ab, darunter ein sehr weiter, schwacher Hof
          float glow = exp(-rr*8.0)*0.95 + exp(-rr*2.4)*0.30 + 0.05/(1.0 + rr*rr*3.0);
          // breite Büschel (wenige), darin mittlere und feine Strahlen; außen ziehen sie nach
          float n1 = snoise(vec3(dir*1.5, uTime*0.02 + r*0.10));
          float n2 = snoise(vec3(dir*4.6, r*0.30 - uTime*0.05 + 4.0));
          float n3 = snoise(vec3(dir*15.0, r*0.50 - uTime*0.08 + 9.0));
          float broad = smoothstep(-0.25, 0.75, n1);
          float rays = (0.55 + 0.45*n2)*(0.72 + 0.28*n3);
          float stream = broad*rays*exp(-rr*(1.25 - 0.55*broad));
          float c = glow + stream*0.62*uStreak;
          c *= (1.0 - smoothstep(uExt*0.5, uExt, r));
          // Protuberanzen: unregelmäßige Zungen direkt am Rand, rötlicher als die Korona
          float pm = smoothstep(0.30, 0.78, snoise(vec3(dir*2.6, uTime*0.03 + 2.0)));
          float pf = 0.55 + 0.45*snoise(vec3(dir*9.0, rr*14.0 - uTime*0.10));
          float prom = pm*pf*exp(-rr*(11.0 + 9.0*(1.0 - pm)));
          vec3 col = uColor*c*uCI*(1.0 + 0.35*uHover);
          col += mix(uColor, vec3(1.0, 0.30, 0.22), 0.55)*prom*1.5*uCI*uStreak;
          col *= smoothstep(0.962, 0.992, r);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  group.add(cor);
  return { group, hover, core };
}
