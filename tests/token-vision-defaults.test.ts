import { afterEach, describe, expect, it } from 'vitest';

import {
  PLAYER_VISION_DEFAULTS,
  applyPlayerVisionToCreateData,
  defaultPlayerSight,
  planPlayerSightUpdate,
  planPrototypeVisionUpdate,
  planTokenCreateSightUpdate,
  runPlayerVisionDefaultsMigration,
} from '../src/vision/token-vision-defaults.js';
import { evaluatePerceptionGate, targetUnseenByObserver } from '../src/combat/perception-gate.js';
import { detectTargetUnaware } from '../src/contests/contest-card.js';
import {
  LIGHT_SOURCE_PROFILES,
  collectPointLightSources,
  foundryLightDataForProfile,
  lightingStateAtPoint,
} from '../src/vision/light-sources.js';

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

function mockActor(type: string, sight: any, flags: Record<string, unknown> = {}) {
  const actor: any = {
    id: `${type}-1`,
    name: type,
    type,
    system: { mastery: { rank: 2 } },
    prototypeToken: { sight },
    flags: { 'mastery-system': { ...flags } },
    getFlag(ns: string, key: string) {
      return actor.flags[ns]?.[key];
    },
    update: async (patch: Record<string, unknown>) => applyDotted(actor, patch),
  };
  return actor;
}

afterEach(() => {
  delete g.game;
  delete g.canvas;
});

describe('Player token vision defaults', () => {
  it('a new player character receives Vision on, 60 m, 360°, Basic Vision', () => {
    const data: any = { name: 'New', type: 'character' };
    applyPlayerVisionToCreateData('character', data);
    expect(data.prototypeToken.sight).toEqual({ enabled: true, range: 60, angle: 360, visionMode: 'basic' });
    expect(data.flags['mastery-system'].visionInitialized).toBe(true);
    expect(PLAYER_VISION_DEFAULTS).toEqual({ enabled: true, range: 60, angle: 360, visionMode: 'basic' });
  });

  it('creation data that already sets parts of sight keeps them', () => {
    expect(defaultPlayerSight({ range: 20, angle: 90, visionMode: 'darkvision' })).toEqual({
      enabled: true,
      range: 20,
      angle: 90,
      visionMode: 'darkvision',
    });
  });

  it('NPC creation data is not touched', () => {
    const data: any = { name: 'Wolf', type: 'npc' };
    applyPlayerVisionToCreateData('npc', data);
    expect(data.prototypeToken).toBeUndefined();
    expect(planTokenCreateSightUpdate('npc', { sight: { enabled: false, range: 0 } })).toBeNull();
  });

  it('an existing zero / uninitialized player prototype token is normalized', () => {
    expect(planPlayerSightUpdate({ enabled: false, range: 0, angle: 360, visionMode: 'basic' })).toEqual({
      'sight.enabled': true,
      'sight.range': 60,
    });
    expect(planPlayerSightUpdate(undefined)).toEqual({
      'sight.enabled': true,
      'sight.range': 60,
      'sight.angle': 360,
      'sight.visionMode': 'basic',
    });
    const actor = mockActor('character', { enabled: false, range: 0, angle: 360, visionMode: 'basic' });
    expect(planPrototypeVisionUpdate(actor)).toEqual({
      'flags.mastery-system.visionInitialized': true,
      'prototypeToken.sight.enabled': true,
      'prototypeToken.sight.range': 60,
    });
  });

  it('deliberately customized token sight is preserved', () => {
    expect(planPlayerSightUpdate({ enabled: true, range: 12, angle: 90, visionMode: 'monochromatic' })).toBeNull();
    const custom = mockActor('character', { enabled: true, range: 12, angle: 90, visionMode: 'monochromatic' });
    // Only the marker is written; the sight block is not part of the update.
    const plan = planPrototypeVisionUpdate(custom);
    expect(plan).toEqual({ 'flags.mastery-system.visionInitialized': true });
    // A GM who later sets range 0 on an initialized actor keeps 0.
    const later = mockActor('character', { enabled: false, range: 0 }, { visionInitialized: true });
    expect(planPrototypeVisionUpdate(later)).toBeNull();
  });

  it('the ready migration normalizes characters once and leaves NPCs alone', async () => {
    g.game = { user: { isGM: true } };
    const pc = mockActor('character', { enabled: false, range: 0, angle: 360, visionMode: 'basic' });
    const npc = mockActor('npc', { enabled: false, range: 0 });
    const custom = mockActor('character', { enabled: true, range: 30, angle: 360, visionMode: 'basic' });
    const n = await runPlayerVisionDefaultsMigration([pc, npc, custom]);
    expect(n).toBe(1);
    expect(pc.prototypeToken.sight).toEqual({ enabled: true, range: 60, angle: 360, visionMode: 'basic' });
    expect(npc.prototypeToken.sight).toEqual({ enabled: false, range: 0 });
    expect(custom.prototypeToken.sight.range).toBe(30);
    expect(await runPlayerVisionDefaultsMigration([pc, npc, custom])).toBe(0);
  });

  it('placed player tokens with sight 0 get the baseline on creation', () => {
    expect(planTokenCreateSightUpdate('character', { sight: { enabled: false, range: 0 } })).toEqual({
      'sight.enabled': true,
      'sight.range': 60,
      'sight.angle': 360,
      'sight.visionMode': 'basic',
    });
    expect(planTokenCreateSightUpdate('character', { sight: { enabled: true, range: 60, angle: 360, visionMode: 'basic' } })).toBeNull();
  });
});

describe('Foundry Token Vision is not the Combat Sense system', () => {
  const npcNoVision = {
    id: 'npc-1',
    name: 'Guard',
    type: 'npc',
    system: { mastery: { rank: 2 } },
    prototypeToken: { sight: { enabled: false, range: 0 } },
    items: [],
    getFlag: () => undefined,
  };
  const pc = {
    id: 'pc-1',
    name: 'Bjorn',
    type: 'character',
    system: { mastery: { rank: 2 } },
    prototypeToken: { sight: { enabled: true, range: 60 } },
    items: [],
    getFlag: () => undefined,
  };

  it('an NPC with Foundry vision disabled still perceives through Normal Combat Awareness', () => {
    const gate = evaluatePerceptionGate(npcNoVision, pc);
    expect(gate.canTarget).toBe(true);
    expect(gate.needsPerceptionCheck).toBe(false);
    expect(targetUnseenByObserver(npcNoVision, pc)).toBe(false);
  });

  it('Grapple / Surprise unaware suggestion does not infer blindness from disabled NPC Token Vision', async () => {
    expect(await detectTargetUnaware(pc, npcNoVision)).toBe(false);
    expect(await detectTargetUnaware(npcNoVision, pc)).toBe(false);
  });
});

describe('Light source profiles', () => {
  it('Candle 2/4, Torch 8/16, Lantern 12/24', () => {
    expect(LIGHT_SOURCE_PROFILES.candle).toMatchObject({ brightM: 2, dimM: 4 });
    expect(LIGHT_SOURCE_PROFILES.torch).toMatchObject({ brightM: 8, dimM: 16 });
    expect(LIGHT_SOURCE_PROFILES.lantern).toMatchObject({ brightM: 12, dimM: 24 });
    expect(foundryLightDataForProfile(LIGHT_SOURCE_PROFILES.torch)).toMatchObject({ bright: 8, dim: 16 });
    expect(foundryLightDataForProfile(LIGHT_SOURCE_PROFILES.lantern)).toMatchObject({ bright: 12, dim: 24 });
    expect(foundryLightDataForProfile(LIGHT_SOURCE_PROFILES.candle)).toMatchObject({ bright: 2, dim: 4 });
  });

  it('bright radius counts as Daylight, dim radius as Dim Light, outside falls back to the scene', () => {
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
    const torch = [{ x: 0, y: 0, brightM: 8, dimM: 16 }];
    expect(lightingStateAtPoint('darkness', torch, { x: 5, y: 0 }, dist)).toBe('daylight');
    expect(lightingStateAtPoint('darkness', torch, { x: 12, y: 0 }, dist)).toBe('dim');
    expect(lightingStateAtPoint('darkness', torch, { x: 20, y: 0 }, dist)).toBe('darkness');
    expect(lightingStateAtPoint('night', torch, { x: 20, y: 0 }, dist)).toBe('night');
    // Light never darkens: Daylight scene stays Daylight in a torch's dim ring.
    expect(lightingStateAtPoint('daylight', torch, { x: 12, y: 0 }, dist)).toBe('daylight');
  });

  it('collects native light sources from ambient lights and lit tokens', () => {
    const scene = {
      lights: [{ x: 10, y: 20, config: { bright: 12, dim: 24 } }, { x: 0, y: 0, hidden: true, config: { bright: 8, dim: 16 } }],
      tokens: [{ x: 5, y: 5, light: { bright: 2, dim: 4 } }, { x: 9, y: 9, light: { bright: 0, dim: 0 } }],
    };
    expect(collectPointLightSources(scene)).toEqual([
      { x: 10, y: 20, brightM: 12, dimM: 24 },
      { x: 5, y: 5, brightM: 2, dimM: 4 },
    ]);
  });
});
