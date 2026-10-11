import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { UV_VERT } from "./util";

/**
 * Tone-Mapping, das die Farbe heller Kerne erhält.
 *
 * Klassisches ACES arbeitet pro Farbkanal: Ist ein blauer Stern hell genug,
 * laufen auch Rot und Grün in die Sättigung — der Kern wird weiß. Hier wird
 * dieselbe ACES-Kurve zusätzlich nur auf den hellsten Kanal angewendet und die
 * Farbe proportional mitskaliert („hue-preserving“). In den Lichtern wird
 * zwischen beiden überblendet: Dunkles und Mitten sehen aus wie bisher (der
 * abgenommene Look), helle Kerne behalten ihren Farbton. Erst ganz oben
 * (Peak ≫ 1) wird der Kern wieder etwas weißer, damit er noch „brennt“.
 *
 * Kein pow(): Die Kurve ist ein reiner Bruch, alle Eingänge sind vorher auf ≥ 0 geklemmt.
 */
const TONEMAP = /* glsl */ `
  uniform float uExposure, uKeep;
  vec3 rrtOdt(vec3 v){
    vec3 a = v*(v + 0.0245786) - 0.000090537;
    vec3 b = v*(0.983729*v + 0.4329510) + 0.238081;
    return a/b;
  }
  // wie THREE.ACESFilmicToneMapping (inkl. Faktor 1/0.6)
  vec3 aces(vec3 c){
    const mat3 IN = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
    const mat3 OUT = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
    return clamp(OUT*rrtOdt(IN*(c*(uExposure/0.6))), 0.0, 1.0);
  }
  vec3 toneMap(vec3 c){
    c = max(c, vec3(0.0));
    vec3 film = aces(c);
    float peak = max(max(c.r, c.g), c.b);
    // Graue Eingänge laufen unverändert durch beide ACES-Matrizen → Kurvenwert des Peaks
    float m = aces(vec3(peak)).g;
    vec3 hue = c*(m/max(peak, 1e-4));
    float w = smoothstep(0.3, 1.4, peak)*(1.0 - 0.45*smoothstep(3.0, 14.0, peak))*uKeep;
    return mix(film, hue, w);
  }
`;

/**
 * Postprocessing wie im Prototyp: Bloom → „Kino“-Pass (Warp-Radialblur,
 * chromatische Aberration, Vignette, kühle Schatten, Tone-Mapping) → Output
 * (nur noch sRGB) → Filmkorn.
 */
export function createPost(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: { pr: number; msaa: number; width: number; height: number },
) {
  const { msaa, width, height } = opts;
  let pr = opts.pr;
  const rt = new THREE.WebGLRenderTarget(width * pr, height * pr, { type: THREE.HalfFloatType, samples: msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(pr);
  composer.addPass(new RenderPass(scene, camera));
  // Sicherheitsnetz: Ein einziges NaN/Inf-Pixel (z. B. aus einem GPU-spezifisch
  // undefinierten Shader-Ausdruck) würde der Bloom sonst über das ganze Bild zu
  // Schwarz verschmieren. max/min fängt NaN auch dort ab, wo isnan wegoptimiert wird.
  composer.addPass(
    new ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: UV_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
          gl_FragColor = vec4(min(max(c, vec3(0.0)), vec3(256.0)), 1.0);
        }`,
    }),
  );
  // Bloom leiser, enger und erst ab höherer Helligkeit als im Prototyp: Er soll
  // Kerne zum Glühen bringen, nicht das Bild um helle Sterne milchig machen.
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.5, 0.4, 0.9);
  composer.addPass(bloom);
  const cine = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uWarp: { value: 0 },
      uAspect: { value: 1 },
      uCA: { value: 1 },
      uExposure: { value: 1 },
      uKeep: { value: 0.85 },
    },
    vertexShader: UV_VERT,
    fragmentShader:
      TONEMAP +
      /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uWarp, uAspect, uCA; varying vec2 vUv;
      void main(){
        vec2 d = vUv - 0.5;
        vec3 col;
        if (uWarp > 0.002) {
          vec3 acc = vec3(0.0); float tot = 0.0;
          for (int i = 0; i < 16; i++) {
            float t = float(i)/15.0; float w = 1.0 - t*0.7;
            acc += texture2D(tDiffuse, 0.5 + d*(1.0 - uWarp*t)).rgb * w; tot += w;
          }
          col = acc/tot;
        } else {
          vec2 off = d * dot(d,d) * 0.012 * uCA;
          col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        }
        vec2 dv = d; dv.x *= uAspect;
        float vig = (1.0-smoothstep(0.2, 1.05, length(dv)*1.15));
        col *= mix(0.32, 1.0, vig);
        float l = dot(col, vec3(0.2126,0.7152,0.0722));
        col = mix(col, col*vec3(0.92,1.0,1.08), (1.0-smoothstep(0.0, 0.25, l))*0.6);
        col += vec3(0.0025,0.003,0.0055);
        gl_FragColor = vec4(toneMap(col), 1.0);
      }`,
  });
  composer.addPass(cine);
  composer.addPass(new OutputPass());
  const grain = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2() }, uAmt: { value: 0.045 } },
    vertexShader: UV_VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime, uAmt; uniform vec2 uRes; varying vec2 vUv;
      float h(vec2 p){ p = fract(p*vec2(443.897,441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float n = h(floor(vUv*uRes/1.5) + fract(uTime*7.31)*vec2(97.0,61.0)) - 0.5;
        float l = dot(c, vec3(0.299,0.587,0.114));
        c += n * uAmt * (0.55 + 0.45*(1.0 - l));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  composer.addPass(grain);

  const resize = (w: number, h: number, mobile: boolean) => {
    composer.setSize(w, h);
    bloom.setSize(Math.round(w * pr), Math.round(h * pr));
    cine.uniforms.uAspect.value = w / h;
    cine.uniforms.uCA.value = mobile ? 0.5 : 1;
    grain.uniforms.uRes.value.set(w * pr, h * pr);
    grain.uniforms.uAmt.value = mobile ? 0.035 : 0.045;
  };

  /** Pixeldichte nachträglich ändern (adaptive Qualität). */
  const setPixelRatio = (p: number, w: number, h: number, mobile: boolean) => {
    pr = p;
    composer.setPixelRatio(p);
    resize(w, h, mobile);
  };

  const dispose = () => {
    for (const p of composer.passes) (p as { dispose?: () => void }).dispose?.();
    composer.dispose();
    rt.dispose();
  };

  return { composer, cine, grain, resize, setPixelRatio, dispose };
}
