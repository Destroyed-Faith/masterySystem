/**
 * Scene lighting — Foundry integration.
 *
 * Persists the GM's lighting mode on the Scene, derives the effective state
 * (AUTO → current Watch), maps it onto Foundry's native darkness / global
 * illumination for rendering, and caps the *rendered* vision radius of
 * player tokens without ever rewriting their 60 m baseline. Mechanical
 * perception (Combat Senses, Surprise, Grapple's unaware hint, stealth) does
 * not read any of this.
 */

import {
  describeLighting,
  effectiveSightRangeM,
  foundryEnvironmentForLighting,
  isLightingState,
  lightingStateForManualMode,
  normalizeLightingMode,
  NORMAL_VISION_RANGE_M,
  resolveLightingState,
  watchFromHour,
  type LightingMode,
  type LightingState,
  type LightingStatus,
  type WatchIndex,
} from './scene-lighting.js';
import { normalizeCombatSensesData } from '../combat/combat-sense-collection.js';

export const LIGHTING_MODE_FLAG = 'lightingMode';
export const LIGHTING_STATE_FLAG = 'lightingState';

function g(): any {
  return globalThis as any;
}

function readSceneFlag(scene: any, key: string): unknown {
  try {
    const viaGet = scene?.getFlag?.('mastery-system', key);
    if (viaGet !== undefined) return viaGet;
  } catch {
    /* fall through */
  }
  return scene?.flags?.['mastery-system']?.[key];
}

export function getSceneLightingMode(scene: any): LightingMode {
  return normalizeLightingMode(readSceneFlag(scene, LIGHTING_MODE_FLAG));
}

/** Last effective state written on the scene (fallback when the Watch is unknown). */
export function getStoredSceneLightingState(scene: any): LightingState | null {
  const raw = readSceneFlag(scene, LIGHTING_STATE_FLAG);
  return isLightingState(raw) ? raw : null;
}

/**
 * Current Watch from the Tyhra calendar, or null when the calendar is off /
 * unavailable. Reads the world setting directly so every client agrees.
 */
export function getCurrentWatch(): WatchIndex | null {
  try {
    const settings = g().game?.settings;
    if (!settings?.get) return null;
    if (settings.get('mastery-system', 'calendarEnabled') === false) return null;
    const hour = Number(settings.get('mastery-system', 'currentHour'));
    if (!Number.isFinite(hour)) return null;
    return watchFromHour(hour, 40);
  } catch {
    return null;
  }
}

/** Effective lighting state of a scene (manual override, else Watch, else stored). */
export function getSceneLightingState(scene: any): LightingState | null {
  const mode = getSceneLightingMode(scene);
  return resolveLightingState(mode, getCurrentWatch(), getStoredSceneLightingState(scene));
}

export function getSceneLightingStatus(scene: any): LightingStatus {
  const mode = getSceneLightingMode(scene);
  const watch = getCurrentWatch();
  const state = resolveLightingState(mode, watch, getStoredSceneLightingState(scene));
  return describeLighting(mode, watch, state);
}

export function actorHasDarkvision(actor: any): boolean {
  return normalizeCombatSensesData(actor?.system?.combatSenses).hasDarkvision === true;
}

/**
 * Rendered sight cap (metres) for a token under the scene state. Player
 * tokens keep their configured range when it is lower; NPC tokens and
 * tokens without vision are not touched. Null = no cap.
 */
export function renderedSightCapM(tokenDoc: any, state: LightingState | null): number | null {
  if (!state) return null;
  if (!tokenDoc?.sight?.enabled) return null;
  const actor = tokenDoc.actor ?? null;
  const darkvision = actorHasDarkvision(actor);
  const cap = effectiveSightRangeM(state, { darkvision });
  return Math.min(cap, NORMAL_VISION_RANGE_M);
}

/* -------------------------------------------- */
/*  Writes (GM)                                  */
/* -------------------------------------------- */

function readDarkness(scene: any): number | null {
  const env = scene?.environment;
  if (env && typeof env.darknessLevel === 'number') return env.darknessLevel;
  if (typeof scene?.darkness === 'number') return scene.darkness;
  return null;
}

function readGlobalLight(scene: any): boolean | null {
  const env = scene?.environment;
  if (env?.globalLight && typeof env.globalLight.enabled === 'boolean') return env.globalLight.enabled;
  if (typeof scene?.globalLight === 'boolean') return scene.globalLight;
  return null;
}

/** Scene update that renders `state`, or null when the scene already matches. */
export function planSceneRenderUpdate(scene: any, state: LightingState): Record<string, unknown> | null {
  const want = foundryEnvironmentForLighting(state);
  const update: Record<string, unknown> = {};
  const hasEnvironment = !!scene?.environment && typeof scene.environment === 'object';
  const darkness = readDarkness(scene);
  if (darkness === null || Math.abs(darkness - want.darknessLevel) > 0.001) {
    update[hasEnvironment ? 'environment.darknessLevel' : 'darkness'] = want.darknessLevel;
  }
  const globalLight = readGlobalLight(scene);
  if (globalLight === null || globalLight !== want.globalLight) {
    update[hasEnvironment ? 'environment.globalLight.enabled' : 'globalLight'] = want.globalLight;
  }
  if (getStoredSceneLightingState(scene) !== state) {
    update[`flags.mastery-system.${LIGHTING_STATE_FLAG}`] = state;
  }
  return Object.keys(update).length ? update : null;
}

function canWriteScene(scene: any): boolean {
  const user = g().game?.user;
  if (!user) return true;
  if (user.isGM) return true;
  return typeof scene?.canUserModify === 'function' ? !!scene.canUserModify(user, 'update') : false;
}

/** Re-render vision on this client after lighting changed. */
export function refreshVisionRendering(): void {
  try {
    const canvas = g().canvas;
    if (!canvas?.ready) return;
    canvas.perception?.update?.({ initializeVision: true, refreshVision: true, refreshLighting: true });
  } catch (err) {
    console.warn('Mastery System | vision refresh failed', err);
  }
}

/**
 * Apply the effective state to the scene's native lighting. Returns the
 * state applied, or null when it is unknown (AUTO without Watch and no stored
 * state) — nothing is invented in that case.
 */
export async function applySceneLighting(scene: any): Promise<LightingState | null> {
  if (!scene) return null;
  const state = getSceneLightingState(scene);
  if (!state) return null;
  if (!canWriteScene(scene)) return state;
  const update = planSceneRenderUpdate(scene, state);
  if (update) {
    try {
      await scene.update(update);
    } catch (err) {
      console.warn('Mastery System | scene lighting update failed', err);
    }
  }
  return state;
}

/** GM control: persist the mode and render immediately. */
export async function setSceneLightingMode(scene: any, mode: LightingMode): Promise<LightingStatus | null> {
  if (!scene) return null;
  if (!canWriteScene(scene)) {
    g().ui?.notifications?.warn?.('Only the GM can change scene lighting.');
    return null;
  }
  const next = normalizeLightingMode(mode);
  const update: Record<string, unknown> = { [`flags.mastery-system.${LIGHTING_MODE_FLAG}`]: next };
  const manual = lightingStateForManualMode(next);
  const state = manual ?? resolveLightingState(next, getCurrentWatch(), getStoredSceneLightingState(scene));
  if (state) {
    const render = planSceneRenderUpdate(scene, state);
    if (render) Object.assign(update, render);
  }
  try {
    await scene.update(update);
  } catch (err) {
    console.warn('Mastery System | scene lighting mode update failed', err);
    return null;
  }
  return getSceneLightingStatus(scene);
}

/* -------------------------------------------- */
/*  Rendering cap on token vision sources        */
/* -------------------------------------------- */

let visionPatchInstalled = false;

/**
 * Cap the rendered vision radius by the Mastery effective sight range. The
 * token document keeps its 60 m; only the runtime vision source shrinks.
 * Guarded: if this Foundry build has no `_getVisionSourceData`, rendering
 * falls back to native darkness handling and the Mastery layer still holds
 * the effective range for rules purposes.
 */
export function installVisionRangeCap(): boolean {
  if (visionPatchInstalled) return true;
  try {
    const TokenClass = g().CONFIG?.Token?.objectClass;
    const proto = TokenClass?.prototype;
    if (!proto || typeof proto._getVisionSourceData !== 'function') {
      console.info('Mastery System | Token vision source hook unavailable — lighting renders via scene darkness only.');
      return false;
    }
    const original = proto._getVisionSourceData;
    proto._getVisionSourceData = function masteryCappedVisionSourceData(this: any, ...args: unknown[]) {
      const data = original.apply(this, args);
      try {
        const scene = this.document?.parent ?? g().canvas?.scene;
        const capM = renderedSightCapM(this.document, getSceneLightingState(scene));
        if (capM === null || !data || typeof data !== 'object') return data;
        const capPx = typeof this.getLightRadius === 'function' ? this.getLightRadius(capM) : null;
        if (typeof capPx !== 'number' || !Number.isFinite(capPx)) return data;
        if (typeof data.radius === 'number' && data.radius > capPx) data.radius = capPx;
        // Lit areas stay visible up to the normal baseline, never beyond it.
        const litPx = typeof this.getLightRadius === 'function' ? this.getLightRadius(NORMAL_VISION_RANGE_M) : null;
        if (typeof litPx === 'number' && typeof data.lightRadius === 'number' && data.lightRadius > litPx) {
          data.lightRadius = litPx;
        }
      } catch (err) {
        console.warn('Mastery System | vision cap failed', err);
      }
      return data;
    };
    visionPatchInstalled = true;
    return true;
  } catch (err) {
    console.warn('Mastery System | could not install vision range cap', err);
    return false;
  }
}

/* -------------------------------------------- */
/*  Hooks                                        */
/* -------------------------------------------- */

let hooksRegistered = false;

export function registerSceneLightingHooks(): void {
  if (hooksRegistered) return;
  hooksRegistered = true;
  const Hooks = g().Hooks;
  if (!Hooks?.on) return;

  const applyToViewedScene = async (): Promise<void> => {
    const scene = g().canvas?.scene ?? g().game?.scenes?.viewed ?? null;
    if (!scene) return;
    if (!g().game?.user?.isGM) {
      refreshVisionRendering();
      return;
    }
    await applySceneLighting(scene);
    refreshVisionRendering();
  };

  Hooks.on('canvasReady', () => {
    void applyToViewedScene();
  });

  // AUTO follows the Watch: the calendar hour / day are world settings.
  Hooks.on('updateSetting', (setting: any) => {
    const key = String(setting?.key ?? '');
    if (key !== 'mastery-system.currentHour' && key !== 'mastery-system.currentDayIndex' && key !== 'mastery-system.calendarEnabled') return;
    void applyToViewedScene();
    try {
      g().ui?.controls?.render?.();
    } catch {
      /* controls may not be rendered */
    }
  });

  // Another client changed the mode: re-render our vision and the toolbar.
  Hooks.on('updateScene', (scene: any, changes: any) => {
    const flags = changes?.flags?.['mastery-system'];
    if (!flags || (flags[LIGHTING_MODE_FLAG] === undefined && flags[LIGHTING_STATE_FLAG] === undefined)) return;
    if (String(scene?.id) !== String(g().canvas?.scene?.id)) return;
    refreshVisionRendering();
    try {
      g().ui?.controls?.render?.();
    } catch {
      /* ignore */
    }
  });
}
