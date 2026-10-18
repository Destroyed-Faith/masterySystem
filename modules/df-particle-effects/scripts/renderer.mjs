import { loadFireAssets } from "./assets.mjs";
import {
  BEHAVIOR_TYPE,
  EFFECT_NATURAL_FIRE,
  LOG_PREFIX,
  MODULE_ID,
  PRIMARY_TILE_SORT,
  QUALITY_LIMITS,
} from "./constants.mjs";
import { gridCellArea, regionMaskOperations } from "./geometry.mjs";
import { NaturalFireEffect } from "./fire-effect.mjs";
import { allocateBudget, desiredEmberCount, desiredFlameCount, planFlameSites } from "./placement.mjs";
import { deriveSeed } from "./random.mjs";

export class ParticleRenderer {
  #generation = 0;
  #instances = new Map();
  #tickerBound = null;
  #time = 0;

  syncScene() {
    this.#syncScene().catch((error) => {
      console.warn(`${LOG_PREFIX} failed to draw region fire.`, error);
    });
  }

  clear() {
    this.#generation += 1;
    this.#disposeInstances();
  }

  onBehaviorUpsert(behavior) {
    if (!this.#isViewedScene(behaviorScene(behavior))) return;
    this.syncScene();
  }

  onBehaviorDelete(behavior) {
    const scene = behaviorScene(behavior);
    if (scene && !this.#isViewedScene(scene)) return;
    this.syncScene();
  }

  onRegionGeometry(region) {
    if (!this.#isViewedScene(region?.parent)) return;
    this.syncScene();
  }

  onRegionDelete(region) {
    const scene = region?.parent;
    if (scene && !this.#isViewedScene(scene)) return;
    this.syncScene();
  }

  async #syncScene() {
    const token = ++this.#generation;
    const scene = globalThis.canvas?.scene;
    const primary = globalThis.canvas?.primary;
    if (!scene || !primary || primary.destroyed) {
      this.#disposeInstances();
      return;
    }

    let assets;
    try {
      assets = await loadFireAssets();
    } catch (error) {
      console.warn(`${LOG_PREFIX} fire assets are unavailable. The map was left unchanged.`, error);
      return;
    }
    if (token !== this.#generation || !globalThis.canvas?.scene || globalThis.canvas.primary?.destroyed) return;

    const grid = readGrid();
    const limits = readQualityLimits();
    const active = collectActiveBehaviors(scene);
    const flameBudget = allocateBudget(
      active.map((entry) =>
        Math.min(limits.perRegionFlames, desiredFlameCount(entry.area, grid.cellArea, entry.config.density)),
      ),
      limits.sceneFlames,
    );
    const emberBudget = allocateBudget(
      active.map((entry, index) =>
        Math.min(limits.perRegionEmbers, desiredEmberCount(flameBudget[index], entry.config.emberAmount)),
      ),
      limits.sceneEmbers,
    );

    this.#disposeInstances();
    if (token !== this.#generation || globalThis.canvas?.primary?.destroyed) return;

    active.forEach((entry, index) => {
      if (token !== this.#generation) return;
      try {
        const effect = createEffect(entry, assets, grid, flameBudget[index], emberBudget[index]);
        if (!effect) return;
        if (!mountEffect(effect.root, entry.elevation)) {
          effect.destroy();
          return;
        }
        this.#instances.set(entry.key, effect);
      } catch (error) {
        console.warn(`${LOG_PREFIX} skipped a fire region (${entry.key}).`, error);
      }
    });

    if (token !== this.#generation) {
      this.#disposeInstances();
      return;
    }
    if (this.#instances.size) this.#attachTicker();
  }

  #attachTicker() {
    const ticker = globalThis.canvas?.app?.ticker;
    if (!ticker || this.#tickerBound) return;
    this.#tickerBound = (frame) => {
      const delta = Math.min(0.1, (frame?.deltaMS ?? 16.67) / 1000);
      this.#time += delta;
      for (const effect of this.#instances.values()) effect.tick(this.#time);
    };
    ticker.add(this.#tickerBound);
  }

  #detachTicker() {
    const ticker = globalThis.canvas?.app?.ticker;
    if (ticker && this.#tickerBound) ticker.remove(this.#tickerBound);
    this.#tickerBound = null;
  }

  #disposeInstances() {
    this.#detachTicker();
    for (const effect of this.#instances.values()) effect.destroy();
    this.#instances.clear();
  }

  #isViewedScene(scene) {
    const viewed = globalThis.canvas?.scene;
    return Boolean(viewed && scene && viewed.id === scene.id);
  }
}

export function registerSettings(renderer) {
  globalThis.game.settings.register(MODULE_ID, "quality", {
    name: "DF_PARTICLE_EFFECTS.SETTINGS.quality.name",
    hint: "DF_PARTICLE_EFFECTS.SETTINGS.quality.hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      low: "DF_PARTICLE_EFFECTS.SETTINGS.quality.low",
      medium: "DF_PARTICLE_EFFECTS.SETTINGS.quality.medium",
      high: "DF_PARTICLE_EFFECTS.SETTINGS.quality.high",
    },
    default: "medium",
    onChange: () => renderer.syncScene(),
  });
}

function collectActiveBehaviors(scene) {
  const active = [];
  for (const region of scene.regions ?? []) {
    for (const behavior of region.behaviors ?? []) {
      if (behavior?.type !== BEHAVIOR_TYPE) continue;
      try {
        const config = readConfig(behavior);
        if (!config.enabled) continue;
        if (config.effectType !== EFFECT_NATURAL_FIRE) {
          console.warn(
            `${LOG_PREFIX} effect type "${config.effectType}" is not implemented. That behavior was skipped.`,
          );
          continue;
        }
        const tree = region.polygonTree;
        if (!tree || typeof tree.testPoint !== "function") {
          console.warn(`${LOG_PREFIX} region ${region.id} has no polygon tree. Fire was skipped.`);
          continue;
        }
        if (tree.isEmpty) continue;
        const bounds = copyBounds(tree.bounds);
        const area = Number(tree.area) || 0;
        if (!bounds || !(area > 0)) continue;
        active.push({
          key: behavior.uuid || `${region.id}:${behavior.id}`,
          region,
          behavior,
          tree,
          bounds,
          area,
          config,
          elevation: visualElevation(region),
          seed: layoutSeed(scene, region, behavior, config.randomSeed),
        });
      } catch (error) {
        console.warn(`${LOG_PREFIX} skipped region ${region?.id}.`, error);
      }
    }
  }
  return active;
}

function createEffect(entry, assets, grid, maxFlames, maxEmbers) {
  const fadeRadius = (clampNumber(entry.config.edgeFade, 0, 100) / 100) * grid.size * entry.config.flameScale;
  const sites = planFlameSites({
    bounds: entry.bounds,
    area: entry.area,
    cellArea: grid.cellArea,
    density: entry.config.density,
    seed: entry.seed,
    maxFlames,
    contains: (x, y) => entry.tree.testPoint({ x, y }),
    edgeFactor: (x, y) => edgeFactor(entry.tree, x, y, fadeRadius),
  });
  if (!sites.length) return null;

  const mask = buildRegionMask(entry.tree);
  if (!mask) {
    console.warn(`${LOG_PREFIX} region mask could not be built. Fire was skipped so it cannot spill outside.`);
    return null;
  }

  return new NaturalFireEffect({
    assets,
    sites,
    emberCount: Math.min(maxEmbers, desiredEmberCount(sites.length, entry.config.emberAmount)),
    config: entry.config,
    gridSize: grid.size,
    seed: entry.seed,
    mask,
  });
}

/**
 * Opaque mask from the region polygon tree.
 * PixiJS 8 (Foundry 14) has no even-odd fill argument. Holes are `cut()` after `fill()`.
 * Foundry already resolved rectangles, ellipses, polygons, and shape order into this tree.
 */
export function buildRegionMask(tree) {
  const PIXI = globalThis.PIXI;
  if (!PIXI?.Graphics || typeof PIXI.Graphics.prototype.poly !== "function" || typeof PIXI.Graphics.prototype.cut !== "function") {
    console.warn(`${LOG_PREFIX} PIXI.Graphics.poly/cut is missing. This build targets Foundry 14 / PixiJS 8.`);
    return null;
  }

  const operations = regionMaskOperations(tree);
  if (!operations.some((operation) => operation.op === "fill")) return null;

  try {
    const graphics = new PIXI.Graphics();
    graphics.eventMode = "none";
    for (const operation of operations) {
      graphics.poly(Array.from(operation.points));
      if (operation.op === "fill") graphics.fill({ color: 0xffffff, alpha: 1 });
      else graphics.cut();
    }
    return graphics;
  } catch (error) {
    console.warn(`${LOG_PREFIX} region mask failed.`, error);
    return null;
  }
}

function edgeFactor(tree, x, y, fadeRadius) {
  if (!tree.testPoint({ x, y })) return 0;
  if (!(fadeRadius > 0) || typeof tree.testCircle !== "function") return 1;
  if (tree.testCircle({ x, y }, fadeRadius) === 1) return 1;
  let low = 0;
  let high = fadeRadius;
  for (let i = 0; i < 6; i += 1) {
    const mid = (low + high) / 2;
    if (tree.testCircle({ x, y }, mid) === 1) low = mid;
    else high = mid;
  }
  return Math.min(1, Math.max(0.2, low / fadeRadius));
}

function mountEffect(root, elevation) {
  const primary = globalThis.canvas?.primary;
  if (!primary || primary.destroyed) {
    console.warn(`${LOG_PREFIX} the primary canvas group is missing. Fire was not added.`);
    return false;
  }
  const tileSort = globalThis.foundry?.canvas?.groups?.PrimaryCanvasGroup?.SORT_LAYERS?.TILES ?? PRIMARY_TILE_SORT;
  root.elevation = elevation;
  root.sort = tileSort;
  root.zIndex = tileSort;
  root.eventMode = "none";
  root.interactiveChildren = false;
  primary.addChild(root);
  try {
    primary.sortChildren();
  } catch (error) {
    console.warn(`${LOG_PREFIX} primary canvas sort failed. The fire container is still attached.`, error);
  }
  return true;
}

function readConfig(behavior) {
  const system = behavior.system ?? {};
  const rawSeed = system.randomSeed;
  const randomSeed =
    rawSeed == null || rawSeed === "" || Number(rawSeed) === 0 || !Number.isFinite(Number(rawSeed))
      ? null
      : Math.floor(Number(rawSeed));
  return {
    enabled: system.enabled !== false && behavior.disabled !== true,
    effectType: system.effectType || EFFECT_NATURAL_FIRE,
    density: clampNumber(system.density ?? 40, 0, 100),
    flameScale: clampNumber(system.flameScale ?? 1, 0.25, 2),
    flameSpeed: clampNumber(system.flameSpeed ?? 1, 0.1, 3),
    opacity: clampNumber(system.opacity ?? 0.9, 0, 1),
    emberAmount: clampNumber(system.emberAmount ?? 20, 0, 100),
    edgeFade: clampNumber(system.edgeFade ?? 5, 0, 100),
    randomSeed,
  };
}

function layoutSeed(scene, region, behavior, randomSeed) {
  return deriveSeed([randomSeed ?? "auto", scene?.id, region?.id, behavior?.id]);
}

function readGrid() {
  const grid = globalThis.canvas?.grid;
  const sceneGrid = globalThis.canvas?.scene?.grid;
  const size = Math.max(1, Number(grid?.size ?? sceneGrid?.size ?? 100) || 100);
  const sizeX = Math.max(1, Number(grid?.sizeX ?? size) || size);
  const sizeY = Math.max(1, Number(grid?.sizeY ?? size) || size);
  const gridType = Number(grid?.type ?? sceneGrid?.type ?? 1);
  return {
    size,
    cellArea: gridCellArea({ sizeX, sizeY, gridType }),
  };
}

function readQualityLimits() {
  const selected = globalThis.game?.settings?.get?.(MODULE_ID, "quality");
  return QUALITY_LIMITS[selected] ?? QUALITY_LIMITS.medium;
}

function visualElevation(region) {
  const bottom = region?.elevation?.bottom;
  return Number.isFinite(Number(bottom)) ? Number(bottom) : 0;
}

function copyBounds(bounds) {
  if (!bounds) return null;
  const x = Number(bounds.x);
  const y = Number(bounds.y);
  const width = Number(bounds.width);
  const height = Number(bounds.height);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return { x, y, width, height };
}

function behaviorScene(behavior) {
  return behavior?.region?.parent ?? behavior?.parent?.parent ?? null;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}
