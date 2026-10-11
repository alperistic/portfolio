import * as THREE from "three";
import type { SceneCtx } from "../types";

/** Quadratische Fläche, die die Engine jedes Frame zur Kamera dreht. */
export function billboard(ctx: SceneCtx, size: number, material: THREE.Material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  ctx.billboards.push(m);
  return m;
}
