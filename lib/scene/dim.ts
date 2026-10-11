import * as THREE from "three";
import type { Uniform } from "./types";

const DONE = "__dim";

/**
 * Hängt einen Helligkeitsfaktor `uDim` (0…1) an alle Materialien unter `root`.
 * So kann die Engine ein Objekt als Ganzes abdimmen, ohne dass jedes Objekt-Modul
 * das selbst verdrahten muss.
 *
 * - ShaderMaterial: `main()` wird umbenannt und von einer Hülle aufgerufen, die
 *   danach `gl_FragColor.rgb *= uDim` rechnet.
 * - Eingebaute Materialien (Linien, MeshBasic): dasselbe per `onBeforeCompile`.
 *
 * Alle Szene-Materialien sind additiv (bzw. absorbierend) — ein kleineres rgb
 * heißt also „schwächer“, nicht „dunkler Fleck“.
 */
export function applyDim(root: THREE.Object3D, dim: Uniform<number>) {
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material;
    if (!mat) return;
    for (const m of Array.isArray(mat) ? mat : [mat]) {
      if (m.userData[DONE]) continue;
      m.userData[DONE] = true;
      if (m instanceof THREE.ShaderMaterial) {
        m.uniforms.uDim = dim;
        m.fragmentShader =
          m.fragmentShader.replace(/void\s+main\s*\(\s*\)/, "void mainInner()") +
          "\nuniform float uDim;\nvoid main(){ mainInner(); gl_FragColor.rgb *= uDim; }\n";
      } else {
        m.onBeforeCompile = (shader) => {
          shader.uniforms.uDim = dim;
          shader.fragmentShader =
            "uniform float uDim;\n" +
            shader.fragmentShader.replace(
              "#include <dithering_fragment>",
              "#include <dithering_fragment>\n  gl_FragColor.rgb *= uDim;",
            );
        };
      }
    }
  });
}
