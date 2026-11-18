import { LOG_PREFIX } from "./constants.mjs";

/**
 * A shader surface clipped to a region mask. Subclasses build the surface and feed
 * its uniforms in tick().
 */
export class RegionShaderEffect {
  /**
   * @param {object} options
   * @param {object} options.config
   * @param {{ x: number, y: number, width: number, height: number }} options.bounds
   * @param {object} options.mask
   * @param {number} options.gridSize
   * @param {number} options.seed
   * @param {(PIXI: object) => ({ display: object, update(state: object): void, destroy(): void }|null)} buildSurface
   * @param {string} label for errors
   */
  constructor(options, buildSurface, label) {
    const PIXI = globalThis.PIXI;
    if (!PIXI?.Container) throw new Error(`${LOG_PREFIX} PIXI.Container is not available.`);

    this.config = options.config;
    this.bounds = options.bounds;
    this.gridSize = Math.max(1, options.gridSize);
    this.seed = options.seed >>> 0;

    this.root = new PIXI.Container();
    this.content = new PIXI.Container();
    this.root.addChild(this.content);
    silence(this.root);
    silence(this.content);
    this.mask = options.mask;
    silence(this.mask);
    this.root.addChild(this.mask);
    this.content.mask = this.mask;

    this.surface = buildSurface(PIXI);
    if (!this.surface?.display) {
      this.destroy();
      throw new Error(`${LOG_PREFIX} ${label} shader surface could not be created.`);
    }
    this.content.addChild(this.surface.display);
  }

  /** Uniforms every region surface shares. */
  regionState() {
    return {
      seed: (this.seed % 10000) / 10000,
      cellSize: this.gridSize,
      worldMinX: this.bounds.x,
      worldMinY: this.bounds.y,
      worldWidth: this.bounds.width,
      worldHeight: this.bounds.height,
    };
  }

  destroy() {
    if (!this.root || this.root.destroyed) return;
    this.content.mask = null;
    if (this.surface) {
      try {
        const display = this.surface.display;
        if (display?.parent) display.parent.removeChild(display);
        this.surface.destroy();
      } catch {
        /* already gone */
      }
      this.surface = null;
    }
    this.root.destroy({ children: true, texture: false, textureSource: false });
    this.root = null;
  }
}

function silence(displayObject) {
  displayObject.eventMode = "none";
  displayObject.interactiveChildren = false;
}
