import * as THREE from "three";
import { NOISE } from "../glsl";
import type { Celestial, SceneCtx } from "../types";
import { UV_VERT } from "../util";
import { billboard } from "./billboard";

/**
 * „Goldene Platte“: eine ferne Galaxie, fast von der Kante gesehen — heller,
 * warmer Kern, flache goldene Scheibe, davor ein dunkles Staubband (Vorbild:
 * Sombrero-Galaxie). Die Scheibe trägt feine konzentrische Rillen: aus der Nähe
 * liest sie sich wie eine Schallplatte, aus der Ferne wie ein goldener Strich.
 *
 * Aufbau wie bei der Spiralgalaxie: Leuchten additiv, Staub als absorbierende
 * Fläche darüber (Ziel × (1 − Staub)). Der Staub wirkt nur auf der uns
 * zugewandten Hälfte des Rings voll — die abgewandte liegt hinter dem Kern und
 * darf ihn nicht verdunkeln.
 */
export function makeRecordGalaxy(ctx: SceneCtx, pos: THREE.Vector3, R: number): Celestial {
  const { rand, gauss } = ctx.rng;
  const holder = new THREE.Group();
  const tilt = new THREE.Group();
  const rot = new THREE.Group();
  tilt.add(rot);
  holder.add(tilt);
  const hover = { value: 0 };

  const S = R * 2.1;
  const geo = new THREE.PlaneGeometry(S, S, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const VERT = /* glsl */ `
    varying vec2 vP; varying vec3 vW;
    void main(){ vP = position.xz; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;

  const glow = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      defines: { OCT: 3 },
      uniforms: { uR: { value: R }, uHover: hover },
      vertexShader: VERT,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uR, uHover; varying vec2 vP; varying vec3 vW;
        void main(){
          float r = length(vP)/uR;
          float n = fbm(vec3(vP*(3.2/uR), 2.0));
          // Rillen: breite Bänder und sehr feine Linien, vom Rauschen leicht verzogen
          float bands = 0.5 + 0.5*sin(r*30.0 + n*3.0);
          float groove = 0.5 + 0.5*sin(r*170.0 + n*6.0);
          float disk = exp(-r*2.7)*smoothstep(0.03, 0.16, r);
          float a = disk*(0.55 + 0.30*bands + 0.15*groove);
          // heller Saum knapp innerhalb des Staubrings
          float k = (r - 0.60)/0.06; a += exp(-k*k)*0.11*(0.55 + 0.45*bands);
          a *= 1.0 - smoothstep(0.84, 1.0, r);
          vec3 col = mix(vec3(1.0, 0.86, 0.62), vec3(0.96, 0.66, 0.34), smoothstep(0.08, 0.8, r));
          gl_FragColor = vec4(col*a*1.25*(1.0 + 0.3*uHover), 1.0);
        }`,
    }),
  );

  const dust = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcColorFactor,
      defines: { OCT: 4 },
      uniforms: { uR: { value: R }, uC: { value: pos } },
      vertexShader: VERT,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uR; uniform vec3 uC; varying vec2 vP; varying vec3 vW;
        void main(){
          float r = length(vP)/uR;
          float ring = smoothstep(0.60, 0.70, r)*(1.0 - smoothstep(0.84, 0.96, r));
          float torn = clamp(0.62 + 0.55*fbm(vec3(vP*(7.0/uR), 5.0)), 0.0, 1.0);
          float near = smoothstep(-0.12, 0.22, dot(normalize(vW - uC), normalize(cameraPosition - uC)));
          float d = ring*torn*0.92*mix(0.10, 1.0, near);
          gl_FragColor = vec4(d*0.84, d*0.92, d, 1.0);   // Staub rötet
        }`,
    }),
  );

  // Kern: großer, weicher Bulge, der über die Scheibe hinausragt
  const bulge = billboard(
    ctx,
    R * 1.7,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uHover: hover },
      vertexShader: UV_VERT,
      fragmentShader: /* glsl */ `
        uniform float uHover; varying vec2 vUv;
        void main(){
          float r = length(vUv - 0.5)*2.0;
          float g = exp(-r*r*70.0)*1.25 + exp(-r*8.0)*0.55 + exp(-r*3.0)*0.10;
          g *= 1.0 - smoothstep(0.7, 1.0, r);
          gl_FragColor = vec4(vec3(1.0, 0.84, 0.60)*g*(1.0 + 0.3*uHover), 1.0);
        }`,
    }),
  );

  // Halo: schwache alte Sterne und ein paar Kugelsternhaufen rund um den Kern
  const N = ctx.q.small ? 500 : 1100;
  const p = new Float32Array(N * 3);
  const c = new Float32Array(N * 3);
  const s = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const glob = i < 46;
    const rr = (glob ? 0.25 + rand() * 0.75 : Math.abs(gauss()) * 0.42) * R;
    const u = rand() * 2 - 1;
    const t = rand() * Math.PI * 2;
    const q = Math.sqrt(1 - u * u);
    p.set([q * Math.cos(t) * rr, u * rr * 0.62, q * Math.sin(t) * rr], i * 3);
    const b = glob ? 0.16 + rand() * 0.22 : 0.02 + Math.pow(rand(), 5) * 0.14;
    c.set([1.0 * b, 0.86 * b, 0.66 * b], i * 3);
    s[i] = glob ? 0.16 + rand() * 0.1 : 0.06 + rand() * 0.08;
  }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute("position", new THREE.BufferAttribute(p, 3));
  hg.setAttribute("aColor", new THREE.BufferAttribute(c, 3));
  hg.setAttribute("aSize", new THREE.BufferAttribute(s, 1));
  const halo = new THREE.Points(
    hg,
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
          float k = 1.0; if (s < 1.2) { k = (s*s)/(1.2*1.2); s = 1.2; }
          gl_PointSize = min(s, 20.0);
          vColor = aColor*k*(1.0 + 0.3*uHover);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main(){ vec2 c = gl_PointCoord-0.5; float a = exp(-dot(c,c)*14.0)*(1.0 - smoothstep(0.35, 0.5, length(c))); gl_FragColor = vec4(vColor*a, 1.0); }`,
    }),
  );

  glow.renderOrder = 1;
  halo.renderOrder = 1;
  bulge.renderOrder = 2;
  dust.renderOrder = 3;
  rot.add(glow, dust);
  holder.add(halo, bulge);

  // Fast von der Kante, leicht gerollt: als schräger goldener Strich am Himmel
  tilt.lookAt(pos.clone().negate());
  tilt.rotateZ(0.42);
  tilt.rotateX(-0.24);

  return {
    root: holder,
    hover,
    visR: R * 0.8,
    labelR: R * 0.5,
    hitR: R * 0.6,
    update: ({ dt, rs }) => {
      rot.rotation.y += dt * 0.008 * rs;
    },
  };
}
