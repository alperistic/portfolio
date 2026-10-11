import * as THREE from "three";
import { NOISE } from "./glsl";
import type { FrameState, SceneCtx } from "./types";
import { billboard } from "./objects/billboard";
import { dirFrom, UP } from "./util";

/**
 * Easter Egg: ein schwarzes Loch weit abseits — tief unten links, vor der
 * Milchstraße, damit die Gravitationslinse etwas zum Verzerren hat.
 * Nicht anklickbar, kein Label; man findet es nur beim bewussten Umsehen.
 *
 * - Linse: Eine Fläche um das Loch sampelt die Himmels-Cubemap in abgelenkter
 *   Richtung (Punktlinsen-Gleichung β = θ − θE²/θ). Am Rand geht die Ablenkung
 *   weich gegen null → nahtlos zum echten Hintergrund.
 * - Schatten + dünner Photonenring.
 * - Fast von der Kante gesehene Akkretionsscheibe mit Doppler-Aufhellung auf der
 *   Seite, die sich auf uns zu bewegt. Eine schwarze Kugel verdeckt ihre Rückseite.
 * - Deren Licht wird aber um das Loch herumgebogen: als Bogen über (und schwächer
 *   unter) dem Schatten — das macht die Form sofort lesbar.
 */
export const BLACK_HOLE = { yaw: -45, pitch: -36, dist: 240 };

export function makeBlackHole(ctx: SceneCtx, sky: THREE.Texture) {
  const root = new THREE.Group();
  const pos = dirFrom(BLACK_HOLE.yaw, BLACK_HOLE.pitch).multiplyScalar(BLACK_HOLE.dist);
  root.position.copy(pos);
  const RS = 8; // Schattenradius (Welt-Einheiten)
  const uBg = { value: 1 };
  const uGlow = { value: 1 };

  // Schatten als echte Kugel: schreibt Tiefe, verdeckt so die Rückseite der Scheibe
  const hole = new THREE.Mesh(new THREE.SphereGeometry(RS * 0.97, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  root.add(hole);

  // Lage der Akkretionsscheibe: fast von der Kante, leicht gekippt
  const a = pos.clone().normalize();
  const right = new THREE.Vector3().crossVectors(a, UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, a).normalize();
  const n = up.clone().applyAxisAngle(right, -0.2).applyAxisAngle(a, -0.28); // Normale der Scheibe
  const u = right.clone().applyAxisAngle(a, -0.28);
  const v = new THREE.Vector3().crossVectors(n, u);

  const lens = billboard(
    ctx,
    RS * 14,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uSky: { value: sky }, uBg, uGlow, uC: { value: pos }, uRs: { value: RS }, uN: { value: n }, uTime: ctx.uTime },
      vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */ `
        uniform samplerCube uSky; uniform float uBg, uGlow, uRs, uTime; uniform vec3 uC, uN; varying vec3 vW;
        void main(){
          vec3 dir = normalize(vW - cameraPosition);
          vec3 toC = uC - cameraPosition; float dist = length(toC); vec3 c = toC/dist;
          float th = acos(clamp(dot(dir, c), -1.0, 1.0));
          float ths = atan(uRs/dist);               // Winkelradius des Schattens
          float thE = ths*1.9;                       // Einstein-Radius
          float thMax = ths*6.5;
          vec3 perp = dir - c*dot(dir, c); float pl = length(perp);
          perp = pl > 1e-7 ? perp/pl : vec3(0.0);
          float beta = th - thE*thE/max(th, 1e-5);   // Quellrichtung (negativ = Gegenbild)
          vec3 src = c*cos(beta) + perp*sin(beta);
          float w = 1.0 - smoothstep(thMax*0.5, thMax, th);
          vec3 s = textureCube(uSky, normalize(mix(dir, src, w))).rgb * uBg;
          float shadow = smoothstep(ths*0.985, ths*1.02, th);
          float k1 = (th - ths*1.045)/(ths*0.03), k2 = (th - ths*1.12)/(ths*0.12);
          float ring = exp(-k1*k1) + exp(-k2*k2)*0.18;
          // umgebogenes Bild der Scheibenrückseite: Bogen über/unter dem Schatten
          vec3 nS = normalize(uN - c*dot(uN, c));                // Scheibennormale in der Bildebene
          vec3 sS = cross(c, nS);                                 // Richtung entlang der Scheibe
          float up = dot(perp, nS);
          float arcR = (th - ths*1.32)/(ths*(0.16 + 0.1*abs(dot(perp, sS))));
          float arc = exp(-arcR*arcR) * (smoothstep(0.0, 0.8, up) + 0.35*smoothstep(0.0, 0.8, -up));
          arc *= (0.75 + 0.25*dot(perp, sS)) * (0.85 + 0.15*sin(atan(dot(perp, sS), up + 1e-6)*9.0 - uTime*0.6));
          float glow = ring + arc*0.55;
          vec3 col = s*shadow + mix(vec3(1.0,0.55,0.25), vec3(1.0,0.85,0.68), ring)*glow*0.9*uGlow;
          gl_FragColor = vec4(col, max(w, clamp(glow, 0.0, 1.0)));
        }`,
    }),
  );
  lens.renderOrder = 5;
  root.add(lens);

  // Akkretionsscheibe (Vorderseite; die Rückseite verdeckt die schwarze Kugel)
  const disk = new THREE.Mesh(
    new THREE.RingGeometry(RS * 1.5, RS * 4.4, 160, 1),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      defines: { OCT: 3 },
      uniforms: { uTime: ctx.uTime, uRs: { value: RS }, uN: { value: n }, uC: { value: pos } },
      vertexShader: /* glsl */ `varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uTime, uRs; uniform vec3 uN, uC; varying vec2 vP; varying vec3 vW;
        void main(){
          float r = length(vP)/uRs; float ph = atan(vP.y, vP.x);
          // Streifen, die innen schneller umlaufen (differentielle Rotation)
          float swirl = ph + uTime*0.9/(r*sqrt(r));
          float streak = fbm(vec3(cos(swirl)*r*1.3, sin(swirl)*r*1.3, r*4.0))*0.5 + 0.5;
          float prof = smoothstep(1.5, 1.8, r) * exp(-(r - 1.6)*1.1) * (1.0 - smoothstep(3.6, 4.4, r));
          // Doppler: Seite, die sich auf uns zu bewegt, ist heller und bläulicher
          vec3 radial = normalize(vW - uC);
          vec3 vel = normalize(cross(uN, radial));
          float toward = dot(vel, normalize(cameraPosition - vW));
          float beam = pow(1.0 + 0.35*toward, 2.5);
          vec3 hot = mix(vec3(1.0,0.55,0.25), vec3(1.0,0.9,0.75), 1.0 - smoothstep(1.7, 3.2, r));   // innen heißer
          hot = mix(hot, vec3(0.85,0.9,1.0), clamp(toward, 0.0, 1.0)*0.25);
          gl_FragColor = vec4(hot * prof * (0.45 + 0.8*streak) * beam * 0.55, 1.0);
        }`,
    }),
  );
  disk.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, n));
  disk.renderOrder = 6;
  root.add(disk);

  return {
    root,
    disk,
    /** Linse = Hintergrund: mit dessen Helligkeit mitgehen; Glühen mit der Deko dimmen. */
    update: (_: FrameState, bgIntensity: number, dim: number) => {
      uBg.value = bgIntensity;
      uGlow.value = dim;
    },
  };
}
