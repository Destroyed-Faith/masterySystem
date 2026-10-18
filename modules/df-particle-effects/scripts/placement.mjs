import { ARRANGEMENT_SINGLE, FLAMES_PER_CELL_AT_FULL_DENSITY } from "./constants.mjs";
import { clamp } from "./geometry.mjs";
import { mulberry32 } from "./random.mjs";

export function desiredFlameCount(area, cellArea, density) {
  if (!(area > 0) || !(density > 0)) return 0;
  const cells = area / Math.max(1, cellArea);
  const raw = cells * FLAMES_PER_CELL_AT_FULL_DENSITY * (clamp(density, 0, 100) / 100);
  return Math.max(1, Math.round(raw));
}

export function desiredEmberCount(flameCount, emberAmount) {
  if (!(flameCount > 0) || !(emberAmount > 0)) return 0;
  return Math.max(1, Math.round(flameCount * (clamp(emberAmount, 0, 100) / 100) * 1.75));
}

export function wantedFlameCount(config, area, cellArea) {
  if (config?.arrangement === ARRANGEMENT_SINGLE) return 1;
  return desiredFlameCount(area, cellArea, config?.density ?? 0);
}

export function wantedEmberCount(config, flameCount) {
  const amount = clamp(config?.emberAmount ?? 0, 0, 100);
  if (!(amount > 0)) return 0;
  if (config?.arrangement === ARRANGEMENT_SINGLE) return Math.max(1, Math.round((amount / 100) * 12));
  return desiredEmberCount(flameCount, amount);
}

/**
 * One base point inside the region, nearest the center. A hole at the center is skipped.
 */
export function planSingleFlameSite(options) {
  const bounds = options.bounds;
  const contains = options.contains;
  if (!bounds || !(bounds.width > 0) || !(bounds.height > 0) || typeof contains !== "function") return [];
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const found = contains(center.x, center.y) ? center : searchInterior(bounds, contains, options.seed);
  if (!found) return [];
  const edgeFactor = typeof options.edgeFactor === "function" ? options.edgeFactor : () => 1;
  return [{
    x: found.x,
    y: found.y,
    edge: clamp(Number(edgeFactor(found.x, found.y)) || 0, 0, 1),
  }];
}

function searchInterior(bounds, contains, seed) {
  const rng = mulberry32((seed ?? 1) >>> 0);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  for (let ring = 1; ring <= 8; ring += 1) {
    const rx = (bounds.width / 2) * (ring / 8);
    const ry = (bounds.height / 2) * (ring / 8);
    for (let step = 0; step < 24; step += 1) {
      const angle = (step / 24) * Math.PI * 2 + rng() * 0.04;
      const x = cx + Math.cos(angle) * rx;
      const y = cy + Math.sin(angle) * ry;
      if (contains(x, y)) return { x, y };
    }
  }
  return null;
}

/**
 * Largest-remainder allocation so a scene cap is shared across regions.
 * @param {number[]} counts
 * @param {number} cap
 * @returns {number[]}
 */
export function allocateBudget(counts, cap) {
  const safeCap = Math.max(0, Math.floor(cap));
  const out = counts.map((count) => Math.max(0, Math.floor(count)));
  const sum = out.reduce((total, count) => total + count, 0);
  if (sum <= safeCap) return out;
  if (safeCap === 0) return out.map(() => 0);

  const scale = safeCap / sum;
  const floored = out.map((count) => Math.floor(count * scale));
  let used = floored.reduce((total, count) => total + count, 0);
  const remainders = out
    .map((count, index) => ({ index, remainder: count * scale - floored[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const item of remainders) {
    if (used >= safeCap) break;
    floored[item.index] += 1;
    used += 1;
  }
  return floored;
}

/**
 * Seeded, irregular flame sites inside `contains`. Spacing follows the region area,
 * not a visible grid. `maxFlames` is the quality cap for this region.
 */
export function planFlameSites(options) {
  const bounds = options.bounds;
  const density = Number(options.density) || 0;
  const maxFlames = Math.max(0, Math.floor(options.maxFlames ?? 0));
  const contains = options.contains;
  if (!bounds || !(bounds.width > 0) || !(bounds.height > 0) || typeof contains !== "function") {
    return [];
  }

  const wanted = Math.min(maxFlames, desiredFlameCount(options.area, options.cellArea, density));
  if (wanted <= 0) return [];

  const cell = Math.max(1, Number(options.cellArea) || 1);
  const spacing = Math.max(Math.sqrt(cell) * 0.42, Math.sqrt(options.area / wanted) * 0.78);
  const rng = mulberry32(options.seed >>> 0);
  const sites = poissonSites({ bounds, contains, spacing, wanted, rng, attempts: 18 });

  if (sites.length < wanted) {
    const relaxed = spacing * 0.55;
    const relaxedSquared = relaxed * relaxed;
    const guard = wanted * 50;
    let tries = 0;
    while (sites.length < wanted && tries < guard) {
      tries += 1;
      const x = bounds.x + rng() * bounds.width;
      const y = bounds.y + rng() * bounds.height;
      if (!contains(x, y)) continue;
      if (sites.some((site) => distanceSquared(site, x, y) < relaxedSquared)) continue;
      sites.push({ x, y });
    }
  }

  const edgeFactor = typeof options.edgeFactor === "function" ? options.edgeFactor : () => 1;
  return sites.map((site) => ({
    x: site.x,
    y: site.y,
    edge: clamp(Number(edgeFactor(site.x, site.y)) || 0, 0, 1),
  }));
}

function poissonSites({ bounds, contains, spacing, wanted, rng, attempts }) {
  const points = [];
  const active = [];
  const cell = spacing / Math.SQRT2;
  const gridWidth = Math.max(1, Math.ceil(bounds.width / cell));
  const gridHeight = Math.max(1, Math.ceil(bounds.height / cell));
  const grid = new Array(gridWidth * gridHeight).fill(-1);
  const minSquared = spacing * spacing;

  const gridIndex = (x, y) => {
    const gx = Math.floor((x - bounds.x) / cell);
    const gy = Math.floor((y - bounds.y) / cell);
    if (gx < 0 || gy < 0 || gx >= gridWidth || gy >= gridHeight) return -1;
    return gy * gridWidth + gx;
  };

  const tooClose = (x, y) => {
    const gx = Math.floor((x - bounds.x) / cell);
    const gy = Math.floor((y - bounds.y) / cell);
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const ix = gx + ox;
        const iy = gy + oy;
        if (ix < 0 || iy < 0 || ix >= gridWidth || iy >= gridHeight) continue;
        const pointIndex = grid[iy * gridWidth + ix];
        if (pointIndex < 0) continue;
        if (distanceSquared(points[pointIndex], x, y) < minSquared) return true;
      }
    }
    return false;
  };

  const add = (x, y) => {
    const index = points.length;
    points.push({ x, y });
    active.push(index);
    const slot = gridIndex(x, y);
    if (slot >= 0) grid[slot] = index;
  };

  for (let n = 0; n < 100 && active.length === 0; n += 1) {
    const x = bounds.x + rng() * bounds.width;
    const y = bounds.y + rng() * bounds.height;
    if (contains(x, y)) add(x, y);
  }
  if (!active.length) return points;

  let guard = wanted * attempts * 6;
  while (active.length && points.length < wanted && guard > 0) {
    guard -= 1;
    const activeIndex = Math.floor(rng() * active.length);
    const base = points[active[activeIndex]];
    let placed = false;
    for (let k = 0; k < attempts; k += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = spacing * (1 + rng());
      const x = base.x + Math.cos(angle) * radius;
      const y = base.y + Math.sin(angle) * radius;
      if (x < bounds.x || y < bounds.y || x > bounds.x + bounds.width || y > bounds.y + bounds.height) continue;
      if (!contains(x, y) || tooClose(x, y)) continue;
      add(x, y);
      placed = true;
      break;
    }
    if (!placed) active.splice(activeIndex, 1);
  }

  return points;
}

function distanceSquared(point, x, y) {
  const dx = point.x - x;
  const dy = point.y - y;
  return dx * dx + dy * dy;
}
