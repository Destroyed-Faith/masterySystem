import { clamp } from "./geometry.mjs";
import { createIceSurface } from "./ice-surface-shader.mjs";
import { freezeTimeline } from "./ice-timeline.mjs";
import { RegionShaderEffect } from "./region-effect.mjs";

/**
 * One ice surface clipped to a region. `startedAt` is the wall-clock second the
 * freeze began; -Infinity means the surface is already frozen.
 */
export class IceEffect extends RegionShaderEffect {
  /**
   * @param {object} options see RegionShaderEffect, plus:
   * @param {{ width: number, height: number, values: Float32Array }} options.depth
   * @param {object|null} [options.background]
   * @param {number} [options.startedAt]
   * @param {() => number} [options.clock] wall-clock seconds
   */
  constructor(options) {
    super(options, (PIXI) => createIceSurface(PIXI, options.bounds, options.depth, options.background ?? null), "ice");
    this.clock = options.clock ?? wallSeconds;
    this.startedAt = options.startedAt ?? -Infinity;
    this.tick(0);
  }

  /** Replay the freeze from clear ground. */
  restart(startedAt = this.clock()) {
    this.startedAt = startedAt;
  }

  tick(time) {
    if (!this.surface) return;
    const now = this.clock();
    const { progress, fade } = freezeTimeline(this.config, now - this.startedAt, now);
    this.surface.update({
      ...this.regionState(),
      time,
      opacity: clamp(Number(this.config.opacity) || 0, 0, 1),
      progress,
      fade,
      edgeBias: clamp(Number(this.config.edgeBias) || 0, 0, 100) / 100,
      crystal: clamp(Number(this.config.crystalSize) || 1, 0.25, 3),
      refraction: clamp(Number(this.config.refraction) || 0, 0, 100) / 100,
    });
  }
}

export function wallSeconds() {
  return Date.now() / 1000;
}
