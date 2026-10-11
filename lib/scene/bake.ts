import * as THREE from "three";
import type { BakeOptions } from "./types";
import { UV_VERT } from "./util";

/**
 * Rendert einen Fragment-Shader einmalig in eine Textur (HalfFloat, mit Mipmaps,
 * damit es aus der Ferne nicht flimmert). Gibt `bake` + `dispose` zurück.
 */
export function createBaker(renderer: THREE.WebGLRenderer) {
  const targets: THREE.WebGLRenderTarget[] = [];
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const scene = new THREE.Scene();
  scene.add(quad);

  const bake = (o: BakeOptions) => {
    const rt = new THREE.WebGLRenderTarget(o.width, o.height, {
      type: THREE.HalfFloatType,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });
    const mat = new THREE.ShaderMaterial({
      vertexShader: UV_VERT,
      // Ausgabe absichern: NaN/negativ → 0, damit Mipmaps und Bloom nichts verschmieren
      fragmentShader:
        o.fragmentShader.replace(/void\s+main\s*\(\s*\)/, "void bakeMain()") +
        "\nvoid main(){ bakeMain(); vec4 c = gl_FragColor; c = (any(isnan(c)) || any(isinf(c))) ? vec4(0.0) : c; gl_FragColor = min(max(c, vec4(0.0)), vec4(256.0)); }\n",
      uniforms: o.uniforms ?? {},
      defines: o.defines ?? {},
      depthTest: false,
      depthWrite: false,
    });
    quad.material = mat;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.render(scene, cam);
    renderer.setRenderTarget(prev);
    mat.dispose();
    targets.push(rt);
    return rt.texture;
  };

  const dispose = () => {
    for (const t of targets) t.dispose();
    quad.geometry.dispose();
  };

  return { bake, dispose };
}
