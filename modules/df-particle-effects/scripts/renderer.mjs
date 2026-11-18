import { loadFireAssets } from "./assets.mjs";
import {
  ARRANGEMENT_FIELD,
  ARRANGEMENT_SINGLE,
  behaviorTypeId,
  EFFECT_ICE,
  EFFECT_NATURAL_FIRE,
  EFFECT_NONE,
  EFFECT_SMOKE,
  FIELD_RENDER_LEGACY,
  FREEZE_INSTANT,
  FREEZE_LOOP,
  FREEZE_ONCE,
  LOOP_RESET_FADE,
  LOOP_RESET_THAW,
  FIELD_RENDER_SHADER,
  fieldRendererSettingKey,
  LOG_PREFIX,
  PRIMARY_TILE_SORT,
  QUALITY_LIMITS,
  qualitySettingKey,
  settingsNamespace,
  SMOKE_DEFAULT_COLOR,
} from "./constants.mjs";
import { gridCellArea, regionMaskOperations } from "./geometry.mjs";
import { NaturalFireEffect, usesBallOfFire, usesShaderField } from "./fire-effect.mjs";
import { computeEdgeDepth } from "./ice-depth.mjs";
import { IceEffect, wallSeconds } from "./ice-effect.mjs";
import { freezeTimingSignature } from "./ice-timeline.mjs";
import { resolveSceneBackground } from "./scene-background.mjs";
import { SmokeEffect } from "./smoke-effect.mjs";
import { resolveFireStyle } from "./styles.mjs";
import {
  allocateBudget,
  planFlameSites,
  planSingleFlameSite,
  planSparseSites,
  wantedEmberCount,
  wantedFlameCount,
} from "./placement.mjs";
import { deriveSeed } from "./random.mjs";

export class ParticleRenderer {
  #generation = 0;
  #instances = new Map();
  #tickerBound = null;
  #time = 0;
  /** @type {null | { key: string, behavior: object, config: object, layout: string }} */
  #preview = null;
  /** Wall-clock second each ice surface started freezing; -Infinity = already frozen. */
  #freezeStarts = new Map();
  /** The first draw after a canvas load shows existing ice already frozen. */
  #sceneLoaded = false;

  syncScene() {
    this.#syncScene().catch((error) => {
      console.warn(`${LOG_PREFIX} failed to draw region fire.`, error);
    });
  }

  clear() {
    this.#generation += 1;
    this.#disposeInstances();
    this.#freezeStarts.clear();
    this.#sceneLoaded = false;
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

  /**
   * Show unsaved form values on the viewed scene. Closing the sheet clears this.
   * Speed and opacity update the running animation. Layout fields rebuild the fire.
   */
  setPreview(behavior, draft) {
    if (!behavior || !this.#isViewedScene(behaviorScene(behavior))) return;
    const config = readConfig({ system: draft?.system ?? {}, disabled: draft?.disabled === true });
    const key = behaviorKey(behavior);
    const layout = fireLayoutSignature(config);
    const effect = this.#instances.get(key);
    const previous = this.#preview?.key === key ? this.#preview.config : null;
    if (config.effectType === EFFECT_ICE && previous && freezeTimingSignature(previous) !== freezeTimingSignature(config)) {
      this.#freezeStarts.set(key, wallSeconds());
    }
    if (this.#preview?.key === key && this.#preview.layout === layout && effect && config.enabled) {
      effect.config = config;
      if (effect instanceof IceEffect) effect.restart(this.#freezeStarts.get(key) ?? effect.startedAt);
      this.#preview = { key, behavior, config, layout };
      return;
    }
    this.#preview = { key, behavior, config, layout };
    this.syncScene();
  }

  clearPreview(behavior) {
    if (!this.#preview) return;
    if (behavior && behaviorKey(behavior) !== this.#preview.key) return;
    this.#preview = null;
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
    const active = collectActiveBehaviors(scene, this.#preview);
    this.#assignFreezeStarts(active);
    const flameBudget = allocateBudget(
      active.map((entry) =>
        Math.min(limits.perRegionFlames, wantedFlameCount(entry.config, entry.area, grid.cellArea)),
      ),
      limits.sceneFlames,
    );
    const emberBudget = allocateBudget(
      active.map((entry, index) =>
        Math.min(
          limits.perRegionEmbers,
          wantedEmberCount(entry.config, flameBudget[index], entry.area, grid.cellArea),
        ),
      ),
      limits.sceneEmbers,
    );

    this.#disposeInstances();
    if (token !== this.#generation || globalThis.canvas?.primary?.destroyed) return;

    active.forEach((entry, index) => {
      if (token !== this.#generation) return;
      try {
        const effect = createEffect(entry, assets, grid, flameBudget[index], emberBudget[index], limits);
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

  /**
   * Ice that exists when the scene loads is already frozen. Ice that appears later
   * (created, enabled, or switched to ice) freezes in. Dropped surfaces forget their start.
   */
  #assignFreezeStarts(active) {
    const now = wallSeconds();
    const iceKeys = new Set();
    for (const entry of active) {
      if (entry.config.effectType !== EFFECT_ICE) continue;
      iceKeys.add(entry.key);
      if (!this.#freezeStarts.has(entry.key)) {
        this.#freezeStarts.set(entry.key, this.#sceneLoaded ? now : -Infinity);
      }
      entry.freezeStart = this.#freezeStarts.get(entry.key);
    }
    for (const key of [...this.#freezeStarts.keys()]) {
      if (!iceKeys.has(key)) this.#freezeStarts.delete(key);
    }
    this.#sceneLoaded = true;
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
  globalThis.game.settings.register(settingsNamespace(), qualitySettingKey(), {
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

  globalThis.game.settings.register(settingsNamespace(), fieldRendererSettingKey(), {
    name: "DF_PARTICLE_EFFECTS.SETTINGS.fieldRenderer.name",
    hint: "DF_PARTICLE_EFFECTS.SETTINGS.fieldRenderer.hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      [FIELD_RENDER_SHADER]: "DF_PARTICLE_EFFECTS.SETTINGS.fieldRenderer.shader",
      [FIELD_RENDER_LEGACY]: "DF_PARTICLE_EFFECTS.SETTINGS.fieldRenderer.legacy",
    },
    default: FIELD_RENDER_SHADER,
    onChange: () => renderer.syncScene(),
  });
}

function collectActiveBehaviors(scene, preview = null) {
  const active = [];
  let sawPreview = false;
  for (const region of scene.regions ?? []) {
    for (const behavior of region.behaviors ?? []) {
      if (behavior?.type !== behaviorTypeId()) continue;
      const usePreview = preview && behaviorKey(behavior) === preview.key;
      if (usePreview) sawPreview = true;
      const entry = describeBehavior(scene, region, behavior, usePreview ? preview.config : null);
      if (entry) active.push(entry);
    }
  }
  if (preview && !sawPreview) {
    const region = preview.behavior?.parent;
    const regionScene = region?.parent;
    if (region && regionScene?.id === scene.id) {
      const entry = describeBehavior(scene, region, preview.behavior, preview.config);
      if (entry) active.push(entry);
    }
  }
  return active;
}

function describeBehavior(scene, region, behavior, configOverride) {
  try {
    const config = configOverride ?? readConfig(behavior);
    if (!config.enabled || config.effectType === EFFECT_NONE) return null;
    if (![EFFECT_NATURAL_FIRE, EFFECT_ICE, EFFECT_SMOKE].includes(config.effectType)) {
      if (!configOverride) {
        console.warn(
          `${LOG_PREFIX} effect type "${config.effectType}" is not implemented. That behavior was skipped.`,
        );
      }
      return null;
    }
    const tree = region.polygonTree;
    if (!tree || typeof tree.testPoint !== "function") {
      console.warn(`${LOG_PREFIX} region ${region.id} has no polygon tree. Fire was skipped.`);
      return null;
    }
    if (tree.isEmpty) return null;
    const bounds = copyBounds(tree.bounds);
    const area = Number(tree.area) || 0;
    if (!bounds || !(area > 0)) return null;
    return {
      key: behaviorKey(behavior, region),
      region,
      behavior,
      tree,
      bounds,
      area,
      config,
      elevation: visualElevation(region),
      seed: layoutSeed(scene, region, behavior, config.randomSeed),
    };
  } catch (error) {
    console.warn(`${LOG_PREFIX} skipped region ${region?.id}.`, error);
    return null;
  }
}

/** Fields that change placement or backend. Speed and opacity animate without a rebuild. */
export function fireLayoutSignature(config) {
  return [
    config.enabled ? 1 : 0,
    config.effectType,
    config.fireStyle,
    config.arrangement,
    config.fieldRenderer,
    config.density,
    config.flameScale,
    config.emberAmount,
    config.edgeFade,
    config.randomSeed ?? "",
  ].join("|");
}

function behaviorKey(behavior, region = behavior?.parent) {
  return behavior?.uuid || `${region?.id}:${behavior?.id}`;
}

function createEffect(entry, assets, grid, maxFlames, maxEmbers, limits) {
  if (entry.config.effectType === EFFECT_ICE) return createIce(entry, grid);
  if (entry.config.effectType === EFFECT_SMOKE) return createSmoke(entry, grid);
  if (usesBallOfFire(entry.config)) return createBallOfFire(entry, assets, grid);

  const fadeRadius = (clampNumber(entry.config.edgeFade, 0, 100) / 100) * grid.size * entry.config.flameScale;
  const siteOptions = {
    bounds: entry.bounds,
    contains: (x, y) => entry.tree.testPoint({ x, y }),
    seed: entry.seed,
    edgeFactor: (x, y) => edgeFactor(entry.tree, x, y, fadeRadius),
  };

  const shaderField = usesShaderField(entry.config);
  let sites;
  if (entry.config.arrangement === ARRANGEMENT_SINGLE) {
    sites = planSingleFlameSite(siteOptions);
  } else if (shaderField) {
    const emberWanted = Math.min(
      maxEmbers,
      wantedEmberCount(entry.config, 0, entry.area, grid.cellArea),
    );
    sites = emberWanted > 0
      ? planSparseSites({
        ...siteOptions,
        area: entry.area,
        cellArea: grid.cellArea,
        wanted: emberWanted,
      })
      : [{ x: entry.bounds.x + entry.bounds.width / 2, y: entry.bounds.y + entry.bounds.height / 2, edge: 1 }];
  } else {
    sites = planFlameSites({
      ...siteOptions,
      area: entry.area,
      cellArea: grid.cellArea,
      density: entry.config.density,
      maxFlames,
    });
  }

  if (!sites.length && !shaderField) return null;
  if (shaderField && entry.config.density <= 0) return null;

  const mask = buildRegionMask(entry.tree);
  if (!mask) {
    console.warn(`${LOG_PREFIX} region mask could not be built. Fire was skipped so it cannot spill outside.`);
    return null;
  }

  try {
    return new NaturalFireEffect({
      assets,
      sites,
      emberCount: Math.min(
        maxEmbers,
        wantedEmberCount(entry.config, sites.length, entry.area, grid.cellArea),
      ),
      config: entry.config,
      gridSize: grid.size,
      seed: entry.seed,
      mask,
      bounds: entry.bounds,
      useShaderField: shaderField,
    });
  } catch (error) {
    if (!shaderField) throw error;
    console.warn(`${LOG_PREFIX} Field shader failed; falling back to legacy sprites for this region.`, error);
    // The failed effect destroys its mask; build a fresh one for legacy.
    const legacyMask = buildRegionMask(entry.tree);
    if (!legacyMask) return null;
    const legacySites = planFlameSites({
      ...siteOptions,
      area: entry.area,
      cellArea: grid.cellArea,
      density: entry.config.density,
      maxFlames: Math.max(1, maxFlames || limits?.perRegionFlames || 40),
    });
    if (!legacySites.length) {
      legacyMask.destroy?.();
      return null;
    }
    return new NaturalFireEffect({
      assets,
      sites: legacySites,
      emberCount: Math.min(maxEmbers, wantedEmberCount({
        ...entry.config,
        fieldRenderer: FIELD_RENDER_LEGACY,
      }, legacySites.length, entry.area, grid.cellArea)),
      config: { ...entry.config, fieldRenderer: FIELD_RENDER_LEGACY },
      gridSize: grid.size,
      seed: entry.seed,
      mask: legacyMask,
      bounds: entry.bounds,
      useShaderField: false,
    });
  }
}

/**
 * Radial shader with no sprites. It has no sprite fallback: campfires are not the
 * same look, so a failure skips this region (logged by the caller).
 */
function createBallOfFire(entry, assets, grid) {
  const mask = buildRegionMask(entry.tree);
  if (!mask) {
    console.warn(`${LOG_PREFIX} region mask could not be built. Fire was skipped so it cannot spill outside.`);
    return null;
  }
  return new NaturalFireEffect({
    assets,
    sites: [],
    emberCount: 0,
    config: entry.config,
    gridSize: grid.size,
    seed: entry.seed,
    mask,
    bounds: entry.bounds,
    surfaceStyle: entry.config.fireStyle,
  });
}

/** Shader-only ice surface. Without a loaded background it still draws, as a tint. */
function createIce(entry, grid) {
  const mask = buildRegionMask(entry.tree);
  if (!mask) {
    console.warn(`${LOG_PREFIX} region mask could not be built. Ice was skipped so it cannot spill outside.`);
    return null;
  }
  const depth = computeEdgeDepth(entry.bounds, (x, y) => entry.tree.testPoint({ x, y }));
  const background = resolveSceneBackground();
  try {
    return new IceEffect({
      config: entry.config,
      bounds: entry.bounds,
      mask,
      gridSize: grid.size,
      seed: entry.seed,
      depth,
      background,
      startedAt: entry.freezeStart,
    });
  } catch (error) {
    if (!mask.destroyed) mask.destroy?.();
    throw error;
  }
}

/** Shader-only smoke or fog, faded toward the region edge. */
function createSmoke(entry, grid) {
  const mask = buildRegionMask(entry.tree);
  if (!mask) {
    console.warn(`${LOG_PREFIX} region mask could not be built. Smoke was skipped so it cannot spill outside.`);
    return null;
  }
  try {
    return new SmokeEffect({
      config: entry.config,
      bounds: entry.bounds,
      mask,
      gridSize: grid.size,
      seed: entry.seed,
      depth: computeEdgeDepth(entry.bounds, (x, y) => entry.tree.testPoint({ x, y })),
    });
  } catch (error) {
    if (!mask.destroyed) mask.destroy?.();
    throw error;
  }
}

/**
 * Opaque mask from the region polygon tree.
 * Foundry 14 replaces PIXI.Graphics with SmoothGraphics, which does not expose poly/cut.
 * The original Pixi class is PIXI.LegacyGraphics. Holes are cut() after fill().
 */
export function buildRegionMask(tree) {
  const painter = resolveMaskPainter(globalThis.PIXI);
  if (!painter) {
    warnMaskOnce(
      `${LOG_PREFIX} PIXI graphics has no poly/cut. Fire was skipped so it cannot spill outside.`,
    );
    return null;
  }

  const operations = regionMaskOperations(tree);
  if (!operations.some((operation) => operation.op === "fill")) return null;

  let graphics;
  try {
    graphics = new painter.Ctor();
    if ("eventMode" in graphics) graphics.eventMode = "none";
    const draw = painter.mode === "context" ? graphics.context : graphics;
    if (painter.mode === "legacy-hole") drawLegacyHoleMask(graphics, operations);
    else drawCutMask(draw, operations);
    return graphics;
  } catch (error) {
    warnMaskOnce(`${LOG_PREFIX} region mask failed.`);
    console.warn(LOG_PREFIX, error);
    try {
      graphics?.destroy?.();
    } catch {
      /* already broken */
    }
    return null;
  }
}

let maskWarningShown = false;

function warnMaskOnce(message) {
  if (maskWarningShown) return;
  maskWarningShown = true;
  console.warn(message);
}

/**
 * Pick a graphics class that can fill a polygon and cut holes out of it.
 * LegacyGraphics is checked first because Foundry's PIXI.Graphics is SmoothGraphics.
 */
export function resolveMaskPainter(pixi) {
  const candidates = [pixi?.LegacyGraphics, pixi?.Graphics].filter((Ctor) => typeof Ctor === "function");
  for (const Ctor of candidates) {
    if (isCutPainter(Ctor.prototype)) return { Ctor, mode: "prototype" };
  }
  for (const Ctor of candidates) {
    let graphics;
    try {
      graphics = new Ctor();
    } catch {
      continue;
    }
    let mode = null;
    if (isCutPainter(graphics)) mode = "instance";
    else if (isCutPainter(graphics.context)) mode = "context";
    else if (typeof graphics.drawPolygon === "function" && typeof graphics.beginHole === "function") mode = "legacy-hole";
    try {
      graphics.destroy?.();
    } catch {
      /* probe only */
    }
    if (mode) return { Ctor, mode };
  }
  return null;
}

function isCutPainter(target) {
  return Boolean(target)
    && typeof target.poly === "function"
    && typeof target.cut === "function"
    && typeof target.fill === "function";
}

function drawCutMask(draw, operations) {
  for (const operation of operations) {
    draw.poly(Array.from(operation.points));
    if (operation.op === "fill") draw.fill({ color: 0xffffff, alpha: 1 });
    else draw.cut();
  }
}

function drawLegacyHoleMask(graphics, operations) {
  let filling = false;
  for (const operation of operations) {
    if (operation.op === "fill") {
      if (filling) graphics.endFill?.();
      graphics.beginFill?.(0xffffff, 1);
      filling = true;
      graphics.drawPolygon(Array.from(operation.points));
    } else if (filling) {
      graphics.beginHole?.();
      graphics.drawPolygon(Array.from(operation.points));
      graphics.endHole?.();
    }
  }
  if (filling) graphics.endFill?.();
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

export function readConfig(behavior) {
  const system = behavior.system ?? {};
  const rawSeed = system.randomSeed;
  const randomSeed =
    rawSeed == null || rawSeed === "" || Number(rawSeed) === 0 || !Number.isFinite(Number(rawSeed))
      ? null
      : Math.floor(Number(rawSeed));
  return {
    enabled: system.enabled !== false && behavior.disabled !== true,
    effectType: system.effectType || EFFECT_NATURAL_FIRE,
    fireStyle: resolveFireStyle(system.fireStyle),
    arrangement: system.arrangement === ARRANGEMENT_SINGLE ? ARRANGEMENT_SINGLE : ARRANGEMENT_FIELD,
    fieldRenderer: readFieldRenderer(),
    density: clampNumber(system.density ?? 40, 0, 100),
    flameScale: clampNumber(system.flameScale ?? 1, 0.25, 2),
    flameSpeed: clampNumber(system.flameSpeed ?? 1, 0.1, 3),
    opacity: clampNumber(system.opacity ?? 0.9, 0, 1),
    emberAmount: clampNumber(system.emberAmount ?? 20, 0, 100),
    edgeFade: clampNumber(system.edgeFade ?? 5, 0, 100),
    freezeMode: oneOf(system.freezeMode, [FREEZE_ONCE, FREEZE_INSTANT, FREEZE_LOOP]),
    freezeDuration: clampNumber(system.freezeDuration ?? 2, 0.2, 20),
    holdTime: clampNumber(system.holdTime ?? 2.5, 0, 30),
    loopReset: oneOf(system.loopReset, [LOOP_RESET_THAW, LOOP_RESET_FADE]),
    edgeBias: clampNumber(system.edgeBias ?? 70, 0, 100),
    crystalSize: clampNumber(system.crystalSize ?? 1, 0.25, 3),
    refraction: clampNumber(system.refraction ?? 40, 0, 100),
    smokeColor: readColor(system.smokeColor, SMOKE_DEFAULT_COLOR),
    smokeDensity: clampNumber(system.smokeDensity ?? 60, 0, 100),
    smokeScale: clampNumber(system.smokeScale ?? 1, 0.25, 3),
    driftSpeed: clampNumber(system.driftSpeed ?? 0.5, 0, 3),
    driftDirection: clampNumber(system.driftDirection ?? 90, 0, 360),
    edgeSoftness: clampNumber(system.edgeSoftness ?? 1, 0, 5),
    randomSeed,
  };
}

/** "#rrggbb" from a stored string or Foundry Color (a Number subclass). */
function readColor(value, fallback) {
  if (typeof value === "number" || value instanceof Number) {
    const number = Number(value);
    if (Number.isInteger(number) && number >= 0 && number <= 0xffffff) return `#${number.toString(16).padStart(6, "0")}`;
    return fallback;
  }
  const text = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

/** The value if it is allowed, otherwise the first (default) choice. */
function oneOf(value, allowed) {
  return allowed.includes(value) ? value : allowed[0];
}

function readFieldRenderer() {
  const selected = globalThis.game?.settings?.get?.(settingsNamespace(), fieldRendererSettingKey());
  return selected === FIELD_RENDER_LEGACY ? FIELD_RENDER_LEGACY : FIELD_RENDER_SHADER;
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
  const selected = globalThis.game?.settings?.get?.(settingsNamespace(), qualitySettingKey());
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
