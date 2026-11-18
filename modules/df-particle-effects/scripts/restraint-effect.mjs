import {
  RESTRAINT_CHAINS,
  RESTRAINT_ROPE,
  RESTRAINT_SERPENT,
  RESTRAINT_VINES,
  RESTRAINT_WEB,
} from "./constants.mjs";
import { clamp } from "./geometry.mjs";
import { wallSeconds } from "./ice-effect.mjs";
import { mulberry32 } from "./random.mjs";
import { RegionShaderEffect } from "./region-effect.mjs";
import { resolveRestraintLook } from "./restraint-presets.mjs";
import { deepestPoint, planStrands } from "./strand-layout.mjs";
import { LineStrandMotion, SerpentMotion, VineMotion } from "./strand-motion.mjs";
import { STRAND_SHADER_STYLE } from "./strand-shader.mjs";
import { createStrandSurface } from "./strand-surface.mjs";
import { createWebSurface } from "./web-surface-shader.mjs";

/**
 * Restraint / Binding clipped to a region. Web is a surface shader; vines, rope,
 * chains and serpents are strands whose shape moves (strand-surface.mjs).
 */
export class RestraintEffect extends RegionShaderEffect {
  /**
   * @param {object} options see RegionShaderEffect, plus:
   * @param {{ width: number, height: number, values: Float32Array, maxDistance: number }} options.depth
   * @param {number} [options.startedAt] wall-clock second the strands appeared (-Infinity: already out)
   */
  constructor(options) {
    const look = resolveRestraintLook(options.config);
    super(options, (PIXI) => buildSurface(PIXI, options, look), `${look.style} restraint`);
    this.style = look.style;
    this.startedAt = options.startedAt ?? -Infinity;
    this.tick(0);
  }

  tick(time) {
    if (!this.surface) return;
    const look = resolveRestraintLook(this.config);
    const opacity = clamp(Number(this.config.opacity) || 0, 0, 1);
    if (this.style === RESTRAINT_WEB) {
      this.surface.update({
        ...this.regionState(),
        time,
        opacity,
        radials: clamp(Math.round(Number(this.config.webRadials) || 16), 5, 36),
        rings: clamp(Math.round(Number(this.config.webRings) || 12), 3, 40),
        coverage: clamp(Number(this.config.restraintDensity ?? 80), 0, 100) / 100,
        motion: look.motion,
        halfWidthCells: look.halfWidthCells,
        color: look.color,
      });
      return;
    }
    this.surface.update({
      time,
      elapsed: wallSeconds() - this.startedAt,
      amount: look.motion,
      opacity,
      color: look.color,
      detail: strandDetail(this.style, this.config),
      seed: this.regionState().seed,
    });
  }
}

function strandDetail(style, config) {
  if (style === RESTRAINT_SERPENT) return clamp(Number(config.serpentScales ?? 60), 0, 100) / 100;
  if (style === RESTRAINT_VINES) return clamp(Number(config.vineThorns ?? 30), 0, 100) / 100;
  return 0;
}

function buildSurface(PIXI, options, look) {
  if (look.style === RESTRAINT_WEB) {
    return createWebSurface(PIXI, options.bounds, options.depth, deepestPoint(options.depth, options.bounds));
  }
  const cell = Math.max(1, options.gridSize);
  const halfWidth = look.halfWidthCells * cell;
  const strands = planStrands({
    style: look.style,
    config: options.config,
    bounds: options.bounds,
    depth: options.depth,
    cellSize: cell,
    halfWidth,
    seed: options.seed >>> 0,
  });
  const drivers = strandDrivers(look.style, strands, options.config, cell, halfWidth, mulberry32((options.seed >>> 0) ^ 0x9e3779b9));
  return createStrandSurface(PIXI, drivers, {
    styleId: STRAND_SHADER_STYLE[look.style],
    halfWidth,
    cell,
    label: look.style,
  });
}

/** Per strand: point count, width profile, depth shade and a pose function. */
export function strandDrivers(style, strands, config, cell, halfWidth, rng) {
  if (style === RESTRAINT_SERPENT) {
    return strands.map((serpent) => {
      const motion = new SerpentMotion(serpent, { cell, halfWidth });
      return {
        count: motion.count,
        profile: profileOf(motion.count, serpentWidth),
        shade: null,
        pose: (time, elapsed, amount) => ({ points: motion.pose(time, amount), last: motion.count - 1 }),
      };
    });
  }
  if (style === RESTRAINT_VINES) {
    return strands.map((strand) => {
      const motion = new VineMotion(strand, { cell, phase: rng() });
      const tendril = strand.kind === "tendril";
      const scale = strand.width ?? 1;
      return {
        count: motion.count,
        profile: profileOf(motion.count, (t) => scale * (tendril ? 0.9 - 0.82 * t : 0.32 + 0.68 * (1 - t) ** 0.8)),
        shade: strand.shade ? Float32Array.from(strand.shade) : null,
        pose: (time, elapsed, amount) => ({ points: motion.pose(time, amount), last: motion.count - 1 }),
      };
    });
  }
  const heavy = style === RESTRAINT_CHAINS;
  return strands.map((strand) => {
    const motion = new LineStrandMotion(strand, {
      motion: config.strandMotion,
      layout: config.strandLayout,
      heavy,
      weight: clamp(Number(config.chainWeight ?? 60), 0, 100) / 100,
      cell,
      phase: rng(),
    });
    const ends = style === RESTRAINT_ROPE ? (t, n) => (t * (n - 1) < 0.5 || (1 - t) * (n - 1) < 0.5 ? 0.9 : 1) : () => 1;
    return {
      count: motion.count,
      profile: profileOf(motion.count, (t) => ends(t, motion.count)),
      shade: null,
      pose: (time, elapsed, amount) => motion.pose(time, elapsed, amount),
    };
  });
}

function profileOf(count, shape) {
  const profile = new Float32Array(count);
  for (let i = 0; i < count; i += 1) profile[i] = shape(i / Math.max(1, count - 1));
  return profile;
}

const SERPENT_KNOTS = [
  [0, 0],
  [0.012, 0.55],
  [0.03, 0.8],
  [0.05, 0.86],
  [0.085, 0.68],
  [0.2, 1],
  [0.55, 1],
  [0.8, 0.55],
  [0.95, 0.15],
  [1, 0],
];

/** Body width from the snout (0) to the tail tip (1): rounded head, slight neck, long taper. */
export function serpentWidth(t) {
  for (let i = 1; i < SERPENT_KNOTS.length; i += 1) {
    const [t1, w1] = SERPENT_KNOTS[i];
    if (t <= t1) {
      const [t0, w0] = SERPENT_KNOTS[i - 1];
      const f = (t - t0) / (t1 - t0);
      return w0 + (w1 - w0) * f * f * (3 - 2 * f);
    }
  }
  return 0;
}
