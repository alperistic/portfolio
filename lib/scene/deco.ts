import * as THREE from "three";
import { NOISE } from "./glsl";
import { billboard } from "./objects/billboard";
import type { FrameState, SceneCtx } from "./types";
import { UV_VERT } from "./util";

/*
 * Deko ohne Inhalt: ein langsam ziehender Komet und gelegentliche Sternschnuppen.
 * Bewusst sparsam — beides soll man eher „nebenbei“ entdecken.
 */

/**
 * Setzt `m.matrix` so, dass die lokale x-Achse von `from` nach `from + dir*len`
 * läuft und die Fläche (xy) möglichst zur Kamera zeigt — ein „Band“, das sich
 * nur um seine Längsachse dreht (wie ein Schweif oder eine Leuchtspur).
 */
const X = new THREE.Vector3();
const Y = new THREE.Vector3();
const Z = new THREE.Vector3();
const SIDE = new THREE.Vector3();
function orientStrip(m: THREE.Object3D, from: THREE.Vector3, dir: THREE.Vector3, len: number, width: number, cam: THREE.Vector3) {
  X.copy(dir).normalize();
  Z.copy(cam).sub(from);
  Z.addScaledVector(X, -Z.dot(X));
  if (Z.lengthSq() < 1e-8) Z.set(0, 1, 0).cross(X);
  Z.normalize();
  Y.crossVectors(Z, X).normalize();
  SIDE.copy(Y);
  m.matrix.makeBasis(X.multiplyScalar(len), Y.multiplyScalar(width), Z);
  m.matrix.setPosition(from);
  m.matrixWorldNeedsUpdate = true;
  return SIDE; // normierte Querachse — für die Krümmungsrichtung
}

/** Band-Geometrie: x ∈ [0, 1] entlang, y ∈ [−0.5, 0.5] quer. */
function stripGeo(segments: number) {
  const g = new THREE.PlaneGeometry(1, 1, segments, 1);
  g.translate(0.5, 0, 0);
  return g;
}

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

/**
 * Komet auf einer weiten, geneigten Bahn um Alpers Sonne (eine Runde ≈ 15 min).
 * Zwei Schweife zeigen immer von der Sonne weg: ein gerader, bläulicher
 * Ionenschweif und ein breiterer, leicht gekrümmter Staubschweif.
 * Die Bahnebene steht grob quer zum Startblick — so liegen die Schweife im Bild
 * statt perspektivisch verkürzt vom Betrachter weg zu zeigen.
 */
export function makeComet(ctx: SceneCtx, sunPos: THREE.Vector3) {
  const root = new THREE.Group();
  const R = 40;
  const PERIOD = 900;
  // Bahnebene: senkrecht zur Blickachse auf die Sonne, um ~30° nach hinten gekippt → Ellipse im Bild.
  const axis = sunPos.clone().normalize();
  const e1 = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(e1, axis).normalize().applyAxisAngle(e1, -0.5);
  // Start oben rechts von der Sonne, zieht langsam nach oben/links weiter
  let theta = 1.0;

  const head = new THREE.Group();
  head.add(
    billboard(
      ctx,
      3.2,
      new THREE.ShaderMaterial({
        ...additive,
        vertexShader: UV_VERT,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          void main(){
            float r = length(vUv-0.5)*2.0;
            float g = exp(-r*r*260.0)*2.2 + exp(-r*r*28.0)*0.32 + exp(-r*5.0)*0.05;
            gl_FragColor = vec4(vec3(0.78,0.92,1.0)*g*(1.0-smoothstep(0.8,1.0,r)), 1.0);
          }`,
      }),
    ),
  );
  root.add(head);

  const tailMat = (ion: boolean) =>
    new THREE.ShaderMaterial({
      ...additive,
      side: THREE.DoubleSide,
      defines: { OCT: 3, ION: ion ? 1 : 0 },
      uniforms: { uTime: ctx.uTime, uCurve: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uCurve; varying vec2 vUv;
        void main(){
          vUv = uv; vec3 p = position;
          p.y += uCurve * p.x * p.x;                 // Staubschweif biegt sich nach hinten
          p.y *= mix(0.12, 1.0, pow(max(p.x, 0.0), 0.6));      // schmal am Kopf, weit am Ende
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uTime; varying vec2 vUv;
        void main(){
          float x = vUv.x; float y = (vUv.y - 0.5)*2.0;
          float along = pow(max(1.0 - x, 0.0), 1.6) * smoothstep(0.0, 0.04, x);
        #if ION
          float str = 0.65 + 0.35*snoise(vec3(y*5.0, x*3.0 - uTime*0.25, 1.0));
          float a = exp(-y*y*14.0) * along * str * 0.55;
          vec3 col = vec3(0.45,0.7,1.0);
        #else
          float a = exp(-y*y*3.2) * along * 0.42;
          vec3 col = vec3(1.0,0.86,0.66);
        #endif
          gl_FragColor = vec4(col*a, 1.0);
        }`,
    });
  const ion = new THREE.Mesh(stripGeo(1), tailMat(true));
  const dust = new THREE.Mesh(stripGeo(24), tailMat(false));
  for (const t of [ion, dust]) {
    t.matrixAutoUpdate = false;
    t.frustumCulled = false;
    root.add(t);
  }

  const pos = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const anti = new THREE.Vector3();
  const dustDir = new THREE.Vector3();
  const place = (cam: THREE.Vector3) => {
    pos.copy(e1).multiplyScalar(Math.cos(theta) * R).addScaledVector(e2, Math.sin(theta) * R).add(sunPos);
    vel.copy(e1).multiplyScalar(-Math.sin(theta)).addScaledVector(e2, Math.cos(theta));
    head.position.copy(pos);
    anti.copy(pos).sub(sunPos).normalize();
    orientStrip(ion, pos, anti, 17, 1.2, cam);
    // Staub bleibt etwas hinter der Bewegung zurück
    dustDir.copy(anti).addScaledVector(vel, -0.35).normalize();
    const side = orientStrip(dust, pos, dustDir, 11, 3, cam);
    (dust.material as THREE.ShaderMaterial).uniforms.uCurve.value = -Math.sign(vel.dot(side)) * 0.18;
  };

  return {
    root,
    update: ({ dt, rs, camera }: FrameState) => {
      theta += (dt * rs * Math.PI * 2) / PERIOD;
      place(camera.position);
    },
  };
}

/**
 * Sternschnuppen: höchstens eine gleichzeitig, alle 8–24 s, meist irgendwo im
 * aktuellen Blickfeld. Kurze helle Spur, die schnell verglimmt.
 */
export function makeMeteors() {
  const root = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    ...additive,
    side: THREE.DoubleSide,
    uniforms: { uFade: { value: 0 } },
    vertexShader: UV_VERT,
    fragmentShader: /* glsl */ `
      uniform float uFade; varying vec2 vUv;
      void main(){
        float y = (vUv.y - 0.5)*2.0; float x = vUv.x;
        float a = pow(max(x, 0.0), 2.4) * exp(-y*y*6.0) * uFade;
        float hk = (1.0 - x)*14.0;
        a += exp(-hk*hk) * exp(-y*y*3.0) * 0.8 * uFade;   // heller Kopf
        gl_FragColor = vec4(vec3(0.86,0.92,1.0)*a*1.6, 1.0);
      }`,
  });
  const strip = new THREE.Mesh(stripGeo(1), mat);
  strip.matrixAutoUpdate = false;
  strip.frustumCulled = false;
  strip.visible = false;
  root.add(strip);

  const D = 320;
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const H = new THREE.Vector3();
  const T = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  let wait = 6 + Math.random() * 8;
  let t = -1;
  let dur = 1;

  const spawn = (cam: THREE.PerspectiveCamera) => {
    cam.getWorldDirection(fwd);
    right.setFromMatrixColumn(cam.matrixWorld, 0);
    up.setFromMatrixColumn(cam.matrixWorld, 1);
    const inView = Math.random() < 0.75;
    const sx = (Math.random() - 0.5) * (inView ? 0.9 : 3);
    const sy = 0.1 + Math.random() * (inView ? 0.35 : 1.2);
    const start = fwd.clone().addScaledVector(right, sx).addScaledVector(up, sy).normalize();
    // meist schräg nach unten
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const move = right.clone().multiplyScalar(Math.cos(ang)).addScaledVector(up, Math.sin(ang));
    const len = 0.12 + Math.random() * 0.14;
    A.copy(cam.position).addScaledVector(start, D);
    B.copy(A).addScaledVector(move, len * D);
    dur = 0.55 + Math.random() * 0.5;
    t = 0;
    strip.visible = true;
  };

  return {
    root,
    update: ({ dt, camera }: FrameState, allowed: boolean) => {
      if (t < 0) {
        wait -= dt;
        if (wait <= 0 && allowed) spawn(camera);
        return;
      }
      t += dt / dur;
      if (t >= 1 || !allowed) {
        t = -1;
        wait = 8 + Math.random() * 16;
        strip.visible = false;
        return;
      }
      const e = 1 - Math.pow(1 - t, 1.6);
      H.lerpVectors(A, B, e);
      T.lerpVectors(A, B, Math.max(0, e - 0.45));
      mat.uniforms.uFade.value = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 1.2;
      orientStrip(strip, T, H.clone().sub(T), T.distanceTo(H) + 1e-3, 0.9, camera.position);
    },
  };
}
