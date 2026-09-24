import { afterEach, describe, expect, it } from 'vitest';

import {
  DARKVISION_RANGE_M,
  NORMAL_VISION_RANGE_M,
  describeLighting,
  effectiveSightRangeM,
  foundryEnvironmentForLighting,
  lightingStateForWatch,
  normalVisualRangeM,
  resolveLightingState,
  senseRangeUnderLighting,
  watchFromHour,
} from '../src/vision/scene-lighting.js';
import {
  applySceneLighting,
  getCurrentWatch,
  getSceneLightingState,
  getSceneLightingStatus,
  planSceneRenderUpdate,
  renderedSightCapM,
  setSceneLightingMode,
} from '../src/vision/scene-lighting-foundry.js';
import { COMBAT_SENSES, SENSE_SLOT_SPECIAL_IDS } from '../src/combat/combat-senses.js';

const g = globalThis as any;

function applyDotted(target: any, patch: Record<string, unknown>) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('.');
    let obj = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!;
      if (obj[key] == null || typeof obj[key] !== 'object') obj[key] = {};
      obj = obj[key];
    }
    obj[parts[parts.length - 1]!] = v;
  }
}

function mockScene(flags: Record<string, unknown> = {}) {
  const scene: any = {
    id: 's1',
    flags: { 'mastery-system': { ...flags } },
    environment: { darknessLevel: 0, globalLight: { enabled: true } },
    getFlag(ns: string, key: string) {
      return scene.flags[ns]?.[key];
    },
    updates: [] as Record<string, unknown>[],
    update: async (patch: Record<string, unknown>) => {
      scene.updates.push(patch);
      applyDotted(scene, patch);
    },
  };
  return scene;
}

function setWorldClock(hour: number | null, enabled = true) {
  g.game = {
    user: { id: 'gm', isGM: true },
    settings: {
      get: (_scope: string, key: string) => {
        if (key === 'calendarEnabled') return enabled;
        if (key === 'currentHour') return hour;
        return undefined;
      },
    },
  };
}

afterEach(() => {
  delete g.game;
});

describe('Watch → lighting (AUTO)', () => {
  it('splits the 40-hour day into four Watches', () => {
    expect(watchFromHour(0)).toBe(0);
    expect(watchFromHour(9)).toBe(0);
    expect(watchFromHour(10)).toBe(1);
    expect(watchFromHour(19)).toBe(1);
    expect(watchFromHour(20)).toBe(2);
    expect(watchFromHour(29)).toBe(2);
    expect(watchFromHour(30)).toBe(3);
    expect(watchFromHour(39)).toBe(3);
    expect(watchFromHour(99)).toBe(3);
  });

  it('First and Second Watch are Daylight, Third is Dim Light, Fourth is Night', () => {
    expect(lightingStateForWatch(0)).toBe('daylight');
    expect(lightingStateForWatch(1)).toBe('daylight');
    expect(lightingStateForWatch(2)).toBe('dim');
    expect(lightingStateForWatch(3)).toBe('night');
    expect(resolveLightingState('auto', 0)).toBe('daylight');
    expect(resolveLightingState('auto', 1)).toBe('daylight');
    expect(resolveLightingState('auto', 2)).toBe('dim');
    expect(resolveLightingState('auto', 3)).toBe('night');
  });

  it('manual modes ignore the Watch', () => {
    for (const watch of [0, 1, 2, 3] as const) {
      expect(resolveLightingState('day', watch)).toBe('daylight');
      expect(resolveLightingState('dim', watch)).toBe('dim');
      expect(resolveLightingState('night', watch)).toBe('night');
      expect(resolveLightingState('dark', watch)).toBe('darkness');
    }
  });

  it('AUTO without Watch information preserves the current state instead of inventing a time', () => {
    expect(resolveLightingState('auto', null, 'night')).toBe('night');
    expect(resolveLightingState('auto', null, null)).toBeNull();
  });

  it('reads the Watch from the world clock and reports null when the calendar is off', () => {
    setWorldClock(35);
    expect(getCurrentWatch()).toBe(3);
    setWorldClock(5);
    expect(getCurrentWatch()).toBe(0);
    setWorldClock(5, false);
    expect(getCurrentWatch()).toBeNull();
    delete g.game;
    expect(getCurrentWatch()).toBeNull();
  });

  it('describes the effective state for the GM', () => {
    expect(describeLighting('auto', 3, 'night').label).toBe('Lighting: AUTO — Fourth Watch → NIGHT');
    expect(describeLighting('dark', 1, 'darkness').label).toBe('Lighting: DARK — Manual Override');
    expect(describeLighting('auto', null, 'dim').label).toBe('Lighting: AUTO — no Watch information → DIM');
  });
});

describe('Visual range caps', () => {
  it('Daylight 60 m, Dim Light 30 m, Night 8 m, Total Darkness 0 m', () => {
    expect(normalVisualRangeM('daylight')).toBe(60);
    expect(normalVisualRangeM('dim')).toBe(30);
    expect(normalVisualRangeM('night')).toBe(8);
    expect(normalVisualRangeM('darkness')).toBe(0);
    expect(NORMAL_VISION_RANGE_M).toBe(60);
    expect(DARKVISION_RANGE_M).toBe(30);
  });

  it('Darkvision reaches 30 m through ordinary darkness without replacing the 60 m daylight baseline', () => {
    expect(effectiveSightRangeM('daylight', { darkvision: true })).toBe(60);
    expect(effectiveSightRangeM('dim', { darkvision: true })).toBe(30);
    expect(effectiveSightRangeM('night', { darkvision: true })).toBe(30);
    expect(effectiveSightRangeM('darkness', { darkvision: true })).toBe(30);
    expect(effectiveSightRangeM('night')).toBe(8);
    expect(effectiveSightRangeM('darkness')).toBe(0);
  });

  it('Special Combat Senses keep their listed range in darkness', () => {
    for (const id of SENSE_SLOT_SPECIAL_IDS) {
      expect(senseRangeUnderLighting(id, 'darkness')).toBe(COMBAT_SENSES[id].rangeM);
      expect(senseRangeUnderLighting(id, 'night')).toBe(COMBAT_SENSES[id].rangeM);
      expect(senseRangeUnderLighting(id, 'daylight')).toBe(COMBAT_SENSES[id].rangeM);
    }
    expect(senseRangeUnderLighting('tremorSense', 'darkness')).toBe(20);
    expect(senseRangeUnderLighting('lifeSense', 'darkness')).toBe(30);
    expect(senseRangeUnderLighting('sonarSense', 'darkness')).toBe(30);
    expect(senseRangeUnderLighting('normalCombatAwareness', 'darkness')).toBe(0);
    expect(senseRangeUnderLighting('normalCombatAwareness', 'darkness', { darkvision: true })).toBe(30);
  });

  it('maps states onto Foundry darkness / global illumination', () => {
    expect(foundryEnvironmentForLighting('daylight')).toEqual({ darknessLevel: 0, globalLight: true });
    expect(foundryEnvironmentForLighting('dim').globalLight).toBe(true);
    expect(foundryEnvironmentForLighting('night').globalLight).toBe(false);
    expect(foundryEnvironmentForLighting('darkness')).toEqual({ darknessLevel: 1, globalLight: false });
  });
});

describe('Scene lighting persistence and rendering', () => {
  it('old scenes default to AUTO; an existing Mastery value is kept', () => {
    setWorldClock(15);
    expect(getSceneLightingStatus(mockScene()).mode).toBe('auto');
    expect(getSceneLightingStatus(mockScene({ lightingMode: 'dark' })).mode).toBe('dark');
    expect(getSceneLightingStatus(mockScene({ lightingMode: 'bogus' })).mode).toBe('auto');
  });

  it('AUTO derives the state from the Watch; manual override wins', () => {
    setWorldClock(35);
    expect(getSceneLightingState(mockScene())).toBe('night');
    expect(getSceneLightingState(mockScene({ lightingMode: 'day' }))).toBe('daylight');
    setWorldClock(2);
    expect(getSceneLightingState(mockScene())).toBe('daylight');
    expect(getSceneLightingState(mockScene({ lightingMode: 'dark' }))).toBe('darkness');
  });

  it('setting a manual mode writes the flag and the native lighting in one update', async () => {
    setWorldClock(2);
    const scene = mockScene();
    const status = await setSceneLightingMode(scene, 'dark');
    expect(status?.label).toBe('Lighting: DARK — Manual Override');
    expect(scene.flags['mastery-system'].lightingMode).toBe('dark');
    expect(scene.flags['mastery-system'].lightingState).toBe('darkness');
    expect(scene.environment.darknessLevel).toBe(1);
    expect(scene.environment.globalLight.enabled).toBe(false);
    expect(scene.updates).toHaveLength(1);
  });

  it('switching the Watch re-renders the scene but never touches token sight ranges', async () => {
    setWorldClock(2);
    const scene = mockScene();
    const token = { sight: { enabled: true, range: 60, angle: 360, visionMode: 'basic' }, actor: { type: 'character', system: {} } };
    scene.tokens = [token];
    expect(await applySceneLighting(scene)).toBe('daylight');
    setWorldClock(35);
    expect(await applySceneLighting(scene)).toBe('night');
    expect(scene.environment.globalLight.enabled).toBe(false);
    expect(token.sight.range).toBe(60);
    // Rendering cap is derived, not written.
    expect(renderedSightCapM(token, 'night')).toBe(8);
    expect(renderedSightCapM(token, 'daylight')).toBe(60);
    expect(token.sight.range).toBe(60);
  });

  it('does not re-write a scene that already renders the state', async () => {
    setWorldClock(2);
    const scene = mockScene({ lightingState: 'daylight' });
    expect(planSceneRenderUpdate(scene, 'daylight')).toBeNull();
    await applySceneLighting(scene);
    expect(scene.updates).toHaveLength(0);
  });

  it('AUTO with no Watch and no stored state leaves the scene untouched', async () => {
    setWorldClock(null, false);
    const scene = mockScene();
    expect(await applySceneLighting(scene)).toBeNull();
    expect(scene.updates).toHaveLength(0);
    const kept = mockScene({ lightingState: 'dim' });
    expect(await applySceneLighting(kept)).toBe('dim');
  });

  it('rendered cap: Darkvision tokens see 30 m in the dark, NPC tokens without vision are not capped', () => {
    const dv = { sight: { enabled: true, range: 60 }, actor: { type: 'character', system: { combatSenses: { hasDarkvision: true } } } };
    expect(renderedSightCapM(dv, 'darkness')).toBe(30);
    expect(renderedSightCapM(dv, 'daylight')).toBe(60);
    const npc = { sight: { enabled: false, range: 0 }, actor: { type: 'npc', system: {} } };
    expect(renderedSightCapM(npc, 'darkness')).toBeNull();
  });
});
