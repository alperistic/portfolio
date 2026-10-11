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

/** Stern mit Granulation, Randverdunkelung und animierter Korona (aus Prototyp B). */
export function makeSun(ctx: SceneCtx, o: SunOptions) {
  const { radius, color, hot, corona, intensity = 2, coronaI = 0.7, ext = 4.2, streak = 1 } = o;
  const group = new THREE.Group();
  const hover = o.hover ?? { value: 0 };
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 48),
    new THREE.ShaderMaterial({
      defines: { OCT: 3 },
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
        /* glsl */ `
        uniform float uTime, uI, uHover; uniform vec3 uColor, uHot;
        varying vec3 vN; varying vec3 vP; varying vec3 vV;
        void main(){
          float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
          vec3 p = normalize(vP);
          float gran = snoise(p*14.0 + vec3(0.0, uTime*0.06, 0.0))*0.5 + snoise(p*32.0 - uTime*0.09)*0.3;
          float big = fbm(p*2.2 + vec3(uTime*0.012));
          float spots = smoothstep(0.42, 0.62, big);
          vec3 c = mix(uColor, uHot, pow(mu, 0.7));
          float limb = 0.28 + 0.72*pow(mu, 0.5);
          c *= limb * (1.0 + 0.22*gran) * (1.0 - 0.5*spots) * uI * (1.0 + 0.25*uHover);
          c += uColor * pow(1.0-mu, 3.0) * 0.25 * uI;
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
          float glow = exp(-rr*2.6)*0.45 + exp(-rr*9.0)*0.9;
          float s1 = clamp(snoise(vec3(dir*2.2, r*0.55 - uTime*0.10))*0.5 + 0.5, 0.0, 1.0);
          float s2 = clamp(snoise(vec3(dir*6.5, r*0.9 - uTime*0.17 + 4.0))*0.5 + 0.5, 0.0, 1.0);
          float streaks = pow(s1, 3.0)*0.9 + pow(s2, 4.0)*0.6;
          float c = glow + streaks*exp(-rr*1.8)*0.55*uStreak;
          c *= (1.0-smoothstep(uExt*0.55, uExt, r));
          c *= step(0.97, r);
          gl_FragColor = vec4(uColor * c * uCI * (1.0 + 0.35*uHover), 1.0);
        }`,
    }),
  );
  group.add(cor);
  return { group, hover, core };
}
