import {
  RESTRAINT_SERPENT,
  RESTRAINT_VINES,
  SERPENT_MOTION_COIL,
  STRAND_LAYOUT_COILED,
  STRAND_LAYOUT_CURVED,
  STRAND_LAYOUT_RANDOM,
} from "./constants.mjs";
import { clamp } from "./geometry.mjs";
import { mulberry32 } from "./random.mjs";

const TAU = Math.PI * 2;
const MAX_POINTS = 160;

/**
 * Edge distance in world pixels at a world point, read bilinearly from the depth map.
 * Outside the bounds it is 0.
 */
export function createDepthSampler(depth, bounds) {
  const { width, height, values } = depth;
  const scale = Number(depth.maxDistance) || 0;
  const at = (col, row) => (col < 0 || row < 0 || col >= width || row >= height ? 0 : values[row * width + col]);
  return (x, y) => {
    const fx = ((x - bounds.x) / bounds.width) * width - 0.5;
    const fy = ((y - bounds.y) / bounds.height) * height - 0.5;
    if (!(fx > -1 && fy > -1 && fx < width && fy < height)) return 0;
    const col = Math.floor(fx);
    const row = Math.floor(fy);
    const tx = fx - col;
    const ty = fy - row;
    const top = at(col, row) * (1 - tx) + at(col + 1, row) * tx;
    const bottom = at(col, row + 1) * (1 - tx) + at(col + 1, row + 1) * tx;
    return (top * (1 - ty) + bottom * ty) * scale;
  };
}

/** Center of the depth texel farthest from any region edge. */
export function deepestPoint(depth, bounds) {
  let best = -1;
  let index = 0;
  for (let i = 0; i < depth.values.length; i += 1) {
    if (depth.values[i] > best) {
      best = depth.values[i];
      index = i;
    }
  }
  const col = index % depth.width;
  const row = Math.floor(index / depth.width);
  return {
    x: bounds.x + ((col + 0.5) / depth.width) * bounds.width,
    y: bounds.y + ((row + 0.5) / depth.height) * bounds.height,
  };
}

/** Points at an even arc-length spacing along a polyline ([[x, y], ...]). */
export function resamplePath(points, spacing, maxPoints = MAX_POINTS) {
  if (points.length < 2) return points.map((p) => [p[0], p[1]]);
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  if (!(total > 0)) return [[points[0][0], points[0][1]]];
  const count = Math.max(2, Math.min(maxPoints, Math.round(total / Math.max(spacing, 0.001)) + 1));
  const step = total / (count - 1);
  const out = [[points[0][0], points[0][1]]];
  let segment = 1;
  let segmentStart = 0;
  let segmentLength = Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1]);
  for (let i = 1; i < count - 1; i += 1) {
    const target = i * step;
    while (segment < points.length - 1 && segmentStart + segmentLength < target) {
      segmentStart += segmentLength;
      segment += 1;
      segmentLength = Math.hypot(points[segment][0] - points[segment - 1][0], points[segment][1] - points[segment - 1][1]);
    }
    const t = segmentLength > 0 ? (target - segmentStart) / segmentLength : 0;
    const a = points[segment - 1];
    const b = points[segment];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  const last = points[points.length - 1];
  out.push([last[0], last[1]]);
  return out;
}

export function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return total;
}

/** Unit normals of a polyline (left of the direction of travel). */
export function pathNormals(points) {
  return points.map((_, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const length = Math.hypot(dx, dy) || 1;
    return [-dy / length, dx / length];
  });
}

/**
 * Where the strands of a style lie. Everything is seeded, so a region always gets the
 * same layout.
 *
 * @param {object} options
 * @param {string} options.style
 * @param {object} options.config from readConfig
 * @param {{ x: number, y: number, width: number, height: number }} options.bounds
 * @param {{ width: number, height: number, values: Float32Array, maxDistance: number }} options.depth
 * @param {number} options.cellSize
 * @param {number} options.halfWidth strand half width in world pixels
 * @param {number} options.seed
 * @returns {Array<object>} strands with `path` ([[x, y], ...]) and style data
 */
export function planStrands({ style, config, bounds, depth, cellSize, halfWidth, seed }) {
  const ctx = makeContext({ bounds, depth, cellSize, halfWidth, seed });
  if (style === RESTRAINT_VINES) return planVines(ctx, config);
  if (style === RESTRAINT_SERPENT) return planSerpents(ctx, config);
  return planLines(ctx, config.strandLayout, clamp(Math.round(config.strandCount ?? 3), 1, 5));
}

function makeContext({ bounds, depth, cellSize, halfWidth, seed }) {
  const cell = Math.max(1, cellSize);
  const depthAt = createDepthSampler(depth, bounds);
  const reach = Math.max(Number(depth.maxDistance) || 0, 1);
  return {
    bounds,
    depthAt,
    cell,
    halfWidth,
    reach,
    hub: deepestPoint(depth, bounds),
    margin: Math.min(reach * 0.45, halfWidth * 1.5 + cell * 0.12),
    rng: mulberry32(seed ^ 0x5f3759df),
    spacing: Math.max(halfWidth * 1.6, cell * 0.1),
  };
}

/** Depth gradient (points inward) by central differences. */
function inward(ctx, x, y) {
  const e = ctx.cell * 0.15;
  const gx = ctx.depthAt(x + e, y) - ctx.depthAt(x - e, y);
  const gy = ctx.depthAt(x, y + e) - ctx.depthAt(x, y - e);
  const length = Math.hypot(gx, gy);
  return length > 1e-6 ? [gx / length, gy / length] : [0, 0];
}

/** From (x, y) step along (dx, dy) while the strand still fits inside. */
function march(ctx, x, y, dx, dy) {
  const step = ctx.cell * 0.08;
  let px = x;
  let py = y;
  for (let i = 0; i < 2000; i += 1) {
    const nx = px + dx * step;
    const ny = py + dy * step;
    if (ctx.depthAt(nx, ny) < ctx.margin) break;
    px = nx;
    py = ny;
  }
  return [px, py];
}

/** A random interior point at least `clearance` from the edge, or the hub. */
function interiorPoint(ctx, clearance, avoid = []) {
  const { bounds, rng } = ctx;
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 60; i += 1) {
    const x = bounds.x + rng() * bounds.width;
    const y = bounds.y + rng() * bounds.height;
    if (ctx.depthAt(x, y) < clearance) continue;
    const score = avoid.length ? Math.min(...avoid.map((p) => Math.hypot(p[0] - x, p[1] - y))) : rng();
    if (score > bestScore) {
      bestScore = score;
      best = [x, y];
    }
  }
  return best ?? [ctx.hub.x, ctx.hub.y];
}

function planLines(ctx, layout, count) {
  const strands = [];
  const base = ctx.rng() * Math.PI;
  const centers = [];
  for (let i = 0; i < count; i += 1) {
    let path;
    if (layout === STRAND_LAYOUT_COILED) path = coilPath(ctx, centers);
    else if (layout === STRAND_LAYOUT_RANDOM) path = wanderPath(ctx, 0.5, Math.min(ctx.cell * 12, Math.max(ctx.cell * 3, ctx.reach * 2.4)));
    else path = crossingPath(ctx, base + (Math.PI * i) / count + (ctx.rng() - 0.5) * 0.35, layout === STRAND_LAYOUT_CURVED);
    if (!path || pathLength(path) < ctx.cell * 0.4) continue;
    strands.push({ path: resamplePath(path, ctx.spacing), coilCenter: path.coilCenter ?? null });
  }
  if (!strands.length) {
    const path = crossingPath(ctx, base, false);
    if (path && pathLength(path) > ctx.halfWidth * 2) strands.push({ path: resamplePath(path, ctx.spacing), coilCenter: null });
  }
  return strands;
}

/** A line across the region near the hub, straight or bent into a slack arc. */
function crossingPath(ctx, angle, curved) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const shift = (ctx.rng() - 0.5) * Math.min(ctx.cell * 1.4, ctx.reach * 0.7);
  let cx = ctx.hub.x - dy * shift;
  let cy = ctx.hub.y + dx * shift;
  if (ctx.depthAt(cx, cy) < ctx.margin * 1.2) {
    cx = ctx.hub.x;
    cy = ctx.hub.y;
  }
  const a = march(ctx, cx, cy, -dx, -dy);
  const b = march(ctx, cx, cy, dx, dy);
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!(length > 0)) return null;
  if (!curved) return [a, b];
  const side = ctx.rng() < 0.5 ? -1 : 1;
  for (let bulge = 0.24; bulge > 0.02; bulge *= 0.5) {
    const points = [];
    for (let i = 0; i <= 24; i += 1) {
      const t = i / 24;
      const lift = 4 * t * (1 - t) * bulge * length * side;
      points.push([a[0] + (b[0] - a[0]) * t - dy * lift, a[1] + (b[1] - a[1]) * t + dx * lift]);
    }
    if (points.every((p) => ctx.depthAt(p[0], p[1]) >= ctx.margin * 0.7)) return points;
  }
  return [a, b];
}

/** A tail from the edge into a flat coil, spiralling inward. */
function coilPath(ctx, centers) {
  const turnGap = ctx.halfWidth * 2.25;
  const wanted = Math.max(ctx.cell * 0.75, turnGap * 3);
  const center = interiorPoint(ctx, Math.min(ctx.reach * 0.8, wanted + ctx.margin), centers);
  centers.push(center);
  const room = Math.max(turnGap * 1.5, ctx.depthAt(center[0], center[1]) - ctx.margin);
  const outer = Math.min(wanted * (0.85 + ctx.rng() * 0.3), room);
  const inner = Math.min(outer * 0.6, turnGap * 1.1);
  const turns = Math.max(0.75, (outer - inner) / turnGap);
  const spin = ctx.rng() < 0.5 ? 1 : -1;
  const start = ctx.rng() * TAU;
  const spiral = [];
  const steps = Math.ceil(turns * 40);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const radius = outer - (outer - inner) * t;
    const a = start + spin * t * turns * TAU;
    spiral.push([center[0] + Math.cos(a) * radius, center[1] + Math.sin(a) * radius]);
  }
  const [ox, oy] = spiral[0];
  let out = [ox - center[0], oy - center[1]];
  const normal = Math.hypot(out[0], out[1]) || 1;
  out = [out[0] / normal, out[1] / normal];
  const tangent = [-out[1] * spin, out[0] * spin];
  const tailDir = [out[0] * 0.6 - tangent[0] * 0.8, out[1] * 0.6 - tangent[1] * 0.8];
  const tailLength = ctx.cell * (0.9 + ctx.rng() * 0.8);
  const tail = [];
  let px = ox;
  let py = oy;
  let heading = Math.atan2(tailDir[1], tailDir[0]);
  for (let walked = 0; walked < tailLength; walked += ctx.cell * 0.1) {
    const nx = px + Math.cos(heading) * ctx.cell * 0.1;
    const ny = py + Math.sin(heading) * ctx.cell * 0.1;
    if (ctx.depthAt(nx, ny) < ctx.margin) break;
    px = nx;
    py = ny;
    heading += (ctx.rng() - 0.5) * 0.25;
    tail.push([px, py]);
  }
  const path = [...tail.reverse(), ...spiral];
  path.coilCenter = center;
  return path;
}

/**
 * A meandering walk from near the edge toward the middle that turns back before
 * it leaves the region. `wobble` 0..1 is how much it wanders.
 */
function wanderPath(ctx, wobble, length, { start = null, goal = null } = {}) {
  const { rng } = ctx;
  for (let i = 0; i < 80 && !start; i += 1) {
    const x = ctx.bounds.x + rng() * ctx.bounds.width;
    const y = ctx.bounds.y + rng() * ctx.bounds.height;
    const d = ctx.depthAt(x, y);
    if (d >= ctx.margin && d <= ctx.margin + ctx.cell * 0.8) start = [x, y];
  }
  start ??= interiorPoint(ctx, ctx.margin);
  const aim = goal ?? [ctx.hub.x, ctx.hub.y];
  const step = ctx.cell * 0.1;
  let [px, py] = start;
  let heading = Math.atan2(aim[1] - py, aim[0] - px) + (rng() - 0.5) * (goal ? 0.5 : 1.2);
  let turn = 0;
  const points = [[px, py]];
  for (let walked = 0; walked < length; walked += step) {
    turn = turn * 0.92 + (rng() - 0.5) * 0.12 * (0.3 + wobble * 1.7);
    heading += turn;
    if (goal && Math.hypot(goal[0] - px, goal[1] - py) > ctx.cell * 0.5) {
      heading += wrapAngle(Math.atan2(goal[1] - py, goal[0] - px) - heading) * 0.04;
    }
    let nx = px + Math.cos(heading) * step;
    let ny = py + Math.sin(heading) * step;
    if (ctx.depthAt(nx, ny) < ctx.margin * 1.6) {
      const [ix, iy] = inward(ctx, px, py);
      const target = Math.atan2(iy, ix);
      heading += wrapAngle(target - heading) * 0.35;
      turn *= 0.5;
      nx = px + Math.cos(heading) * step;
      ny = py + Math.sin(heading) * step;
      if (ctx.depthAt(nx, ny) < ctx.margin) break;
    }
    px = nx;
    py = ny;
    points.push([px, py]);
  }
  return points;
}

function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/**
 * Bundles of two or three vines twisted around a wandering guide, rooted near the
 * edge, plus short curling tendrils. Each point carries a depth shade so strands
 * read as winding over and under each other.
 */
function planVines(ctx, config) {
  const density = clamp(Number(config.restraintDensity ?? 80), 0, 100) / 100;
  const variation = clamp(Number(config.vineVariation ?? 50), 0, 100) / 100;
  const twist = clamp(Number(config.vineTwist ?? 50), 0, 100) / 100;
  const bundles = 2 + Math.round(density * 5);
  const core = ctx.halfWidth * 0.6;
  const strands = [];
  const turnStart = ctx.rng() * TAU;
  for (let b = 0; b < bundles; b += 1) {
    const angle = turnStart + (TAU * (b + (ctx.rng() - 0.5) * 0.5)) / bundles;
    const root = march(ctx, ctx.hub.x, ctx.hub.y, Math.cos(angle), Math.sin(angle));
    const across = angle + Math.PI + (ctx.rng() - 0.5) * 1.4;
    const goal = march(ctx, ctx.hub.x, ctx.hub.y, Math.cos(across), Math.sin(across));
    const guideLength = Math.min(ctx.cell * 12, Math.max(ctx.cell * 2.5, ctx.reach * (1.5 + ctx.rng() * 0.8)));
    const wander = wanderPath(ctx, 0.05 + variation * 0.3, guideLength, { start: root, goal });
    const guide = resamplePath(wander, ctx.cell * 0.08, 400);
    if (guide.length < 4) continue;
    const normals = pathNormals(guide);
    const count = ctx.rng() < 0.55 ? 2 : 3;
    const frequency = (TAU * (0.15 + 1.1 * twist)) / ctx.cell;
    const amplitude = core * (1.2 + 1.2 * twist);
    for (let j = 0; j < count; j += 1) {
      const phase = (j * TAU) / count + ctx.rng() * 0.6;
      const wobblePhase = ctx.rng() * TAU;
      const wobbleFreq = TAU / (ctx.cell * (0.8 + ctx.rng()));
      const width = 0.75 + ctx.rng() * 0.35;
      const path = [];
      const shade = [];
      let s = 0;
      for (let i = 0; i < guide.length; i += 1) {
        if (i > 0) s += Math.hypot(guide[i][0] - guide[i - 1][0], guide[i][1] - guide[i - 1][1]);
        const offset = amplitude * Math.sin(s * frequency + phase)
          + variation * ctx.cell * 0.07 * Math.sin(s * wobbleFreq + wobblePhase);
        path.push([guide[i][0] + normals[i][0] * offset, guide[i][1] + normals[i][1] * offset]);
        shade.push(0.72 + 0.28 * Math.cos(s * frequency + phase));
      }
      const strand = { path: resamplePath(path, ctx.spacing), width, kind: "vine" };
      strand.shade = resampleScalar(shade, strand.path.length);
      strands.push(strand);
    }
    const tendrils = 1 + Math.round(density * 2 + ctx.rng());
    for (let t = 0; t < tendrils; t += 1) {
      const at = Math.floor((0.2 + ctx.rng() * 0.7) * (guide.length - 1));
      const tendril = curlPath(ctx, guide[at], normals[at], variation);
      if (tendril.length < 3) continue;
      strands.push({ path: resamplePath(tendril, ctx.spacing * 0.8), width: 0.5 + ctx.rng() * 0.15, kind: "tendril" });
    }
  }
  return strands;
}

/** A short side shoot that curls up at its tip. */
function curlPath(ctx, origin, normal, variation) {
  const side = ctx.rng() < 0.5 ? -1 : 1;
  let heading = Math.atan2(normal[1] * side, normal[0] * side) + (ctx.rng() - 0.5) * 0.8;
  const length = ctx.cell * (0.5 + ctx.rng() * 0.9);
  const curl = side * (1.1 + variation * 1.4) / length;
  const step = ctx.cell * 0.06;
  let [px, py] = origin;
  const points = [[px, py]];
  for (let walked = 0; walked < length; walked += step) {
    heading += curl * step * (walked / length) * 2.2;
    const nx = px + Math.cos(heading) * step;
    const ny = py + Math.sin(heading) * step;
    if (ctx.depthAt(nx, ny) < ctx.margin * 0.6) break;
    px = nx;
    py = ny;
    points.push([px, py]);
  }
  return points;
}

function resampleScalar(values, count) {
  const out = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const f = (i / Math.max(1, count - 1)) * (values.length - 1);
    const lo = Math.floor(f);
    const hi = Math.min(values.length - 1, lo + 1);
    out[i] = values[lo] + (values[hi] - values[lo]) * (f - lo);
  }
  return out;
}

/**
 * Serpents. Slither: each gets a closed wavy track inside the region that its body
 * slides along. Coil: each gets a center to lie coiled around.
 */
function planSerpents(ctx, config) {
  const count = clamp(Math.round(config.serpentCount ?? 1), 1, 5);
  const coil = config.serpentMotion === SERPENT_MOTION_COIL;
  const bodyLength = clamp(ctx.reach * 2.4, ctx.cell * 4, ctx.cell * 10);
  const serpents = [];
  const centers = [];
  for (let i = 0; i < count; i += 1) {
    if (coil) {
      const gap = ctx.halfWidth * 2.05;
      const radius = Math.sqrt((bodyLength * gap) / Math.PI) + gap;
      const center = interiorPoint(ctx, Math.min(ctx.reach * 0.85, radius + ctx.margin), centers);
      centers.push(center);
      const room = Math.max(gap * 2, ctx.depthAt(center[0], center[1]) - ctx.margin);
      const fit = Math.min(bodyLength, (Math.PI * Math.max(0, room - gap) ** 2) / gap);
      serpents.push({ kind: "coil", center, gap, length: Math.max(ctx.cell * 1.5, fit), phase: ctx.rng() * TAU, spin: ctx.rng() < 0.5 ? 1 : -1 });
      continue;
    }
    const track = serpentTrack(ctx);
    if (!track) continue;
    const length = Math.min(bodyLength, pathLength(track) * 0.6);
    serpents.push({ kind: "track", track, length, offset: ctx.rng() * pathLength(track) });
  }
  return serpents;
}

/**
 * A closed loop through a few interior waypoints, with a standing wave on it. The
 * wave is in the track itself, so the body bends where the head bent.
 */
function serpentTrack(ctx) {
  const wave = ctx.halfWidth * 1.6;
  const clearance = ctx.margin + wave;
  const waypoints = [];
  const count = 4 + Math.floor(ctx.rng() * 3);
  for (let i = 0; i < count * 4 && waypoints.length < count; i += 1) {
    const p = interiorPoint(ctx, clearance + ctx.cell * 0.2, waypoints);
    if (ctx.depthAt(p[0], p[1]) >= clearance) waypoints.push(p);
  }
  if (waypoints.length < 3) return null;
  const cx = waypoints.reduce((sum, p) => sum + p[0], 0) / waypoints.length;
  const cy = waypoints.reduce((sum, p) => sum + p[1], 0) / waypoints.length;
  waypoints.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  const smooth = [];
  for (let i = 0; i < waypoints.length; i += 1) {
    const p0 = waypoints[(i - 1 + waypoints.length) % waypoints.length];
    const p1 = waypoints[i];
    const p2 = waypoints[(i + 1) % waypoints.length];
    const p3 = waypoints[(i + 2) % waypoints.length];
    for (let k = 0; k < 24; k += 1) smooth.push(catmullRom(p0, p1, p2, p3, k / 24));
  }
  smooth.push([...smooth[0]]);
  const base = resamplePath(smooth, ctx.cell * 0.04, 4000);
  const total = pathLength(base);
  if (!(total > ctx.cell)) return null;
  const waves = Math.max(2, Math.round(total / (ctx.halfWidth * 9)));
  const normals = pathNormals(base);
  let s = 0;
  const wavy = base.map((p, i) => {
    if (i > 0) s += Math.hypot(p[0] - base[i - 1][0], p[1] - base[i - 1][1]);
    let offset = wave * Math.sin((s / total) * waves * TAU);
    const room = ctx.depthAt(p[0], p[1]) - ctx.margin;
    offset = clamp(offset, -Math.max(0, room), Math.max(0, room));
    return [p[0] + normals[i][0] * offset, p[1] + normals[i][1] * offset];
  });
  wavy[wavy.length - 1] = [...wavy[0]];
  return resamplePath(wavy, ctx.cell * 0.03, 6000);
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}
