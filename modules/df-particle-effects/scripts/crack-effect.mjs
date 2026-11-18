import { CRACK_DEFAULT_GLOW, CRACK_ORIGIN_SCATTERED } from "./constants.mjs";
import { createCrackSurface, shakeOffset } from "./crack-surface-shader.mjs";
import { clamp } from "./geometry.mjs";
import { wallSeconds } from "./ice-effect.mjs";
import { RegionShaderEffect } from "./region-effect.mjs";
import { colorToRgb } from "./smoke-surface-shader.mjs";
import { crackTimeline } from "./timeline.mjs";

/** Shake amplitude at Shake 100, in grid cells. */
const MAX_SHAKE_CELLS = 0.06;

/**
 * Ground cracks clipped to a region. `startedAt` is the wall-clock second the ground
 * began to break; -Infinity means it is already broken.
 */
export class CrackEffect extends RegionShaderEffect {
  /**
   * @param {object} options see RegionShaderEffect, plus:
   * @param {{ width: number, height: number, values: Float32Array }} options.depth
   * @param {object|null} [options.background]
   * @param {number} [options.startedAt]
   * @param {() => number} [options.clock] wall-clock seconds
   */
  constructor(options) {
    super(options, (PIXI) => createCrackSurface(PIXI, options.bounds, options.depth, options.background ?? null), "ground crack");
    this.clock = options.clock ?? wallSeconds;
    this.startedAt = options.startedAt ?? -Infinity;
    this.tick(0);
  }

  /** Break the ground open again from whole ground. */
  restart(startedAt = this.clock()) {
    this.startedAt = startedAt;
  }

  tick(time) {
    if (!this.surface) return;
    const now = this.clock();
    const { progress, fade, quake } = crackTimeline(this.config, now - this.startedAt, now);
    const shake = (clamp(Number(this.config.shake) || 0, 0, 100) / 100) * quake * MAX_SHAKE_CELLS * this.gridSize;
    this.surface.update({
      ...this.regionState(),
      time,
      opacity: clamp(Number(this.config.opacity) || 0, 0, 1),
      progress,
      fade,
      origin: this.config.crackOrigin === CRACK_ORIGIN_SCATTERED ? 0 : 1,
      scale: clamp(Number(this.config.crackScale) || 1, 0.25, 3),
      width: clamp(Number(this.config.crackWidth) || 1, 0.25, 3),
      glow: clamp(Number(this.config.glowStrength) || 0, 0, 100) / 100,
      glowColor: colorToRgb(this.config.glowColor, colorToRgb(CRACK_DEFAULT_GLOW)),
      dust: clamp(Number(this.config.dust) || 0, 0, 100) / 100,
      shake: shakeOffset(now, shake),
    });
  }
}
