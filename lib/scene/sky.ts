import * as THREE from "three";
import { NOISE } from "./glsl";
import type { SceneCtx } from "./types";
import { dirFrom } from "./util";

/* Milchstraßen-Ebene: Normale und Richtung des hellen Kerns. */
const GAL_N = new THREE.Vector3().crossVectors(dirFrom(28, -16), dirFrom(118, 34)).normalize();
const GAL_C = dirFrom(150, 8);

/** Nebel + Milchstraße, einmalig in eine Cubemap gebacken (teurer Shader, läuft nur beim Start). */
export function bakeSky(renderer: THREE.WebGLRenderer, size: number) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    defines: { OCT: 7 },
    uniforms: {
      uGalN: { value: GAL_N },
      uGalC: { value: GAL_C },
      uZ1: { value: dirFrom(-26, 17) },
      uZ2: { value: dirFrom(-100, -8) },
      uZ3: { value: dirFrom(112, -2) },
      uZ4: { value: dirFrom(178, 38) },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:
      NOISE +
      /* glsl */ `
      varying vec3 vDir;
      uniform vec3 uGalN, uGalC, uZ1, uZ2, uZ3, uZ4;
      float ridged(vec3 p){float a=0.5,s=0.0;for(int i=0;i<5;i++){float n=1.0-abs(snoise(p));s+=a*n*n;p=p*2.07+vec3(3.1,1.7,5.3);a*=0.5;}return s;}
      void main(){
        vec3 d = normalize(vDir);
        vec3 w = vec3(fbm(d*1.6), fbm(d*1.6+vec3(5.2,1.3,2.8)), fbm(d*1.6+vec3(1.7,9.2,4.4)));
        vec3 pw = d*2.4 + w*1.45;
        float n = fbm(pw);
        float r = ridged(pw*1.7 + 7.0);
        float dens = pow(smoothstep(-0.05, 0.7, n), 2.2);
        float fil = pow(r, 5.0);
        float m1 = smoothstep(0.52, 0.98, dot(d,uZ1) + 0.30*w.x);
        float m2 = smoothstep(0.45, 0.97, dot(d,uZ2) + 0.30*w.y);
        float m3 = smoothstep(0.50, 0.98, dot(d,uZ3) + 0.30*w.z);
        float m4 = smoothstep(0.55, 0.98, dot(d,uZ4) + 0.30*w.x);
        vec3 violet = vec3(0.26,0.09,0.48), magenta = vec3(0.52,0.10,0.30);
        vec3 teal = vec3(0.03,0.30,0.34), cyan = vec3(0.10,0.42,0.52);
        vec3 rust = vec3(0.50,0.17,0.05), amber = vec3(0.85,0.46,0.16);
        vec3 neb = vec3(0.0);
        vec3 deep = vec3(0.05,0.05,0.20);
        float hi = smoothstep(0.35, 0.9, dens);
        neb += m1 * mix(mix(deep, violet, smoothstep(0.0,0.4,dens)), magenta, hi*smoothstep(-0.2,0.5,w.y)) * (dens*0.95 + fil*0.35);
        neb += m2 * mix(mix(deep*0.8, teal, smoothstep(0.0,0.4,dens)), cyan, hi) * (dens*0.9 + fil*0.35);
        neb += m3 * mix(mix(vec3(0.16,0.05,0.04), rust, smoothstep(0.0,0.4,dens)), amber, hi*0.8) * (dens*0.95 + fil*0.4);
        neb += m4 * vec3(0.12,0.16,0.42) * (dens*0.6 + fil*0.2);
        float haze = smoothstep(-0.35, 0.6, n);
        neb += (m1*violet*0.9 + m2*teal*0.7 + m3*rust*0.8) * haze * 0.16;
        float dust = smoothstep(-0.1, 0.4, fbm(d*3.3 + w*2.2 + 11.0));
        float globs = smoothstep(0.2, 0.55, fbm(d*9.0 + w*1.5 + 17.0));
        neb *= (1.0 - 0.85*dust) * (1.0 - 0.6*globs);
        vec3 col = vec3(0.0014,0.0018,0.0042) + neb*0.17;

        // Milchstraße
        float sb = dot(d, uGalN);
        vec3 gx = normalize(uGalC - uGalN*dot(uGalC,uGalN)); vec3 gy = cross(uGalN, gx);
        float lon = atan(dot(d,gy), dot(d,gx));
        float core = exp(-lon*lon*1.3);
        float wob = 0.035*fbm(d*1.4 + 20.0);
        float width = 0.075 + 0.10*core + 0.03*fbm(d*2.2+3.0);
        float bq = (sb - wob)/width; float band = exp(-bq*bq);
        float clouds = 0.5 + 0.5*fbm(d*6.5 + w*0.7);
        float laneMask = smoothstep(-0.2, 0.3, fbm(d*8.0 + 30.0));
        float lq = (sb - wob*0.7 - 0.012)/(width*0.26); float lane = exp(-lq*lq) * laneMask;
        float speck = smoothstep(0.15, 0.6, fbm(d*16.0 + 50.0));
        vec3 mwCol = mix(vec3(0.52,0.60,0.82), vec3(1.0,0.80,0.58), core*0.85);
        float mw = band * clouds * (0.30 + 1.2*core) * (1.0 - 0.88*lane) * (1.0 - 0.45*speck);
        float grains = pow(max(snoise(d*360.0),0.0), 6.0) * 2.4 + pow(max(snoise(d*190.0+4.0),0.0), 8.0) * 2.0;
        col += mwCol * (mw*0.07 + grains*band*(1.0-0.8*lane)*0.10);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const bake = new THREE.Scene();
  const sphere = new THREE.SphereGeometry(10, 64, 32);
  bake.add(new THREE.Mesh(sphere, mat));
  const rt = new THREE.WebGLCubeRenderTarget(size, {
    type: THREE.HalfFloatType,
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  new THREE.CubeCamera(0.1, 100, rt).update(renderer, bake);
  mat.dispose();
  sphere.dispose();
  return rt;
}

const STAR_COLORS = [
  [0.62, 0.74, 1.0],
  [0.78, 0.85, 1.0],
  [1.0, 0.98, 0.95],
  [1.0, 0.93, 0.82],
  [1.0, 0.82, 0.6],
  [1.0, 0.68, 0.45],
];
const STAR_W = [0.1, 0.18, 0.3, 0.2, 0.14, 0.08];

/** Hintergrundsterne. Die Gruppe folgt der Kamera → wirken unendlich weit. */
export function makeStars(ctx: SceneCtx) {
  const { rand, gauss } = ctx.rng;
  const pickColor = () => {
    let r = rand();
    let i = 0;
    for (; i < STAR_W.length - 1; i++) {
      r -= STAR_W[i];
      if (r <= 0) break;
    }
    return STAR_COLORS[i];
  };
  const uniforms = {
    uTime: ctx.uTime,
    uPR: { value: ctx.pr },
    uScale: { value: 1 },
    uTw: { value: 1 },
    uWarp: { value: 0 },
    /** Fokus-Dimming: Hintergrundsterne treten etwas zurück. */
    uDim: { value: 1 },
  };
  const group = new THREE.Group();
  const N = ctx.q.stars;
  const R = 1500;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const ph = new Float32Array(N);
  const gx = GAL_C.clone().sub(GAL_N.clone().multiplyScalar(GAL_C.dot(GAL_N))).normalize();
  const gy = new THREE.Vector3().crossVectors(GAL_N, gx);
  const v = new THREE.Vector3();
  const bright: number[] = [];
  for (let i = 0; i < N; i++) {
    if (rand() < 0.38) {
      const lon = rand() * Math.PI * 2;
      const lat = gauss() * 0.075;
      v.copy(gx)
        .multiplyScalar(Math.cos(lon) * Math.cos(lat))
        .addScaledVector(gy, Math.sin(lon) * Math.cos(lat))
        .addScaledVector(GAL_N, Math.sin(lat));
    } else {
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      v.set(s * Math.cos(t), u, s * Math.sin(t));
    }
    v.normalize().multiplyScalar(R);
    pos.set([v.x, v.y, v.z], i * 3);
    const b = 0.05 + Math.pow(rand(), 7) * 2.6;
    const c = pickColor();
    col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    size[i] = 1.1 + Math.min(b, 1.6) * 1.6;
    ph[i] = rand();
    if (b > 1.55) bright.push(i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aColor; attribute float aSize; attribute float aPhase;
      uniform float uTime, uPR, uScale, uTw, uWarp, uDim;
      varying vec3 vColor;
      void main(){
        vec4 mv = modelViewMatrix*vec4(position,1.0);
        gl_Position = projectionMatrix*mv;
        float tw = 1.0 + uTw*0.38*sin(uTime*(0.9+aPhase*2.6) + aPhase*61.0)*smoothstep(0.1,0.6,aPhase);
        float s = aSize*uPR*uScale;
        float k = 1.0;
        if (s < 1.6) { k = s/1.6; s = 1.6; }
        gl_PointSize = s;
        vColor = aColor*tw*k*(1.0 + uWarp*0.8)*uDim;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float r2 = dot(c,c)*4.0;
        float a = exp(-r2*5.0);
        gl_FragColor = vec4(vColor*a, 1.0);
      }`,
  });
  group.add(new THREE.Points(g, m));

  // wenige helle Sterne mit dezenten Beugungsspitzen
  const B = bright.slice(0, ctx.q.small ? 18 : 34);
  const bp = new Float32Array(B.length * 3);
  const bc = new Float32Array(B.length * 3);
  const bs = new Float32Array(B.length);
  B.forEach((idx, j) => {
    bp.set(pos.subarray(idx * 3, idx * 3 + 3), j * 3);
    bc.set([col[idx * 3] * 0.55, col[idx * 3 + 1] * 0.55, col[idx * 3 + 2] * 0.55], j * 3);
    bs[j] = 26 + rand() * 20;
  });
  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
  bg.setAttribute("aColor", new THREE.BufferAttribute(bc, 3));
  bg.setAttribute("aSize", new THREE.BufferAttribute(bs, 1));
  const bm = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aColor; attribute float aSize; uniform float uPR, uScale, uTime, uDim; varying vec3 vColor;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
        gl_PointSize = aSize*uPR*uScale; vColor = aColor*(0.9+0.1*sin(uTime*1.3+position.x))*uDim; }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main(){
        vec2 c = (gl_PointCoord - 0.5)*2.0; float r = length(c);
        float core = exp(-r*r*60.0)*1.3 + exp(-r*r*9.0)*0.14;
        float sx = exp(-abs(c.y)*90.0)*pow(max(1.0-abs(c.x),0.0),3.0);
        float sy = exp(-abs(c.x)*90.0)*pow(max(1.0-abs(c.y),0.0),3.0);
        gl_FragColor = vec4(vColor*(core + (sx+sy)*0.55), 1.0);
      }`,
  });
  group.add(new THREE.Points(bg, bm));
  return { group, uniforms };
}

/** Nahe Staubpartikel: Parallaxe + Reise-Gefühl. Wiederholen sich in einem 60er-Würfel um die Kamera. */
export function makeMotes(ctx: SceneCtx) {
  const { rand } = ctx.rng;
  const uniforms = {
    uCam: { value: new THREE.Vector3() },
    uPR: { value: ctx.pr },
    uProj: ctx.uProj,
    uWarp: { value: 0 },
  };
  const N = ctx.q.motes;
  const B = 60;
  const p = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) p.set([(rand() - 0.5) * B, (rand() - 0.5) * B, (rand() - 0.5) * B], i * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const m = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform vec3 uCam; uniform float uPR, uProj, uWarp; varying float vA;
      void main(){
        vec3 p = mod(position - uCam + 30.0, 60.0) - 30.0 + uCam;
        vec4 mv = viewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        float d = -mv.z;
        gl_PointSize = max(0.06*uProj/max(d,0.5), 1.0);
        vA = (1.0-smoothstep(12.0, 30.0, d))*smoothstep(0.5, 3.0, d)*(0.10 + uWarp*0.5);
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main(){ vec2 c = gl_PointCoord-0.5; float a = exp(-dot(c,c)*16.0); gl_FragColor = vec4(vec3(0.75,0.8,1.0)*a*vA, 1.0); }`,
  });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  return { points, uniforms };
}
