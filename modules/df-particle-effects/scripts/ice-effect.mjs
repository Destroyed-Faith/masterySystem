import { LOG_PREFIX } from "./constants.mjs";
import { clamp } from "./geometry.mjs";
import { createIceSurface } from "./ice-surface-shader.mjs";
import { freezeTimeline } from "./ice-timeline.mjs";

/**
 * One ice surface clipped to a region. `startedAt` is the wall-clock second the
 * freeze began; -Infinity means the surface is already frozen.
 */
export class IceEffect {
  /**
   * @param {object} options
   * @param {object} options.config
   * @param {{ x: number, y: number, width: number, height: number }} options.bounds
   * @param {object} options.mask
   * @param {number} options.gridSize
   * @param {number} options.seed
   * @param {{ width: number, height: number, values: Float32Array }} options.depth
   * @param {object|null} [options.background]
   * @param {number} [options.startedAt]
   * @param {() => number} [options.clock] wall-clock seconds
   */
  constructor(options) {
    const PIXI = globalThis.PIXI;
    if (!PIXI?.Container) throw new Error(`${LOG_PREFIX} PIXI.Container is not available.`);

    this.config = options.config;
    this.bounds = options.bounds;
    this.gridSize = Math.max(1, options.gridSize);
    this.seed = options.seed >>> 0;
    this.clock = options.clock ?? wallSeconds;
    this.startedAt = options.startedAt ?? -Infinity;

    this.root = new PIXI.Container();
    this.content = new PIXI.Container();
    this.root.addChild(this.content);
    silence(this.root);
    silence(this.content);
    this.mask = options.mask;
    silence(this.mask);
    this.root.addChild(this.mask);
    this.content.mask = this.mask;

    this.surface = createIceSurface(PIXI, this.bounds, options.depth, options.background ?? null);
    if (!this.surface?.display) {
      this.destroy();
      throw new Error(`${LOG_PREFIX} ice shader surface could not be created.`);
    }
    this.content.addChild(this.surface.display);
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
      time,
      opacity: clamp(Number(this.config.opacity) || 0, 0, 1),
      progress,
      fade,
      edgeBias: clamp(Number(this.config.edgeBias) || 0, 0, 100) / 100,
      crystal: clamp(Number(this.config.crystalSize) || 1, 0.25, 3),
      refraction: clamp(Number(this.config.refraction) || 0, 0, 100) / 100,
      seed: (this.seed % 10000) / 10000,
      cellSize: this.gridSize,
      worldMinX: this.bounds.x,
      worldMinY: this.bounds.y,
      worldWidth: this.bounds.width,
      worldHeight: this.bounds.height,
    });
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

export function wallSeconds() {
  return Date.now() / 1000;
}

function silence(displayObject) {
  displayObject.eventMode = "none";
  displayObject.interactiveChildren = false;
}
