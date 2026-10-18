import { EFFECT_NATURAL_FIRE, FLAME_HEIGHT_IN_CELLS, LOG_PREFIX } from "./constants.mjs";
import { clamp } from "./geometry.mjs";
import { deriveSeed, mulberry32 } from "./random.mjs";

/**
 * One Natural Fire instance: layered still sprites plus rising embers.
 * Variants are chosen once from the seed. Motion is scale, opacity, skew, and a little rotation
 * around the base pivot. Textures are never swapped in the ticker.
 */
export class NaturalFireEffect {
  /**
   * @param {object} options
   * @param {object} options.assets
   * @param {Array<{x: number, y: number, edge: number}>} options.sites
   * @param {number} options.emberCount
   * @param {object} options.config
   * @param {number} options.gridSize
   * @param {number} options.seed
   * @param {object|null} options.mask
   */
  constructor(options) {
    const PIXI = globalThis.PIXI;
    if (!PIXI?.Container || !PIXI?.Sprite) {
      throw new Error(`${LOG_PREFIX} PIXI.Container/Sprite is not available.`);
    }

    this.config = options.config;
    this.gridSize = Math.max(1, options.gridSize);
    this.layers = [];
    this.embers = [];

    this.root = new PIXI.Container();
    this.content = new PIXI.Container();
    this.root.addChild(this.content);
    silence(this.root);
    silence(this.content);

    this.mask = options.mask ?? null;
    if (this.mask) {
      silence(this.mask);
      this.root.addChild(this.mask);
      this.content.mask = this.mask;
    }

    const rng = mulberry32(options.seed >>> 0);
    this.#buildFlames(PIXI, options.assets, options.sites, rng);
    this.#buildEmbers(PIXI, options.assets, options.sites, options.emberCount, rng);
    if (!this.layers.length) {
      this.destroy();
      throw new Error(`${LOG_PREFIX} flame sprites could not be created.`);
    }
  }

  tick(time) {
    const speed = clamp(Number(this.config.flameSpeed) || 1, 0.1, 3);
    const opacity = clamp(Number(this.config.opacity) || 0, 0, 1);
    const t = time * speed;

    for (const layer of this.layers) {
      const wave = Math.sin(t * layer.freq + layer.phase);
      const wave2 = Math.sin(t * layer.freq * 0.63 + layer.phase * 1.7);
      const scaleX = layer.baseScale * (1 + layer.scaleXAmp * wave2);
      const scaleY = layer.baseScale * (1 + layer.scaleYAmp * wave);
      layer.sprite.scale.set(scaleX, scaleY);
      layer.sprite.skew.x = wave2 * layer.skewAmp;
      layer.sprite.rotation = wave * layer.rotAmp;
      const flicker = 0.82 + 0.18 * (0.5 + 0.5 * wave);
      layer.sprite.alpha = opacity * layer.edge * layer.alphaBase * flicker;
    }

    for (const ember of this.embers) {
      const age = ((t + ember.phase) % ember.life) / ember.life;
      const rise = age * ember.rise;
      const sway = Math.sin(age * Math.PI * 2 * ember.swayTurns + ember.phase) * ember.drift * age;
      ember.sprite.position.set(ember.x + sway, ember.y - rise);
      const fade = Math.sin(age * Math.PI);
      ember.sprite.alpha = opacity * ember.edge * ember.peak * fade;
      const scale = ember.baseScale * (0.7 + 0.4 * (1 - age));
      ember.sprite.scale.set(scale, scale);
    }
  }

  destroy() {
    if (!this.root || this.root.destroyed) return;
    this.content.mask = null;
    this.root.destroy({ children: true, texture: false, textureSource: false });
    this.root = null;
    this.layers.length = 0;
    this.embers.length = 0;
  }

  #buildFlames(PIXI, assets, sites, rng) {
    const scale = clamp(Number(this.config.flameScale) || 1, 0.25, 2);
    sites.forEach((site, index) => {
      const siteRng = mulberry32(deriveSeed([this.config.effectType, index, rng()]));
      const primary = pickGroup(siteRng, assets);
      if (!primary) return;
      this.#addFlameLayer(PIXI, assets, site, primary, 1, 0, scale, siteRng, 0);
      if (siteRng() < 0.72) {
        const secondary = pickGroup(siteRng, assets, primary);
        const offset = (siteRng() * 2 - 1) * this.gridSize * 0.16 * scale;
        this.#addFlameLayer(PIXI, assets, site, secondary, 0.72, offset, scale * 0.82, siteRng, 1);
      }
      if (siteRng() < 0.38) {
        const offset = (siteRng() * 2 - 1) * this.gridSize * 0.1 * scale;
        this.#addFlameLayer(PIXI, assets, site, "small", 0.5, offset, scale * 0.7, siteRng, 2);
      }
    });
  }

  #addFlameLayer(PIXI, assets, site, group, alphaBase, offsetX, scale, rng, depth) {
    const entries = assets.flames[group];
    if (!entries?.length) return;
    const entry = entries[Math.floor(rng() * entries.length)];
    const sprite = new PIXI.Sprite(entry.texture);
    silence(sprite);
    sprite.anchor.set(entry.pivot.x, entry.pivot.y);
    sprite.position.set(site.x + offsetX, site.y);
    const heightCells = FLAME_HEIGHT_IN_CELLS[group] ?? 1;
    const sizeJitter = 0.88 + rng() * 0.24;
    const baseScale = ((this.gridSize * heightCells * scale) / entry.size) * sizeJitter;
    sprite.scale.set(baseScale, baseScale);
    const blend = PIXI.BLEND_MODES?.NORMAL ?? "normal";
    sprite.blendMode = blend;
    this.content.addChild(sprite);
    const sway = [0.045, 0.09, 0.14][depth] ?? 0.08;
    this.layers.push({
      sprite,
      baseScale,
      edge: site.edge > 0 ? site.edge : 0,
      alphaBase,
      phase: rng() * Math.PI * 2,
      freq: 1.7 + rng() * 1.5 + depth * 0.45,
      scaleXAmp: 0.035 + depth * 0.015,
      scaleYAmp: 0.05 + depth * 0.02,
      skewAmp: sway,
      rotAmp: 0.018 + depth * 0.012,
    });
  }

  #buildEmbers(PIXI, assets, sites, emberCount, rng) {
    if (!emberCount || !assets.embers.length || !sites.length) return;
    const scale = clamp(Number(this.config.flameScale) || 1, 0.25, 2);
    const blend = PIXI.BLEND_MODES?.NORMAL ?? "normal";
    for (let i = 0; i < emberCount; i += 1) {
      const site = sites[Math.floor(rng() * sites.length)];
      const entry = assets.embers[Math.floor(rng() * assets.embers.length)];
      const sprite = new PIXI.Sprite(entry.texture);
      silence(sprite);
      sprite.anchor.set(entry.pivot.x, entry.pivot.y);
      sprite.position.set(site.x, site.y);
      sprite.blendMode = blend;
      const baseScale = ((this.gridSize * (0.12 + rng() * 0.1) * scale) / entry.size);
      sprite.scale.set(baseScale, baseScale);
      sprite.alpha = 0;
      this.content.addChild(sprite);
      const direction = rng() < 0.5 ? -1 : 1;
      this.embers.push({
        sprite,
        x: site.x + (rng() * 2 - 1) * this.gridSize * 0.08 * scale,
        y: site.y - this.gridSize * 0.02,
        edge: site.edge > 0 ? site.edge : 0,
        baseScale,
        peak: 0.55 + rng() * 0.4,
        phase: rng() * 4,
        life: 1.35 + rng() * 1.5,
        rise: this.gridSize * (0.45 + rng() * 0.85) * scale,
        drift: direction * this.gridSize * (0.08 + rng() * 0.18) * scale,
        swayTurns: 0.5 + rng() * 0.7,
      });
    }
  }
}

export function assertNaturalFire(effectType) {
  return effectType === EFFECT_NATURAL_FIRE;
}

function pickGroup(rng, assets, avoid) {
  const available = ["large", "medium", "small"].filter((group) => assets.flames[group]?.length);
  if (!available.length) return null;
  const roll = rng();
  let group = "medium";
  if (roll < 0.28) group = "large";
  else if (roll > 0.7) group = "small";
  if (!available.includes(group) || group === avoid) {
    const fallback = available.find((candidate) => candidate !== avoid) ?? available[0];
    return fallback ?? null;
  }
  return group;
}

function silence(displayObject) {
  displayObject.eventMode = "none";
  displayObject.interactiveChildren = false;
}
