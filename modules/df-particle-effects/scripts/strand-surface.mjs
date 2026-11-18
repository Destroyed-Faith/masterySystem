import { LOG_PREFIX } from "./constants.mjs";
import { pixiMajorVersion } from "./fire-surface-shader.mjs";
import { STRAND_FRAGMENT, STRAND_VERTEX } from "./strand-shader.mjs";

/**
 * Write one strand as a triangle strip: two vertices per point, offset along the
 * point's normal by its half width. Points after `last` get no width.
 *
 * @param {object} out { positions, uvs, info } Float32Arrays shared by all strands
 * @param {number} first first vertex of this strand
 * @param {ArrayLike<number>} points x, y pairs
 * @param {number} count points in the strand
 * @param {number} last last shown point
 * @param {number} halfWidth world pixels
 * @param {ArrayLike<number>} profile width factor per point
 * @param {ArrayLike<number>|null} shade depth shade per point
 * @param {number} unit world pixels per texture unit along the strand
 */
export function writeStrip(out, first, points, count, last, halfWidth, profile, shade, unit) {
  const { positions, uvs, info } = out;
  let arc = 0;
  let nx = 0;
  let ny = 1;
  const end = Math.min(last, count - 1);
  for (let i = 0; i < count; i += 1) {
    const at = Math.min(i, end);
    const x = points[at * 2];
    const y = points[at * 2 + 1];
    if (i > 0 && i <= end) arc += Math.hypot(x - points[(at - 1) * 2], y - points[(at - 1) * 2 + 1]);
    const before = Math.max(0, at - 1);
    const after = Math.min(end, at + 1);
    const tx = points[after * 2] - points[before * 2];
    const ty = points[after * 2 + 1] - points[before * 2 + 1];
    const length = Math.hypot(tx, ty);
    if (length > 1e-6) {
      nx = -ty / length;
      ny = tx / length;
    }
    const w = i <= end ? halfWidth * profile[i] : 0;
    const v = (first + i * 2) * 2;
    positions[v] = x + nx * w;
    positions[v + 1] = y + ny * w;
    positions[v + 2] = x - nx * w;
    positions[v + 3] = y - ny * w;
    const u = arc / unit;
    uvs[v] = u;
    uvs[v + 1] = 0;
    uvs[v + 2] = u;
    uvs[v + 3] = 1;
    const depthShade = shade ? shade[i] : 1;
    const along = i / Math.max(1, count - 1);
    info[v] = depthShade;
    info[v + 1] = along;
    info[v + 2] = depthShade;
    info[v + 3] = along;
  }
}

/** Triangle indices for strips of the given point counts, laid out one after another. */
export function stripIndices(counts) {
  const vertices = counts.reduce((sum, n) => sum + n * 2, 0);
  const triangles = counts.reduce((sum, n) => sum + Math.max(0, n - 1) * 6, 0);
  const indices = vertices > 65535 ? new Uint32Array(triangles) : new Uint16Array(triangles);
  let base = 0;
  let k = 0;
  for (const n of counts) {
    for (let i = 0; i < n - 1; i += 1) {
      const v = base + i * 2;
      indices[k++] = v;
      indices[k++] = v + 1;
      indices[k++] = v + 2;
      indices[k++] = v + 1;
      indices[k++] = v + 3;
      indices[k++] = v + 2;
    }
    base += n * 2;
  }
  return indices;
}

/**
 * All strands of one region in one mesh, plus a dark offset copy below it as the
 * shadow. Each frame the drivers give new points and the strips are rewritten.
 *
 * @param {object} PIXI
 * @param {Array<{ count: number, profile: Float32Array, shade: Float32Array|null,
 *   pose(time: number, elapsed: number, amount: number): { points: ArrayLike<number>, last: number } }>} drivers
 * @param {{ styleId: number, halfWidth: number, cell: number, label: string }} options
 */
export function createStrandSurface(PIXI, drivers, { styleId, halfWidth, cell, label }) {
  if (pixiMajorVersion(PIXI) !== 7) {
    console.warn(`${LOG_PREFIX} ${label} strands support PixiJS 7 only (found ${PIXI?.VERSION ?? "none"}).`);
    return null;
  }
  if (!PIXI.Mesh || !PIXI.MeshGeometry || !PIXI.Shader?.from || !PIXI.Container) {
    console.warn(`${LOG_PREFIX} PIXI.Mesh/MeshGeometry/Shader.from unavailable for ${label}.`);
    return null;
  }
  if (!drivers.length) return null;

  const counts = drivers.map((driver) => driver.count);
  const vertices = counts.reduce((sum, n) => sum + n * 2, 0);
  const out = {
    positions: new Float32Array(vertices * 2),
    uvs: new Float32Array(vertices * 2),
    info: new Float32Array(vertices * 2),
  };
  const firsts = [];
  counts.reduce((first, n) => {
    firsts.push(first);
    return first + n * 2;
  }, 0);

  const uniforms = (shadow) => ({
    uStyle: styleId,
    uColor: new Float32Array([1, 1, 1]),
    uOpacity: 0.9,
    uShadow: shadow ? 1 : 0,
    uDetail: 0.5,
    uSeed: 0.5,
  });
  let container;
  let geometry;
  try {
    geometry = new PIXI.MeshGeometry(out.positions, out.uvs, stripIndices(counts));
    geometry.addAttribute("aInfo", out.info, 2);
    for (const name of ["aVertexPosition", "aTextureCoord", "aInfo"]) {
      const buffer = geometry.getBuffer?.(name);
      if (buffer) buffer.static = false;
    }
    const shadow = new PIXI.Mesh(geometry, PIXI.Shader.from(STRAND_VERTEX, STRAND_FRAGMENT, uniforms(true)));
    const body = new PIXI.Mesh(geometry, PIXI.Shader.from(STRAND_VERTEX, STRAND_FRAGMENT, uniforms(false)));
    const drop = halfWidth * 0.45 + cell * 0.02;
    shadow.position.set(drop * 0.7, drop);
    container = new PIXI.Container();
    for (const display of [container, shadow, body]) {
      display.eventMode = "none";
      display.interactiveChildren = false;
    }
    container.addChild(shadow, body);
  } catch (error) {
    console.warn(`${LOG_PREFIX} ${label} strand mesh could not be created.`, error);
    container?.destroy?.({ children: true });
    geometry?.destroy?.();
    return null;
  }

  const [shadow, body] = container.children;
  const unit = Math.max(0.5, halfWidth * 2);
  console.info(`${LOG_PREFIX} ${label} strands ready (${drivers.length} strands, ${vertices} vertices).`);
  return {
    api: "strands",
    display: container,
    update(state) {
      drivers.forEach((driver, index) => {
        const { points, last } = driver.pose(state.time, state.elapsed, state.amount);
        writeStrip(out, firsts[index], points, driver.count, last, halfWidth, driver.profile, driver.shade, unit);
      });
      for (const name of ["aVertexPosition", "aTextureCoord", "aInfo"]) geometry.getBuffer?.(name)?.update?.();
      for (const mesh of [shadow, body]) {
        const u = mesh.shader.uniforms;
        u.uOpacity = state.opacity;
        u.uDetail = state.detail;
        u.uSeed = state.seed;
        u.uColor[0] = state.color[0];
        u.uColor[1] = state.color[1];
        u.uColor[2] = state.color[2];
      }
    },
    destroy() {
      if (!container.destroyed) container.destroy({ children: true });
      geometry.destroy?.();
    },
  };
}
