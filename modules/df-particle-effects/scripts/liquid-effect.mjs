import { clamp } from "./geometry.mjs";
import { resolveLiquidLook } from "./liquid-presets.mjs";
import { createLiquidSurface } from "./liquid-surface-shader.mjs";
import { RegionShaderEffect } from "./region-effect.mjs";

/** A viscous liquid surface (tar, lava, acid, slime, arcane goo) clipped to a region. */
export class LiquidEffect extends RegionShaderEffect {
  /**
   * @param {object} options see RegionShaderEffect, plus:
   * @param {{ width: number, height: number, values: Float32Array, maxDistance: number }} options.depth
   * @param {object|null} [options.background]
   */
  constructor(options) {
    super(options, (PIXI) => createLiquidSurface(PIXI, options.bounds, options.depth, options.background ?? null), "viscous surface");
    this.tick(0);
  }

  tick(time) {
    if (!this.surface) return;
    const look = resolveLiquidLook(this.config);
    this.surface.update({
      ...this.regionState(),
      time: time * look.speed,
      opacity: clamp(Number(this.config.opacity) || 0, 0, 1),
      look,
    });
  }
}
