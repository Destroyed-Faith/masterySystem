/**
 * Tests for the universal four-Rank Stone Powers (`src/stones/stone-powers.ts`).
 *
 * Coverage:
 *   - Registry shape: 8 pools (generic + 7 attributes), 4 powers each.
 *   - Every power has exactly 4 published Ranks. No Rank 5.
 *   - Normal costs 1 / 2 / 4 / 8 (1 / 3 / 7 / 15 total); Premium costs
 *     2 / 4 / 6 / 8 (2 / 6 / 12 / 20 total).
 *   - apply() for every power × every Rank runs without throwing on a
 *     mock actor/combatant and writes only into stoneBonuses or flags.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  PREMIUM_STONE_POWER_IDS,
  STONE_POWERS,
  STONE_POWERS_BY_ATTRIBUTE,
  STONE_TIER_HARD_MAX,
  STONE_TIER_PRACTICAL_MAX,
  completeStoneRankPayment,
  cumulativeStoneCostForRank,
  highestCompleteStoneTierFromPlaced,
  isPremiumStonePower,
  partitionStoneLanesByCompleteRanks,
  resolveOncePerCombatStoneTier,
  scaleStoneTier,
  stonePowerRankCost,
  tierForUseIndex,
  type StonePower,
} from '../src/stones/stone-powers';
import { calculateStoneCost } from '../src/combat/action-economy';

const POOL_KEYS = ['generic', 'might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'] as const;

// ---- Mock Foundry globals just well enough for apply() to run ------------------

interface MockActor {
  name: string;
  system: any;
  _flags: Record<string, any>;
  _roundState: any;
  getFlag: (ns: string, k: string) => any;
  setFlag: (ns: string, k: string, v: any) => Promise<void>;
  unsetFlag: (ns: string, k: string) => Promise<void>;
  update: (data: Record<string, any>) => Promise<void>;
  heal: (amount: number) => Promise<void>;
}

interface MockCombatant {
  _flags: Record<string, any>;
  initiative: number | null;
  getFlag: (ns: string, k: string) => any;
  setFlag: (ns: string, k: string, v: any) => Promise<void>;
  update: (data: Record<string, any>) => Promise<void>;
}

function makeMockActor(): MockActor {
  const actor: MockActor = {
    name: 'Test Hero',
    system: {
      // Canonical Temp-HP field is `tempHP` (capital P) — the damage pipeline
      // and stone powers read/write that spelling.
      health: {
        tempHP: 0,
        scarred: 1,
        // One Scarred Bar (index 0) + the active bar — Remove Scar needs a
        // depleted bar it can reopen.
        bars: [
          { max: 20, current: 0 },
          { max: 20, current: 10 },
        ],
        currentBar: 1,
      },
      stonePools: { vitality: { current: 2, max: 3, sustained: 0, sealed: 0, burned: 0 } },
      mastery: { rank: 2 },
      statusEffects: [{ id: 'ruin', name: 'Ruin (X)', value: 6 }],
    },
    _flags: {},
    // Pretend we are a linked token actor so `getActionEconomyActor` short-circuits
    // and never touches the canvas / world actor lookup.
    // @ts-expect-error — mock-only helper field
    token: { document: { actorLink: true } },
    _roundState: {
      combatId: 'combat-1',
      round: 1,
      turn: 0,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
    },
    getFlag(ns, k) {
      if (ns !== 'mastery-system') return undefined;
      if (k === 'roundState') return this._roundState;
      return this._flags[k];
    },
    async setFlag(ns, k, v) {
      if (ns !== 'mastery-system') return;
      if (k === 'roundState') this._roundState = v;
      else this._flags[k] = v;
    },
    async unsetFlag(ns, k) {
      if (ns !== 'mastery-system') return;
      if (k === 'roundState') this._roundState = null;
      else delete this._flags[k];
    },
    async update(data) {
      for (const [path, value] of Object.entries(data)) {
        const segments = path.split('.');
        let target: any = this;
        for (let i = 0; i < segments.length - 1; i++) {
          const seg = segments[i];
          if (target[seg] == null) target[seg] = {};
          target = target[seg];
        }
        target[segments[segments.length - 1]] = value;
      }
    },
    async heal(amount) {
      this.system.health.current = (this.system.health.current ?? 0) + amount;
    },
  };
  // `type` is needed by isPC checks elsewhere.
  (actor as any).type = 'character';
  return actor;
}

function makeMockCombatant(): MockCombatant {
  const c: MockCombatant = {
    _flags: {},
    initiative: 10,
    getFlag(ns, k) {
      if (ns !== 'mastery-system') return undefined;
      return this._flags[k];
    },
    async setFlag(ns, k, v) {
      if (ns !== 'mastery-system') return;
      this._flags[k] = v;
    },
    async update(data) {
      if ('initiative' in data) this.initiative = data.initiative as number;
    },
  };
  return c;
}

// Patch globals: `game`, `ui`, `canvas`, and `Roll`.
function installFoundryGlobals() {
  (globalThis as any).game = {
    combat: { id: 'combat-1', round: 1, turn: 0 },
    user: { isGM: true },
  };
  (globalThis as any).canvas = { tokens: { placeables: [] } };
  (globalThis as any).Hooks = { callAll: vi.fn() };
  (globalThis as any).ui = {
    notifications: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
  // Tiny Roll stub: 4d8 → returns total = 4 * 5 (predictable).
  (globalThis as any).Roll = class MockRoll {
    formula: string;
    total: number = 0;
    constructor(formula: string) {
      this.formula = formula;
    }
    async evaluate(_opts?: any) {
      const m = /^(\d+)d(\d+)$/.exec(this.formula.trim());
      if (!m) {
        this.total = 0;
      } else {
        const dice = Number(m[1]);
        const sides = Number(m[2]);
        this.total = dice * Math.floor((sides + 1) / 2); // mean per die
      }
      return this;
    }
  };
}

beforeEach(() => {
  installFoundryGlobals();
});

// ---- Tests ---------------------------------------------------------------------

describe('Stone Powers — pool layout (new spec)', () => {
  it('exposes exactly 8 pools (generic + 7 attributes)', () => {
    const actualKeys = Object.keys(STONE_POWERS_BY_ATTRIBUTE).sort();
    expect(actualKeys).toEqual([...POOL_KEYS].sort());
  });

  it.each(POOL_KEYS)('pool "%s" has 4 powers', (poolKey) => {
    const powers = (STONE_POWERS_BY_ATTRIBUTE as any)[poolKey] as StonePower[];
    expect(powers).toHaveLength(4);
  });

  it('total registry has 32 powers (8 pools × 4)', () => {
    expect(Object.keys(STONE_POWERS)).toHaveLength(32);
  });

  it('Resolve pool leads with the Premium ability', () => {
    const ids = STONE_POWERS_BY_ATTRIBUTE.resolve.map((p) => p.id);
    expect(ids[0]).toBe('resolve.damageReduction');
    expect(ids).toEqual([
      'resolve.damageReduction',
      'resolve.healing',
      'resolve.stressHealing',
      'resolve.ward',
    ]);
  });

  it('Vitality pool leads with the Premium ability', () => {
    const ids = STONE_POWERS_BY_ATTRIBUTE.vitality.map((p) => p.id);
    expect(ids[0]).toBe('vitality.damageNegation');
    expect(ids).toEqual([
      'vitality.damageNegation',
      'vitality.tempHp',
      'vitality.removeScar',
      'vitality.extendActiveBuff',
    ]);
  });

  it('Might pool leads with Parry (Premium)', () => {
    const ids = STONE_POWERS_BY_ATTRIBUTE.might.map((p) => p.id);
    expect(ids[0]).toBe('might.parry');
    expect(ids).toEqual(['might.parry', 'might.meleeDamage', 'might.armor', 'might.ignoreArmor']);
  });

  it('each attribute list leads with its Premium ability', () => {
    expect(STONE_POWERS_BY_ATTRIBUTE.generic[0].id).toBe('generic.extraAttack');
    expect(STONE_POWERS_BY_ATTRIBUTE.agility[0].id).toBe('agility.crit');
    expect(STONE_POWERS_BY_ATTRIBUTE.intellect[0].id).toBe('intellect.spellAction');
    expect(STONE_POWERS_BY_ATTRIBUTE.influence[0].id).toBe('influence.notATarget');
    expect(STONE_POWERS_BY_ATTRIBUTE.wits[0].id).toBe('wits.phasing');
  });

  it('every registry key matches its power.id', () => {
    for (const [id, power] of Object.entries(STONE_POWERS)) {
      expect(power.id).toBe(id);
    }
  });
});

describe('Stone Powers — Rank table shape', () => {
  it.each(Object.values(STONE_POWERS).map((p) => [p.id, p]))(
    '"%s" publishes exactly four Ranks with description text',
    (_id, power) => {
      const p = power as StonePower;
      expect(p.tiers).toHaveLength(4);
      for (const tier of p.tiers) {
        expect(typeof tier.description).toBe('string');
        expect(tier.description.length).toBeGreaterThan(0);
        expect(typeof tier.label).toBe('string');
        expect(tier.label.length).toBeGreaterThan(0);
        expect(/ramp step/i.test(tier.description)).toBe(false);
      }
    },
  );

  it('compiled effect tooltip includes all four Ranks with cost markers', () => {
    for (const power of Object.values(STONE_POWERS)) {
      if (power.premium) {
        expect(power.effect).toContain('R1 (2)');
        expect(power.effect).toContain('R2 (4)');
        expect(power.effect).toContain('R3 (6)');
        expect(power.effect).toContain('R4 (8)');
      } else {
        expect(power.effect).toContain('R1 (1)');
        expect(power.effect).toContain('R2 (2)');
        expect(power.effect).toContain('R3 (4)');
        expect(power.effect).toContain('R4 (8)');
      }
      expect(power.effect).not.toContain('R5');
    }
  });

  it('exactly the eight PG Premium Abilities are premium', () => {
    expect([...PREMIUM_STONE_POWER_IDS].sort()).toEqual(
      [
        'generic.extraAttack',
        'might.parry',
        'agility.crit',
        'vitality.damageNegation',
        'intellect.spellAction',
        'resolve.damageReduction',
        'influence.notATarget',
        'wits.phasing',
      ].sort(),
    );
    for (const power of Object.values(STONE_POWERS)) {
      expect(power.premium).toBe(
        (PREMIUM_STONE_POWER_IDS as readonly string[]).includes(power.id),
      );
    }
  });
});

describe('Cost progression maps to Ranks', () => {
  it('Normal Abilities cost 1 / 2 / 4 / 8 (1 / 3 / 7 / 15 total)', () => {
    expect(calculateStoneCost(0)).toBe(1);
    expect(calculateStoneCost(1)).toBe(2);
    expect(calculateStoneCost(2)).toBe(4);
    expect(calculateStoneCost(3)).toBe(8);
    expect(calculateStoneCost(4)).toBe(0);
    expect(calculateStoneCost(5)).toBe(0);
    expect([1, 2, 3, 4].map((r) => stonePowerRankCost('might.armor', r))).toEqual([1, 2, 4, 8]);
    expect([1, 2, 3, 4].map((r) => cumulativeStoneCostForRank('might.armor', r))).toEqual([1, 3, 7, 15]);
    expect(stonePowerRankCost('might.armor', 5)).toBe(0);
  });

  it('Premium Abilities cost 2 / 4 / 6 / 8 (2 / 6 / 12 / 20 total)', () => {
    for (const id of PREMIUM_STONE_POWER_IDS) {
      expect(isPremiumStonePower(id)).toBe(true);
      expect([1, 2, 3, 4].map((r) => stonePowerRankCost(id, r))).toEqual([2, 4, 6, 8]);
      expect([1, 2, 3, 4].map((r) => cumulativeStoneCostForRank(id, r))).toEqual([2, 6, 12, 20]);
      expect(stonePowerRankCost(id, 5)).toBe(0);
    }
    expect(isPremiumStonePower('might.armor')).toBe(false);
    expect(isPremiumStonePower('resolve.healing')).toBe(false);
  });

  it('tierForUseIndex stops at Tier 4', () => {
    expect(tierForUseIndex(0)).toBe(1);
    expect(tierForUseIndex(1)).toBe(2);
    expect(tierForUseIndex(2)).toBe(3);
    expect(tierForUseIndex(3)).toBe(4);
    expect(tierForUseIndex(4)).toBe(4);
    expect(tierForUseIndex(99)).toBe(4);
    expect(STONE_TIER_HARD_MAX).toBe(4);
    expect(STONE_TIER_PRACTICAL_MAX).toBe(4);
  });

  it('tierForUseIndex floors negative / NaN inputs to T1', () => {
    expect(tierForUseIndex(-1)).toBe(1);
    expect(tierForUseIndex(-5)).toBe(1);
  });
});

describe('scaleStoneTier stops at the published sequence', () => {
  it('returns published T1–T4 values', () => {
    expect(scaleStoneTier([0, 1, 2, 3], 1)).toBe(0);
    expect(scaleStoneTier([0, 1, 2, 3], 4)).toBe(3);
    expect(scaleStoneTier([4, 8, 16, 32], 4)).toBe(32);
  });

  it('does not invent Tier 5 scaling', () => {
    expect(scaleStoneTier([4, 8, 16, 32], 5)).toBe(0);
    expect(scaleStoneTier([4, 8, 16, 32], 6)).toBe(0);
    expect(scaleStoneTier([20, 40, 80, 160], 5)).toBe(0);
    expect(scaleStoneTier([2, 4, 8, 16], 5)).toBe(0);
    expect(scaleStoneTier([0, 1, 2, 3], 5)).toBe(0);
    expect(scaleStoneTier([1, 2, 3], 4)).toBe(0);
  });
});

describe('apply() — runs cleanly across every power and Rank', () => {
  for (const [id, power] of Object.entries(STONE_POWERS)) {
    describe(id, () => {
      const publishedTiers = power.tiers.map((_, i) => i + 1);
      for (const tier of publishedTiers) {
        it(`rank ${tier} runs without throwing`, async () => {
          const actor = makeMockActor();
          const combatant = makeMockCombatant();
          const cost = stonePowerRankCost(id, tier);
          await expect(
            power.apply({ actor: actor as any, combatant: combatant as any, tier, cost }),
          ).resolves.toBeUndefined();
          // Power should have either touched roundState or set a flag — never both nothing.
          const sb = actor._roundState.stoneBonuses ?? {};
          const flagsTouched = Object.keys(actor._flags).length > 0 || Object.keys(combatant._flags).length > 0;
          const sbTouched = Object.entries(sb).some(([, v]) => typeof v === 'number' && v !== 0);
          const actionsTouched =
            actor._roundState.attackActions.total !== 1 ||
            actor._roundState.movementActions.total !== 1 ||
            actor._roundState.reactionActions.total !== 1 ||
            (actor._roundState.moveBonusMeters ?? 0) !== 0;
          const removedScar = (actor.system.health?.scarred ?? 1) !== 1;
          const grantedHp = (actor.system.health?.current ?? 0) > 0;
          const tempHpRaised = (actor.system.health?.tempHP ?? 0) > 0;
          const specialsTouched =
            !Array.isArray(actor.system.statusEffects) ||
            actor.system.statusEffects.length !== 1 ||
            (actor.system.statusEffects[0]?.value ?? 6) !== 6;
          const touched =
            sbTouched ||
            actionsTouched ||
            flagsTouched ||
            removedScar ||
            grantedHp ||
            tempHpRaised ||
            specialsTouched;
          expect(touched, `${id} T${tier} should affect actor state`).toBe(true);
        });
      }
    });
  }
});

describe('Generic powers — Extra Attack (Premium)', () => {
  it('has four real Ranks and Rank 1 costs 2 Stones', () => {
    const power = STONE_POWERS['generic.extraAttack'];
    expect(power.premium).toBe(true);
    expect(power.tiers).toHaveLength(4);
    expect(power.tiers.map((t) => t.value)).toEqual([1, 2, 3, 4]);
    expect(stonePowerRankCost('generic.extraAttack', 1)).toBe(2);
  });

  it('R1–R4 grant +1/+2/+3/+4 Attack Actions; Rank 5 adds nothing', async () => {
    const power = STONE_POWERS['generic.extraAttack'];
    for (const [tier, expected] of [[1, 1], [2, 2], [3, 3], [4, 4]] as const) {
      const actor = makeMockActor();
      await power.apply({ actor: actor as any, combatant: makeMockCombatant() as any, tier, cost: stonePowerRankCost(power.id, tier) });
      expect(actor._roundState.attackActions.total).toBe(1 + expected);
      expect(actor._roundState.stoneBonuses.extraAttacks).toBe(expected);
    }
    const capped = makeMockActor();
    await power.apply({ actor: capped as any, combatant: makeMockCombatant() as any, tier: 5, cost: 0 });
    expect(capped._roundState.stoneBonuses.extraAttacks).toBe(0);
  });
});

describe('Might — Martial Damage scales 2/4/8/16', () => {
  it.each([[1, 2], [2, 4], [3, 8], [4, 16]])('T%i adds %i melee damage dice', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['might.meleeDamage'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.meleeDamageBonusDice).toBe(expected);
    // Legacy mirror so existing damage-dialog keeps working.
    expect(actor._roundState.stoneBonuses.damageBonus).toBe(expected);
  });
});

describe('Agility — Evade scales 8/16/24/32', () => {
  it.each([[1, 8], [2, 16], [3, 24], [4, 32]])('T%i adds +%i evade', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['agility.evade'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.evadeBonus).toBe(expected);
  });
});

describe('Vitality — Temporary HP scales 20/40/80/160', () => {
  it('is once per combat', () => {
    expect(STONE_POWERS['vitality.tempHp'].oncePerCombat).toBe(true);
  });

  it.each([[1, 20], [2, 40], [3, 80], [4, 160]])('T%i grants %i temp HP', async (tier, expected) => {
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    await STONE_POWERS['vitality.tempHp'].apply({
      actor: actor as any,
      combatant: combatant as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor.system.health.tempHP).toBe(expected);
    expect(actor._roundState.stoneBonuses?.tempHpGrantedThisTurn ?? 0).toBe(0);
    expect(combatant._flags['msTempHpStoneUsed']).toBe(true);
  });

  it('refuses a second activation in the same combat', async () => {
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    const power = STONE_POWERS['vitality.tempHp'];
    await power.apply({ actor: actor as any, combatant: combatant as any, tier: 1, cost: 1 });
    await power.apply({ actor: actor as any, combatant: combatant as any, tier: 4, cost: 8 });
    expect(actor.system.health.tempHP).toBe(20);
    expect(combatant._flags['msTempHpStoneUsed']).toBe(true);
  });

  it('activateStonePower blocks a second Temporary HP use', async () => {
    const { activateStonePower } = await import('../src/stones/stone-activation');
    const { markTempHpStoneUsedThisCombat } = await import('../src/stones/colorless-stones');
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    await markTempHpStoneUsedThisCombat(combatant);
    const ok = await activateStonePower({
      actor: actor as any,
      combatant: combatant as any,
      abilityId: 'vitality.tempHp',
    });
    expect(ok).toBe(false);
    expect(actor.system.health.tempHP).toBe(0);
  });

  it('keeps Temp HP at turn end; combat end still wipes it', async () => {
    const { clearCombatStoneTurnBonusesForActor } = await import('../src/combat/action-economy');
    const { resetTempHpAfterCombat } = await import('../src/combat/combat-end-cleanup');
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    await STONE_POWERS['vitality.tempHp'].apply({
      actor: actor as any,
      combatant: combatant as any,
      tier: 2,
      cost: 2,
    });
    expect(actor.system.health.tempHP).toBe(40);
    actor._roundState.stoneBonuses.tempHpGrantedThisTurn = 40;
    actor._roundState.stoneBonuses.evadeBonus = 8;
    const combat = { id: 'combat-1', round: 1, turn: 0, combatants: [{ actor, id: 'c1' }] };
    await clearCombatStoneTurnBonusesForActor(actor as any, combat as any);
    expect(actor.system.health.tempHP).toBe(40);
    expect(actor._roundState.stoneBonuses.evadeBonus).toBe(0);
    await resetTempHpAfterCombat(combat);
    expect(actor.system.health.tempHP).toBe(0);
  });
});

describe('Vitality — Damage Negation (Premium, four Ranks)', () => {
  it('has four Ranks', () => {
    expect(STONE_POWERS['vitality.damageNegation'].premium).toBe(true);
    expect(STONE_POWERS['vitality.damageNegation'].tiers).toHaveLength(4);
  });

  it.each([[1, 4], [2, 8], [3, 12], [4, 16]])('R%i grants +%i Damage Negation', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['vitality.damageNegation'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: stonePowerRankCost('vitality.damageNegation', tier),
    });
    expect(actor._roundState.stoneBonuses.tempDamageNegation).toBe(expected);
  });
});

describe('Vitality — Extend Active Buff stores +1/+2/+3/+4 pending rounds', () => {
  it.each([[1, 1], [2, 2], [3, 3], [4, 4]])('T%i stores +%i rounds', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['vitality.extendActiveBuff'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.extendActiveBuffRounds).toBe(expected);
  });

  it('keeps the highest pending extension (totals, no stacking)', async () => {
    const actor = makeMockActor();
    const power = STONE_POWERS['vitality.extendActiveBuff'];
    await power.apply({ actor: actor as any, combatant: makeMockCombatant() as any, tier: 3, cost: 4 });
    await power.apply({ actor: actor as any, combatant: makeMockCombatant() as any, tier: 1, cost: 1 });
    expect(actor._roundState.stoneBonuses.extendActiveBuffRounds).toBe(3);
  });
});

describe('Intellect — Spell Raises scales +4/+8/+12/+16 Raise-TN bonus', () => {
  it.each([
    [1, 4],
    [2, 8],
    [3, 12],
    [4, 16],
  ])('T%i adds +%i to Raise TN check only', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['intellect.spellRaises'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.spellRaiseTnBonus).toBe(expected);
  });
});

describe('Intellect — Spell Resistance scales +4/+8/+12/+16', () => {
  it.each([[1, 4], [2, 8], [3, 12], [4, 16]])('T%i adds +%i Spell Resistance TN', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['intellect.spellResistance'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.spellResistanceBonus).toBe(expected);
  });
});

describe('Resolve — Stress Healing scales 1d8/2d8/3d8/4d8', () => {
  it.each([[1, 1, 2], [2, 2, 4], [3, 3, 8], [4, 4, 16]])(
    'T%i rolls %id8 and reaches %i m',
    async (tier, dice, meters) => {
      const actor = makeMockActor();
      actor.system.stress = {
        currentBar: 1,
        bars: [
          { name: 'S1', current: 12, max: 12 },
          { name: 'S2', current: 4, max: 12 },
        ],
      };
      await STONE_POWERS['resolve.stressHealing'].apply({
        actor: actor as any,
        combatant: makeMockCombatant() as any,
        tier,
        cost: 2 ** (tier - 1),
      });
      const pending = actor._flags.pendingStressHealing;
      expect(pending.dice).toBe(dice);
      expect(pending.range).toBe(meters);
      expect(pending.amount).toBe(dice * 4);
      expect(actor.system.stress.bars[1].current).toBeGreaterThan(4);
    },
  );
});

describe('Resolve — Damage Reduction (Premium, four Ranks)', () => {
  it('has four Ranks', () => {
    expect(STONE_POWERS['resolve.damageReduction'].premium).toBe(true);
    expect(STONE_POWERS['resolve.damageReduction'].tiers).toHaveLength(4);
  });

  it.each([[1, 10], [2, 20], [3, 30], [4, 40]])('R%i adds +%i%% DR', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['resolve.damageReduction'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: stonePowerRankCost('resolve.damageReduction', tier),
    });
    expect(actor._roundState.stoneBonuses.damageReductionBoostPct).toBe(expected);
  });
});

describe('isPremiumStonePower', () => {
  it('is true exactly for the eight PG Premium Abilities (aliases included)', () => {
    expect(isPremiumStonePower('wits.phasing')).toBe(true);
    expect(isPremiumStonePower('generic.extraAttack')).toBe(true);
    expect(isPremiumStonePower('intellect.spellAction')).toBe(true);
    expect(isPremiumStonePower('resolve.damageReduction')).toBe(true);
    expect(isPremiumStonePower('resolve.damageReductionBoost')).toBe(true);
    expect(isPremiumStonePower('agility.crit')).toBe(true);
    expect(isPremiumStonePower('might.parry')).toBe(true);
    expect(isPremiumStonePower('vitality.damageNegation')).toBe(true);
    expect(isPremiumStonePower('influence.notATarget')).toBe(true);
    expect(isPremiumStonePower('wits.initiativeBoost')).toBe(false);
    expect(isPremiumStonePower('wits.reactionRange')).toBe(false);
  });
});

describe('Wits — Phasing (Premium, four Ranks)', () => {
  it('once per combat; R1–R4 grant 1/2/3/4 charges; Rank 5 grants nothing', async () => {
    const power = STONE_POWERS['wits.phasing'];
    expect(power.premium).toBe(true);
    expect(power.oncePerCombat).toBe(true);
    expect(power.tiers.map((t) => t.value)).toEqual([1, 2, 3, 4]);

    for (const [tier, charges] of [[1, 1], [2, 2], [3, 3], [4, 4]] as const) {
      const actor = makeMockActor();
      const combatant = makeMockCombatant();
      await power.apply({
        actor: actor as any,
        combatant: combatant as any,
        tier,
        cost: stonePowerRankCost(power.id, tier),
      });
      const state = (actor as any).flags?.['mastery-system']?.phasingCharges;
      expect(state?.current).toBe(charges);
      expect(state?.max).toBe(charges);
    }
    const capped = makeMockActor();
    await power.apply({ actor: capped as any, combatant: makeMockCombatant() as any, tier: 5, cost: 0 });
    expect((capped as any).flags?.['mastery-system']?.phasingCharges).toBeUndefined();
  });
});

describe('once-per-combat highest complete Rank', () => {
  it('reads 1 / 3 / 7 / 15 Normal stones as R1 / R2 / R3 / R4', () => {
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 0)).toBe(0);
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 1)).toBe(1);
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 2)).toBe(1);
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 3)).toBe(2);
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 6)).toBe(2);
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 7)).toBe(3);
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 14)).toBe(3);
    expect(highestCompleteStoneTierFromPlaced('wits.initiativeBoost', 15)).toBe(4);
  });

  it('turns six Extra Attack stones into Rank 2, not a rejected first wave of two', () => {
    expect(completeStoneRankPayment('generic.extraAttack', 6, 0, 0)).toEqual({
      tier: 2,
      spendCount: 6,
      ranksGained: 2,
    });
    expect(completeStoneRankPayment('generic.extraAttack', 2, 0, 0)).toEqual({
      tier: 1,
      spendCount: 2,
      ranksGained: 1,
    });
    expect(completeStoneRankPayment('generic.extraAttack', 1, 0, 0)).toBeNull();
    expect(completeStoneRankPayment('generic.extraAttack', 7, 0, 0)).toEqual({
      tier: 2,
      spendCount: 6,
      ranksGained: 2,
    });
    expect(completeStoneRankPayment('generic.extraAttack', 20, 0, 0)).toEqual({
      tier: 4,
      spendCount: 20,
      ranksGained: 4,
    });
  });

  it('includes a free Support Rank once the paid ranks under it are covered', () => {
    expect(completeStoneRankPayment('generic.extraAttack', 2, 0, 2)).toEqual({
      tier: 2,
      spendCount: 2,
      ranksGained: 2,
    });
  });

  it('spends only the lanes of the complete ranks and leaves the rest', () => {
    const lanes = [0, 1, 2, 3, 4, 5, 6].map((lane) => ({ lane, attr: 'intellect' }));
    const split = partitionStoneLanesByCompleteRanks('generic.extraAttack', lanes, 0, 0);
    expect(split?.payment.tier).toBe(2);
    expect(split?.spend.map((row) => row.lane)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(split?.leftover.map((row) => row.lane)).toEqual([6]);
  });

  it('refuses a pile whose count would pay a rank but whose lanes skip ahead', () => {
    const lanes = [2, 3, 4, 5, 6, 7].map((lane) => ({ lane, attr: 'might' }));
    expect(partitionStoneLanesByCompleteRanks('generic.extraAttack', lanes, 0, 0)).toBeNull();
  });

  it('reads 2 / 6 / 12 / 20 Premium stones as R1 / R2 / R3 / R4 (Phasing)', () => {
    expect(highestCompleteStoneTierFromPlaced('wits.phasing', 1)).toBe(0);
    expect(highestCompleteStoneTierFromPlaced('wits.phasing', 2)).toBe(1);
    expect(highestCompleteStoneTierFromPlaced('wits.phasing', 6)).toBe(2);
    expect(highestCompleteStoneTierFromPlaced('wits.phasing', 12)).toBe(3);
    expect(highestCompleteStoneTierFromPlaced('wits.phasing', 19)).toBe(3);
    expect(highestCompleteStoneTierFromPlaced('wits.phasing', 20)).toBe(4);
  });

  it('lets Artifact Support raise Initiative Boost only after T1–T3 are paid', () => {
    expect(resolveOncePerCombatStoneTier('wits.initiativeBoost', 1, 4)).toEqual({
      tier: 1,
      playerTier: 1,
    });
    expect(resolveOncePerCombatStoneTier('wits.initiativeBoost', 7, 4)).toEqual({
      tier: 4,
      playerTier: 3,
    });
    expect(resolveOncePerCombatStoneTier('wits.initiativeBoost', 15, 0)).toEqual({
      tier: 4,
      playerTier: 4,
    });
  });
});

describe('Wits — Initiative Boost is MR × 1/2/4/8 and once per combat', () => {
  it.each([[1, 2], [2, 4], [3, 8], [4, 16], [5, 0]])('T%i adds +%i initiative at MR2', async (tier, expected) => {
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    await STONE_POWERS['wits.initiativeBoost'].apply({
      actor: actor as any,
      combatant: combatant as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.initiativeBonus).toBe(expected);
    expect(combatant.initiative).toBe(10 + expected);
    expect(combatant._flags['msInitiativeValue']).toBe(10 + expected);
    expect(combatant._flags['msInitiativeBoostUsed']).toBe(true);
  });

  it('refuses a second activation in the same combat', async () => {
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    const power = STONE_POWERS['wits.initiativeBoost'];
    await power.apply({ actor: actor as any, combatant: combatant as any, tier: 1, cost: 1 });
    await power.apply({ actor: actor as any, combatant: combatant as any, tier: 2, cost: 2 });
    expect(combatant.initiative).toBe(12);
    expect(actor._roundState.stoneBonuses.initiativeBonus).toBe(2);
  });
});

describe('Might — Parry (Premium): +2 / +4 / +6 / +8 Parry Pool', () => {
  it.each([[1, 2], [2, 4], [3, 6], [4, 8]])('R%i grants +%i Parry Pool', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['might.parry'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: stonePowerRankCost('might.parry', tier),
    });
    expect(actor._roundState.stoneBonuses.tempParryPool).toBe(expected);
  });
});

describe('Agility — Crit (Premium, four Ranks)', () => {
  it('has four Ranks', () => {
    expect(STONE_POWERS['agility.crit'].premium).toBe(true);
    expect(STONE_POWERS['agility.crit'].tiers).toHaveLength(4);
  });

  it.each([[1, 1], [2, 2], [3, 3], [4, 4]])('R%i grants Crit(1) on %i attack(s)', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['agility.crit'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: stonePowerRankCost('agility.crit', tier),
    });
    expect(actor._roundState.stoneBonuses.critRaises).toBe(expected);
  });

  it('Rank 5 does not invent another Crit charge', async () => {
    const actor = makeMockActor();
    await STONE_POWERS['agility.crit'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier: 5,
      cost: 0,
    });
    expect(actor._roundState.stoneBonuses.critRaises).toBeUndefined();
  });
});

describe('Influence powers are GM-manual (flag-driven)', () => {
  it.each(['influence.aidRoll', 'influence.regeneration', 'influence.passiveSwap', 'influence.notATarget'])(
    '%s sets a pending flag with tier-scaled payload',
    async (id) => {
      const actor = makeMockActor();
      await STONE_POWERS[id].apply({
        actor: actor as any,
        combatant: makeMockCombatant() as any,
        tier: 3,
        cost: 4,
      });
      const touched = Object.keys(actor._flags).length > 0;
      expect(touched).toBe(true);
    },
  );
});

describe('Resolve Ward and Influence Regeneration copy', () => {
  it('names Ward with what it actually does', () => {
    const power = STONE_POWERS['resolve.ward'];
    expect(power.name).toMatch(/incoming Specials/i);
    expect(power.description).toMatch(/hostile Special/i);
    expect(power.tiers[0]?.description).toMatch(/reduced by 2/i);
  });

  it('grants Regeneration(2/4/6/8) to one ally within 8/16/24/32 m', async () => {
    const power = STONE_POWERS['influence.regeneration'];
    expect(power.name).toBe('Regeneration');
    expect(power.tiers.map((t) => t.value)).toEqual([2, 4, 6, 8]);
    const actor = makeMockActor();
    await power.apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier: 1,
      cost: 1,
    });
    expect(actor._flags.pendingAllyRegeneration).toEqual({ value: 2, moveMeters: 0, range: 8 });
    const actorT4 = makeMockActor();
    await power.apply({
      actor: actorT4 as any,
      combatant: makeMockCombatant() as any,
      tier: 4,
      cost: 8,
    });
    expect(actorT4._flags.pendingAllyRegeneration).toEqual({ value: 8, moveMeters: 0, range: 32 });
  });
});

describe('STONE_POWERS_BY_ATTRIBUTE — GM editor coverage', () => {
  const ATTRS = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'] as const;

  it('every attribute has stone powers (including wits/vitality for any slot)', () => {
    for (const attr of ATTRS) {
      expect(STONE_POWERS_BY_ATTRIBUTE[attr]?.length).toBeGreaterThan(0);
    }
    expect(STONE_POWERS_BY_ATTRIBUTE.wits.some((p) => p.id === 'wits.initiativeBoost')).toBe(true);
    expect(STONE_POWERS_BY_ATTRIBUTE.vitality.some((p) => p.id === 'vitality.tempHp')).toBe(true);
    expect(STONE_POWERS_BY_ATTRIBUTE.might.some((p) => p.id === 'might.ignoreArmor')).toBe(true);
  });
});
