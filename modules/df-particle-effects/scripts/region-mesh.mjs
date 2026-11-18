import { LOG_PREFIX } from "./constants.mjs";
import { MESH_VERTEX, pixiMajorVersion } from "./fire-surface-shader.mjs";
import { edgeDepthToRgba } from "./ice-depth.mjs";

/**
 * One world-space quad over the region bounds with a generative fragment shader and
 * the region's edge-distance map bound as `uDepth` (PixiJS 7 API).
 *
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @param {{ width: number, height: number, values: Float32Array }} depth
 * @param {string} fragment
 * @param {object} uniforms without uDepth
 * @param {string} label for log lines
 * @returns {{ display: object, destroy(): void }|null}
 */
export function createRegionMesh(PIXI, bounds, depth, fragment, uniforms, label) {
  const major = pixiMajorVersion(PIXI);
  if (major !== 7) {
    console.warn(`${LOG_PREFIX} ${label} shader supports PixiJS 7 only (found ${PIXI?.VERSION ?? "none"}).`);
    return null;
  }
  if (!PIXI.Mesh || !PIXI.MeshGeometry || !PIXI.Shader?.from || !PIXI.Texture?.fromBuffer) {
    console.warn(`${LOG_PREFIX} PIXI.Mesh/MeshGeometry/Shader.from/Texture.fromBuffer unavailable for ${label}.`);
    return null;
  }

  const width = Math.max(1, Number(bounds.width) || 1);
  const height = Math.max(1, Number(bounds.height) || 1);
  let depthTexture = null;
  let mesh;
  try {
    depthTexture = PIXI.Texture.fromBuffer(edgeDepthToRgba(depth), depth.width, depth.height, {
      scaleMode: PIXI.SCALE_MODES?.LINEAR,
      mipmap: PIXI.MIPMAP_MODES?.OFF,
    });
    const shader = PIXI.Shader.from(MESH_VERTEX, fragment, { ...uniforms, uDepth: depthTexture });
    const geometry = new PIXI.MeshGeometry(
      new Float32Array([0, 0, width, 0, width, height, 0, height]),
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      new Uint16Array([0, 1, 2, 0, 2, 3]),
    );
    mesh = new PIXI.Mesh(geometry, shader);
  } catch (error) {
    console.warn(`${LOG_PREFIX} ${label} mesh could not be created.`, error);
    depthTexture?.destroy?.(true);
    return null;
  }

  mesh.position.set(Number(bounds.x) || 0, Number(bounds.y) || 0);
  if ("eventMode" in mesh) {
    mesh.eventMode = "none";
    mesh.interactiveChildren = false;
  }
  return {
    display: mesh,
    destroy() {
      if (!mesh.destroyed) mesh.destroy({ children: true });
      depthTexture?.destroy?.(true);
      depthTexture = null;
    },
  };
}
