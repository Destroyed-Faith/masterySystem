/**
 * The loaded scene background texture and the world rectangle it covers, or null.
 * Only the background image is refracted; tiles and drawings are not part of it.
 * Foundry draws the background over `canvas.dimensions.sceneRect`.
 *
 * @param {object} [canvasRef]
 * @param {object} [pixi]
 * @returns {{ texture: object, rect: { x: number, y: number, width: number, height: number } }|null}
 */
export function resolveSceneBackground(canvasRef = globalThis.canvas, pixi = globalThis.PIXI) {
  const rect = sceneRect(canvasRef);
  if (!rect) return null;
  const texture = [
    canvasRef?.primary?.background?.texture,
    cachedTexture(canvasRef?.level?.background?.src, pixi),
    cachedTexture(canvasRef?.scene?.background?.src, pixi),
  ].find((candidate) => usableTexture(candidate, pixi));
  return texture ? { texture, rect } : null;
}

export function usableTexture(texture, pixi = globalThis.PIXI) {
  if (!texture || texture === pixi?.Texture?.EMPTY || texture === pixi?.Texture?.WHITE) return false;
  if (texture.destroyed || texture.baseTexture?.destroyed) return false;
  if (texture.baseTexture?.valid !== true) return false;
  return Number(texture.frame?.width) > 1 && Number(texture.frame?.height) > 1;
}

function cachedTexture(src, pixi) {
  if (!src) return null;
  const fromFoundry = globalThis.foundry?.canvas?.getTexture?.(src);
  if (fromFoundry) return fromFoundry;
  return pixi?.utils?.TextureCache?.[src] ?? null;
}

function sceneRect(canvasRef) {
  const rect = canvasRef?.dimensions?.sceneRect;
  const x = Number(rect?.x);
  const y = Number(rect?.y);
  const width = Number(rect?.width);
  const height = Number(rect?.height);
  if (![x, y, width, height].every(Number.isFinite) || !(width > 0) || !(height > 0)) return null;
  return { x, y, width, height };
}
