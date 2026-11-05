/**
 * P0: Limited / Breath charges must not be spent before Not-a-Target or
 * cancellable Breath attribute dialogs abort the declaration.
 *
 * Exercises the real `createAttackCard` executor path (not only a local harness).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLimitedCharge,
  isLimitedChargeAvailable,
  spendLimitedCharge,
} from '../src/combat/limited-charge.js';
import {
  assertDragonBreathAvailable,
  spendDragonBreathUse,
} from '../src/combat/artifact-rest-uses.js';
import * as limitedCharge from '../src/combat/limited-charge.js';
import * as artifactRestUses from '../src/combat/artifact-rest-uses.js';
import * as stoneCombatEffects from '../src/stones/stone-combat-effects.js';
import { createAttackCard } from '../src/combat/attack-executor.js';

function makeActor(flags: Record<string, unknown> = {}) {
  const store: Record<string, any> = { 'mastery-system': { ...flags } };
  return {
    id: 'attacker-1',
    name: 'Hero',
    type: 'character',
    system: {
      mastery: { rank: 4 },
      attributes: { might: { value: 4 }, agility: { value: 3 } },
      health: { bars: [{ current: 10, max: 10 }], currentBar: 0 },
    },
    flags: store,
    getFlag(scope: string, key: string) {
      return store[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      if (!store[scope]) store[scope] = {};
      store[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (store[scope]) delete store[scope][key];
    },
    items: [],
  };
}

function makeToken(actor: any, id: string) {
  return {
    id,
    actor,
    actorLink: true,
    document: { id },
  };
}

describe('P0 Limited / Breath spend ordering', () => {
  beforeEach(async () => {
    const a = makeActor();
    await clearLimitedCharge(a);
    vi.restoreAllMocks();
  });

  it('Limited charge remains available until spendLimitedCharge is called', async () => {
    const actor = makeActor();
    expect(isLimitedChargeAvailable(actor)).toBe(true);
    expect(isLimitedChargeAvailable(actor)).toBe(true);
    const spent = await spendLimitedCharge(actor);
    expect(spent.ok).toBe(true);
    expect(isLimitedChargeAvailable(actor)).toBe(false);
  });

  it('Breath availability can be asserted without spending', async () => {
    const actor = makeActor({
      artifactRestUses: { dragonBreath: { used: 0 } },
      artifactCombatUses: {},
    });
    (globalThis as any).game = { combat: { id: 'c1' } };
    expect(assertDragonBreathAvailable(actor).ok).toBe(true);
    expect(assertDragonBreathAvailable(actor).ok).toBe(true);
    expect(await spendDragonBreathUse(actor)).toBe(true);
    expect(assertDragonBreathAvailable(actor).ok).toBe(false);
  });
});

describe('P0 createAttackCard executor — cancel does not consume resources', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).ui = { notifications: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } };
    (globalThis as any).Hooks = { callAll: vi.fn(), on: vi.fn(), once: vi.fn() };
    (globalThis as any).game = {
      combat: { id: 'c1', round: 1, combatants: [] },
      actors: { get: () => null },
      user: { id: 'u1', isGM: true },
    };
  });

  it('Breath attribute Dialog cancel does not call spendDragonBreathUse', async () => {
    const attacker = makeActor({
      artifactRestUses: { dragonBreath: { used: 0 } },
      artifactCombatUses: {},
    });
    const target = makeActor();
    target.id = 'target-1';
    target.name = 'Foe';
    target.type = 'npc';

    const spendSpy = vi.spyOn(artifactRestUses, 'spendDragonBreathUse');
    (globalThis as any).Dialog = {
      wait: vi.fn(async () => null), // user closed / cancelled
      confirm: vi.fn(async () => false),
    };

    const result = await createAttackCard(
      makeToken(attacker, 'tok-atk'),
      makeToken(target, 'tok-tgt'),
      {
        id: 'breath-1',
        name: 'Breath Weapon',
        source: 'power',
        slot: 'attack',
        artifactFunctionId: 'dragon-breath',
        dragonHeadBreathMode: 'damage',
      } as any,
      'melee',
    );

    expect(result).toBeNull();
    expect(spendSpy).not.toHaveBeenCalled();
    expect(assertDragonBreathAvailable(attacker).ok).toBe(true);
  });

  it('Not-a-Target abort does not call spendLimitedCharge', async () => {
    const attacker = makeActor();
    const target = makeActor();
    target.id = 'target-1';
    target.name = 'Foe';
    target.type = 'npc';
    target.getFlag = () => ({ blocked: true });

    const spendSpy = vi.spyOn(limitedCharge, 'spendLimitedCharge');
    vi.spyOn(stoneCombatEffects, 'notATargetDecision').mockReturnValue({
      block: true,
      reason: 'Not a Target.',
      next: null,
    } as any);

    const result = await createAttackCard(
      makeToken(attacker, 'tok-atk'),
      makeToken(target, 'tok-tgt'),
      {
        id: 'lim-1',
        name: 'Limited Strike',
        source: 'power',
        slot: 'attack',
        limited: true,
        artifactLimited: true,
      } as any,
      'melee',
    );

    expect(result).toBeNull();
    expect(spendSpy).not.toHaveBeenCalled();
    expect(isLimitedChargeAvailable(attacker)).toBe(true);
  });
});
