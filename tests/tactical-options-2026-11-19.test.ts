/**
 * Playtest tactical options — All-Out Attack, Attack Action Transfer, Shared Free Raises.
 */
import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  (globalThis as any).game = (globalThis as any).game ?? {
    combat: null,
    actors: { get: () => null },
    user: { isGM: true },
  };
  (globalThis as any).canvas = (globalThis as any).canvas ?? {
    tokens: { placeables: [] },
    grid: { size: 100, measureDistance: () => 0 },
    scene: { grid: { distance: 1.5 } },
  };
  (globalThis as any).Hooks = (globalThis as any).Hooks ?? { callAll: () => undefined };
});
import {
  applyAllOutArmorPenalty,
  applyAllOutEvadePenalty,
  allOutDamageBonusDice,
  readAllOutAttack,
  TACTICAL_COORDINATION_RANGE_M,
} from '../src/combat/tactical-options.js';
import {
  highestExtraAttackGrant,
  syncPcExtraAttackTotal,
  type RoundState,
} from '../src/combat/action-economy.js';
import { getTargetArmor, getTargetEvade } from '../src/combat/target-defenses.js';
import { resolveArtifactItemDeliveryContribution } from '../src/combat/artifact-delivery-damage.js';

function mockActor(id: string, opts?: { armor?: number; evade?: number; rs?: Partial<RoundState> }) {
  const roundState: RoundState = {
    combatId: 'c1',
    round: 1,
    turn: 0,
    isPC: true,
    movementActions: { total: 1, used: 0 },
    attackActions: { total: 1, used: 0 },
    reactionActions: { total: 1, used: 0 },
    moveBonusMeters: 0,
    stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
    ...(opts?.rs || {}),
  };
  const flags: Record<string, any> = { 'mastery-system': { roundState } };
  return {
    id,
    type: 'character',
    name: id,
    system: {
      combat: {
        armorTotal: opts?.armor ?? 4,
        armorFromActiveBuffs: 0,
        evadeTotal: opts?.evade ?? 10,
        evadeFromActiveBuffs: 0,
      },
    },
    getFlag: (scope: string, key: string) => flags[scope]?.[key],
    setFlag: async (scope: string, key: string, value: unknown) => {
      if (!flags[scope]) flags[scope] = {};
      flags[scope][key] = value;
    },
    _flags: flags,
  };
}

describe('All-Out Attack (playtest)', () => {
  it('adds +1d8 when declared and applies Armor or Evade penalty with floor 0', () => {
    const rsArmor = {
      allOutAttack: { active: true as const, penalty: 'armor' as const },
    };
    const rsEvade = {
      allOutAttack: { active: true as const, penalty: 'evade' as const },
    };
    expect(allOutDamageBonusDice(rsArmor as any)).toBe(1);
    expect(applyAllOutArmorPenalty(3, rsArmor as any)).toBe(0);
    expect(applyAllOutArmorPenalty(0, rsArmor as any)).toBe(0);
    expect(applyAllOutEvadePenalty(5, rsEvade as any)).toBe(3);
    expect(readAllOutAttack(rsArmor as any)).toEqual({ active: true, armorSteps: 1, evadeSteps: 0 });
  });

  it('stacks Armor and Evade steps: +1d8 and −4 Armor / −2 Evade per step', () => {
    const rs = { allOutAttack: { active: true as const, armorSteps: 2, evadeSteps: 3 } };
    expect(allOutDamageBonusDice(rs as any)).toBe(5);
    expect(applyAllOutArmorPenalty(9, rs as any)).toBe(1);
    expect(applyAllOutEvadePenalty(8, rs as any)).toBe(2);
    expect(readAllOutAttack({ allOutAttack: { active: true, armorSteps: 0, evadeSteps: 0 } } as any)).toBeNull();
  });

  it('wires into getTargetArmor / getTargetEvade', () => {
    (globalThis as any).game.combat = { id: 'c1', round: 1, combatants: [] };
    const actor = mockActor('a1', {
      armor: 6,
      evade: 12,
      rs: { allOutAttack: { active: true, penalty: 'armor' } },
    });
    expect(getTargetArmor(actor)).toBe(2);
    const actor2 = mockActor('a2', {
      armor: 6,
      evade: 12,
      rs: { allOutAttack: { active: true, penalty: 'evade' } },
    });
    expect(getTargetEvade(actor2)).toBe(10);
    (globalThis as any).game.combat = null;
  });

  it('is not an Active Buff — RoundState field is separate from activeBuffUsedThisRound', () => {
    const rs: RoundState = {
      combatId: 'c1',
      round: 1,
      turn: 0,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      allOutAttack: { active: true, penalty: 'evade' },
      activeBuffUsedThisRound: false,
    };
    expect(readAllOutAttack(rs)?.active).toBe(true);
    expect(rs.activeBuffUsedThisRound).toBe(false);
  });
});

describe('Regular Attack Action Transfer (playtest)', () => {
  it('syncPcExtraAttackTotal adds donatedAttackActions on top of Extra Attack', () => {
    const rs: RoundState = {
      combatId: 'c1',
      round: 1,
      turn: 0,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      stoneBonuses: {
        extraAttacks: 2,
        extraReactions: 0,
        extraMoveMeters: 0,
        donatedAttackActions: 1,
      },
    };
    syncPcExtraAttackTotal(rs);
    // 1 base + Extra Attack 2 + 1 donated = 4
    expect(rs.attackActions.total).toBe(4);
  });

  it('donated actions do not compete inside highestExtraAttackGrant; range is 20 m', () => {
    expect(highestExtraAttackGrant([2, 1, 0])).toBe(2);
    expect(TACTICAL_COORDINATION_RANGE_M).toBe(20);
  });
});

describe('Artifact Damage Only preference', () => {
  it('uses complete Weapon/Artifact Damage for Spell when both WD and SF exist', () => {
    const item = {
      id: 'gs',
      type: 'artifact',
      name: 'Moonlight Greatsword',
      system: {
        equipped: true,
        currentLevel: 4,
        baseProfile: 'twoHandedWeapon',
        artifactWeapon: { damage: '8d8' },
        baseValues: [
          { slot: 'a', type: 'weaponDamage', value: '8d8' },
          { slot: 'b', type: 'spellFocus', value: 4 },
        ],
      },
    };
    const spell = resolveArtifactItemDeliveryContribution(item, 'spell');
    expect(spell?.kind).toBe('weaponDamage');
    expect(spell?.dice).toBe(8);
  });
});
