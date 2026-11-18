import { ICE_DEPTH_MAP_SIZE } from "./constants.mjs";

const DIAGONAL = Math.SQRT2;

/**
 * Distance from the region edge, sampled over the region bounds.
 * 0 is on or outside the edge, 1 is the deepest point of the region. Holes count
 * as edges, so ice also grows in from them.
 *
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @param {(x: number, y: number) => boolean} contains
 * @param {number} [maxSize]
 * @returns {{ width: number, height: number, values: Float32Array }}
 */
export function computeEdgeDepth(bounds, contains, maxSize = ICE_DEPTH_MAP_SIZE) {
  const longest = Math.max(bounds.width, bounds.height, 1);
  const step = longest / Math.max(2, maxSize);
  const width = Math.max(2, Math.ceil(bounds.width / step));
  const height = Math.max(2, Math.ceil(bounds.height / step));
  const stepX = bounds.width / width;
  const stepY = bounds.height / height;
  const values = new Float32Array(width * height);

  for (let row = 0; row < height; row += 1) {
    const y = bounds.y + (row + 0.5) * stepY;
    for (let col = 0; col < width; col += 1) {
      values[row * width + col] = contains(bounds.x + (col + 0.5) * stepX, y) ? Infinity : 0;
    }
  }

  // Two-pass chamfer transform. Texels past the map border count as outside.
  const at = (col, row) => (col < 0 || row < 0 || col >= width || row >= height ? 0 : values[row * width + col]);
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const index = row * width + col;
      if (values[index] === 0) continue;
      values[index] = Math.min(
        values[index],
        at(col - 1, row) + 1,
        at(col, row - 1) + 1,
        at(col - 1, row - 1) + DIAGONAL,
        at(col + 1, row - 1) + DIAGONAL,
      );
    }
  }
  let deepest = 0;
  for (let row = height - 1; row >= 0; row -= 1) {
    for (let col = width - 1; col >= 0; col -= 1) {
      const index = row * width + col;
      if (values[index] === 0) continue;
      values[index] = Math.min(
        values[index],
        at(col + 1, row) + 1,
        at(col, row + 1) + 1,
        at(col + 1, row + 1) + DIAGONAL,
        at(col - 1, row + 1) + DIAGONAL,
      );
      deepest = Math.max(deepest, values[index]);
    }
  }

  if (deepest > 0) {
    for (let i = 0; i < values.length; i += 1) values[i] /= deepest;
  }
  return { width, height, values };
}

/** RGBA bytes for a GPU texture; the depth sits in the red channel. */
export function edgeDepthToRgba(depth) {
  const bytes = new Uint8Array(depth.width * depth.height * 4);
  for (let i = 0; i < depth.values.length; i += 1) {
    const value = Math.round(Math.min(1, Math.max(0, depth.values[i])) * 255);
    bytes[i * 4] = value;
    bytes[i * 4 + 1] = value;
    bytes[i * 4 + 2] = value;
    bytes[i * 4 + 3] = 255;
  }
  return bytes;
}
