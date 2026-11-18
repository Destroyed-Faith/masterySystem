import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAvailableAttackActions,
  spendAttackAction,
  hasPowerBeenUsedThisRound,
  isRepeatableAttackPower,
  markPowerUsedThisRound,
  powerUseTemplateId,
} from '../src/combat/action-economy.js';
import { isAttackPowerTemplateId } from '../src/utils/attack-power.js';

function power(id: string, templateId: string, extra: Record<string, unknown> = {}) {
  return { id, type: 'power', name: id, system: { templateId, ...extra } };
}

function makeActor(items: any[]) {
  const map = new Map(items.map((i) => [i.id, i]));
  const flags: Record<string, any> = {};
  return {
    id: 'actor1',
    type: 'character',
    items: Object.assign(map, { contents: items }),
    getFlag: (_s: string, k: string) => flags[k],
    setFlag: async (_s: string, k: string, v: any) => { flags[k] = v; },
    unsetFlag: async (_s: string, k: string) => { delete flags[k]; },
    system: {},
  } as any;
}

describe('Actives v0.9.9.6 — repeatable Attack Powers', () => {
  beforeEach(() => {
    const g = globalThis as any;
    g.game = { user: { id: 'gm', isGM: true }, combat: null, settings: { get: () => undefined }, actors: { get: () => null } };
    g.canvas = { ready: false, tokens: { placeables: [] } };
    g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
    g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
    g.foundry = { utils: { duplicate: (v: unknown) => JSON.parse(JSON.stringify(v)), deepClone: (v: unknown) => JSON.parse(JSON.stringify(v)) } };
  });

  it('classifies exactly the six Attack Power families (plus legacy Damage + Special)', () => {
    for (const id of [
      'active-melee-weapon-single', 'active-ranged-weapon-single',
      'active-melee-weapon-aoe', 'active-ranged-weapon-aoe',
      'active-melee-weapon-split', 'active-ranged-weapon-split',
      'active-ranged-weapon-autofire',
      'active-melee-instant-special-t4', 'active-ranged-instant-special-t6',
      'active-melee-aoe-damage-t3', 'active-ranged-aoe-damage-t5',
      'active-melee-damage-t4',
    ]) {
      expect(isAttackPowerTemplateId(id), id).toBe(true);
    }
    for (const id of [
      'active-melee-limited-single', 'active-ranged-limited-aoe',
      'active-ranged-zone-t4', 'active-ranged-barrier', 'active-ranged-illusion-image',
      'active-mental-control', 'active-mental-attack', 'active-mind-probe',
      'active-melee-health-level-heal', 'active-ranged-single-cleanse',
      'active-melee-control-push-pull', 'active-ranged-damage-stunned',
      'active-melee-single-target-damage-transfer', 'ab-armor',
    ]) {
      expect(isAttackPowerTemplateId(id), id).toBe(false);
    }
  });

  it('never locks an Attack Power after use; other Actives keep the once-per-Round lock', async () => {
    const actor = makeActor([
      power('atk', 'active-melee-weapon-single'),
      power('stspec', 'active-ranged-instant-special-t4', { chosenSpecial: { key: 'ruin', tier: 4 } }),
      power('barrier', 'active-ranged-barrier'),
      power('zone', 'active-ranged-zone-t4'),
      power('lim', 'active-melee-limited-single', { limited: true }),
    ]);
    const combat = { id: 'c1', round: 1, turn: 0, combatants: [] } as any;

    expect(isRepeatableAttackPower(actor, 'atk')).toBe(true);
    expect(isRepeatableAttackPower(actor, 'stspec')).toBe(true);
    expect(isRepeatableAttackPower(actor, 'barrier')).toBe(false);
    expect(isRepeatableAttackPower(actor, 'zone')).toBe(false);
    expect(isRepeatableAttackPower(actor, 'lim')).toBe(false);

    await markPowerUsedThisRound(actor, combat, 'atk');
    await markPowerUsedThisRound(actor, combat, 'atk');
    expect(hasPowerBeenUsedThisRound(actor, combat, 'atk')).toBe(false);
    expect(hasPowerBeenUsedThisRound(actor, combat, 'stspec')).toBe(false);
  });

  it('Support / Barrier / Image / Mental / Zones keep the once-per-Round lock', async () => {
    const actor = makeActor([
      power('barrier', 'active-ranged-barrier'),
      power('image', 'active-ranged-illusion-image'),
      power('mind', 'active-mental-control'),
      power('zone', 'active-ranged-zone-t4'),
      power('cleanse', 'active-ranged-single-cleanse'),
    ]);
    const combat = { id: 'c2', round: 1, turn: 0, combatants: [] } as any;
    for (const id of ['barrier', 'image', 'mind', 'zone', 'cleanse']) {
      expect(isRepeatableAttackPower(actor, id), id).toBe(false);
      await markPowerUsedThisRound(actor, combat, id);
      expect(hasPowerBeenUsedThisRound(actor, combat, id), id).toBe(true);
    }
  });

  it('each repeated use still needs its own Attack Action', async () => {
    const actor = makeActor([power('atk', 'active-melee-weapon-single')]);
    const combat = { id: 'c3', round: 1, turn: 0, combatants: [] } as any;
    const start = getAvailableAttackActions(actor, combat);
    expect(start).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < start; i++) {
      expect(await spendAttackAction(actor, combat)).toBe(true);
      await markPowerUsedThisRound(actor, combat, 'atk');
      expect(hasPowerBeenUsedThisRound(actor, combat, 'atk')).toBe(false);
    }
    expect(getAvailableAttackActions(actor, combat)).toBe(0);
    expect(await spendAttackAction(actor, combat)).toBe(false);
  });

  it('resolves artifact slot grants to their row template', () => {
    const artifact = {
      id: 'art1',
      type: 'artifact',
      name: 'Staff',
      system: {
        currentLevel: 4,
        levelProgression: [
          { level: 1, name: 'Strike I', type: 'Active', powerTemplateId: 'active-ranged-instant-special-t4' },
          { level: 2, name: 'Wall I', type: 'Active', powerTemplateId: 'active-ranged-barrier' },
          { level: 4, name: 'Strike II', type: 'Active', powerTemplateId: 'active-ranged-instant-special-t4' },
        ],
      },
    };
    const actor = makeActor([artifact]);
    expect(powerUseTemplateId(actor, 'artifact:art1:slot:0')).toBe('active-ranged-instant-special-t4');
    expect(isRepeatableAttackPower(actor, 'artifact:art1:slot:0')).toBe(true);
    expect(isRepeatableAttackPower(actor, 'artifact:art1:slot:1')).toBe(false);
  });
});
