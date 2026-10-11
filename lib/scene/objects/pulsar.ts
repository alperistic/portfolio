import * as THREE from "three";
import { NOISE } from "../glsl";
import type { Celestial, SceneCtx } from "../types";
import { UV_VERT } from "../util";
import { billboard } from "./billboard";

/**
 * Kontakt: Pulsar — sendet ein Signal. Winziger, gleißender Kern; zwei schlanke,
 * rotierende Strahlkegel entlang der Magnetachse (blitzt auf, wenn einer zur Kamera
 * zeigt); ein Pulsarwind-Torus in der Äquatorebene und leise, sich ausbreitende
 * Signalringe.
 */
export function makePulsar(ctx: SceneCtx): Celestial {
  const group = new THREE.Group();
  const hover = { value: 0 };
  const pulse = { value: 0 };
  // ganzer Pulsar leicht gekippt, damit Torus und Strahlen räumlich wirken
  const body = new THREE.Group();
  body.rotation.set(0.42, 0, -0.18);
  group.add(body);

  body.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 32, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.78, 0.9, 1.0).multiplyScalar(7) }),
    ),
  );
  group.add(
    billboard(
      ctx,
      26,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: ctx.uTime, uPulse: pulse, uHover: hover },
        vertexShader: UV_VERT,
        fragmentShader: /* glsl */ `
          uniform float uTime, uPulse, uHover; varying vec2 vUv;
          void main(){
            vec2 p = (vUv-0.5)*26.0; float r = length(p);
            float g = exp(-r*1.4)*1.1 + exp(-r*0.42)*0.08;
            float rings = 0.0;
            for (int i=0;i<3;i++){
              float ph = fract(uTime*0.2 + float(i)/3.0);
              float rad = ph*12.0;
              float rq = (r-rad)*3.0; rings += exp(-rq*rq) * (1.0-ph) * (1.0-ph) * 0.12;
            }
            float c = g*(0.75 + uPulse*1.8) + rings*(0.7 + 0.8*uHover);
            c *= (1.0-smoothstep(9.0, 13.0, r));
            gl_FragColor = vec4(vec3(0.55,0.75,1.0)*c, 1.0);
          }`,
      }),
    ),
  );

  /* ---------- Pulsarwind-Torus (Äquatorebene) ---------- */
  const torus = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 7.5, 128, 1),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      defines: { OCT: 3 },
      uniforms: { uTime: ctx.uTime, uHover: hover },
      vertexShader: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:
        NOISE +
        /* glsl */ `
        uniform float uTime, uHover; varying vec2 vP;
        void main(){
          float r = length(vP); float th = atan(vP.y, vP.x);
          vec2 dir = vP/max(r, 1e-4);
          // Wisps, die langsam nach außen wandern
          float wisp = fbm(vec3(dir*2.4, r*0.9 - uTime*0.12));
          float k1 = (r - 3.3)/1.1, k2 = (r - 1.9)/0.35;
          float ring = exp(-k1*k1);
          float inner = exp(-k2*k2)*0.6;
          float a = (ring*(0.35 + 0.65*smoothstep(-0.2, 0.5, wisp)) + inner) * (1.0 - smoothstep(5.5, 7.5, r)) * smoothstep(1.4, 1.8, r);
          a *= 0.8 + 0.2*sin(th*3.0 + uTime*0.3);
          gl_FragColor = vec4(mix(vec3(0.5,0.7,1.0), vec3(0.62,0.52,1.0), smoothstep(2.0, 6.0, r)) * a * (0.16 + 0.12*uHover), 1.0);
        }`,
    }),
  );
  torus.rotation.x = -Math.PI / 2; // Ring (xy) in die Äquatorebene (xz)
  body.add(torus);

  /* ---------- Strahlkegel ---------- */
  const spin = new THREE.Group();
  const tiltG = new THREE.Group();
  tiltG.rotation.z = 0.55;
  spin.add(tiltG);
  const L = 34;
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    defines: { OCT: 2 },
    uniforms: { uL: { value: L }, uHover: hover, uTime: ctx.uTime },
    vertexShader: /* glsl */ `
      uniform float uL; varying float vAlong; varying vec3 vNv; varying vec3 vVv; varying vec3 vPos;
      void main(){ vAlong = -position.y/uL; vPos = position; vNv = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vVv = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader:
      NOISE +
      /* glsl */ `
      uniform float uHover, uTime; varying float vAlong; varying vec3 vNv; varying vec3 vVv; varying vec3 vPos;
      void main(){
        // Blick durch die Kegelmitte = viel Material, am Rand fast nichts → weicher Lichtfinger statt fester Tüte
        float edge = pow(abs(dot(normalize(vNv), normalize(vVv))), 4.0);
        float fall = pow(1.0 - clamp(vAlong,0.0,1.0), 2.2) * smoothstep(0.0, 0.03, vAlong);
        float grain = 0.8 + 0.2*snoise(vec3(vPos.xz*0.8, vAlong*6.0 - uTime*3.0));
        gl_FragColor = vec4(vec3(0.5,0.72,1.0) * edge * fall * grain * (0.48 + 0.3*uHover), 1.0);
      }`,
  });
  const coneGeo = new THREE.ConeGeometry(1.9, L, 48, 1, true);
  coneGeo.translate(0, -L / 2, 0); // Spitze im Ursprung
  const b1 = new THREE.Mesh(coneGeo, beamMat);
  const b2 = new THREE.Mesh(coneGeo, beamMat);
  b2.rotation.x = Math.PI;
  tiltG.add(b1, b2);
  body.add(spin);

  const axis = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const q = new THREE.Quaternion();
  let lastA = 0;
  let wasRising = false;
  return {
    root: group,
    hover,
    visR: 12,
    labelR: 5,
    hitR: 7,
    update: ({ dt, rs, camera, emit }) => {
      spin.rotation.y += dt * 2.1 * rs;
      axis.set(0, 1, 0).applyQuaternion(tiltG.getWorldQuaternion(q));
      toCam.copy(camera.position).sub(group.position).normalize();
      // Aufblitzen, wenn ein Strahl zur Kamera zeigt — bei reduzierter Bewegung nur angedeutet
      const a = Math.abs(axis.dot(toCam));
      pulse.value = Math.pow(a, 10) * (rs < 1 ? 0.35 : 1);
      // Scheitel des Blitzes melden (für den Signal-Ton)
      const rising = a > lastA;
      if (wasRising && !rising && lastA > 0.8) emit({ type: "pulse", id: "kontakt" });
      wasRising = rising;
      lastA = a;
    },
  };
}
