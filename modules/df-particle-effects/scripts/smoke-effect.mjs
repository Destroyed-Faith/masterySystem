import { clamp } from "./geometry.mjs";
import { RegionShaderEffect } from "./region-effect.mjs";
import { colorToRgb, createSmokeSurface, driftVector } from "./smoke-surface-shader.mjs";

/** Drifting smoke or fog clipped to a region. */
export class SmokeEffect extends RegionShaderEffect {
  /**
   * @param {object} options see RegionShaderEffect, plus:
   * @param {{ width: number, height: number, values: Float32Array, maxDistance: number }} options.depth
   */
  constructor(options) {
    super(options, (PIXI) => createSmokeSurface(PIXI, options.bounds, options.depth), "smoke");
    this.tick(0);
  }

  tick(time) {
    if (!this.surface) return;
    const speed = clamp(Number(this.config.driftSpeed) || 0, 0.05, 3);
    this.surface.update({
      ...this.regionState(),
      time: time * speed,
      opacity: clamp(Number(this.config.opacity) || 0, 0, 1),
      color: colorToRgb(this.config.smokeColor),
      density: clamp(Number(this.config.smokeDensity) || 0, 0, 100) / 100,
      scale: clamp(Number(this.config.smokeScale) || 1, 0.25, 3),
      drift: driftVector(this.config.driftDirection),
      edgeSoftness: clamp(Number(this.config.edgeSoftness) || 0, 0, 5),
    });
  }
}
