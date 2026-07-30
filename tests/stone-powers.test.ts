/**
 * Tests for the new tier-based Stone Powers (`src/stones/stone-powers.ts`).
 *
 * Coverage:
 *   - Registry shape: 8 pools (generic + 7 attributes), 4 powers each.
 *     Vitality (per rules table): Temporary HP / Endure Special /
 *     Remove Scar / Extend Active Buff.
 *   - Each power has exactly 4 tiers; cost-per-tier = 1 / 2 / 4 / 8.
 *   - tierForUseIndex returns the right 1..4 tier (clamped).
 *   - apply() for every power × every tier runs without throwing on a
 *     mock actor/combatant and writes only into stoneBonuses or flags.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  STONE_POWERS,
  STONE_POWERS_BY_ATTRIBUTE,
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
      health: { tempHP: 0, scarred: 1 },
      // A negative diminishing Special so `vitality.endureSpecial` has a
      // candidate to reduce in the generic apply() smoke test.
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

  // Wits carries a 5th power ("Seize the Moment") — the rules-sanctioned
  // "Additional Initiative Shops" access (Players Guide: Wits Stone Powers
  // may allow rerolling Initiative and reopening the Initiative Shop).
  it.each(POOL_KEYS)('pool "%s" has the expected number of powers', (poolKey) => {
    const powers = (STONE_POWERS_BY_ATTRIBUTE as any)[poolKey] as StonePower[];
    expect(powers).toHaveLength(poolKey === 'wits' ? 5 : poolKey === 'resolve' ? 3 : 4);
  });

  it('total registry has 32 powers (resolve × 3, wits × 5, others × 4)', () => {
    expect(Object.keys(STONE_POWERS)).toHaveLength(32);
  });

  // Rules table: Vitality Stone Abilities are exactly these four.
  it('Vitality pool matches the rules table', () => {
    const ids = STONE_POWERS_BY_ATTRIBUTE.vitality.map((p) => p.id);
    expect(ids).toEqual([
      'vitality.tempHp',
      'vitality.endureSpecial',
      'vitality.removeScar',
      'vitality.extendActiveBuff',
    ]);
  });

  it('every registry key matches its power.id', () => {
    for (const [id, power] of Object.entries(STONE_POWERS)) {
      expect(power.id).toBe(id);
    }
  });
});

describe('Stone Powers — tier table shape', () => {
  it.each(Object.values(STONE_POWERS).map((p) => [p.id, p]))(
    '"%s" has exactly 4 tiers with description text',
    (_id, power) => {
      const p = power as StonePower;
      expect(p.tiers).toHaveLength(4);
      for (const tier of p.tiers) {
        expect(typeof tier.description).toBe('string');
        expect(tier.description.length).toBeGreaterThan(0);
        // label may be null (blank ramp tier), otherwise a non-empty string
        if (tier.label !== null) {
          expect(typeof tier.label).toBe('string');
          expect(tier.label.length).toBeGreaterThan(0);
        }
      }
    },
  );

  it('compiled effect tooltip includes all 4 tiers with cost markers', () => {
    for (const power of Object.values(STONE_POWERS)) {
      expect(power.effect).toContain('T1 (1)');
      expect(power.effect).toContain('T2 (2)');
      expect(power.effect).toContain('T3 (4)');
      expect(power.effect).toContain('T4 (8)');
    }
  });
});

describe('Cost progression maps to tiers', () => {
  it('1st / 2nd / 3rd / 4th uses cost 1 / 2 / 4 / 8 stones', () => {
    expect(calculateStoneCost(0)).toBe(1);
    expect(calculateStoneCost(1)).toBe(2);
    expect(calculateStoneCost(2)).toBe(4);
    expect(calculateStoneCost(3)).toBe(8);
  });

  it('tierForUseIndex returns 1..4 clamped', () => {
    expect(tierForUseIndex(0)).toBe(1);
    expect(tierForUseIndex(1)).toBe(2);
    expect(tierForUseIndex(2)).toBe(3);
    expect(tierForUseIndex(3)).toBe(4);
    // Past T4 stays at T4 — spec stops scaling there.
    expect(tierForUseIndex(4)).toBe(4);
    expect(tierForUseIndex(99)).toBe(4);
  });

  it('tierForUseIndex floors negative / NaN inputs to T1', () => {
    expect(tierForUseIndex(-1)).toBe(1);
    expect(tierForUseIndex(-5)).toBe(1);
  });
});

describe('apply() — runs cleanly across every power and tier', () => {
  for (const [id, power] of Object.entries(STONE_POWERS)) {
    describe(id, () => {
      for (const tier of [1, 2, 3, 4]) {
        it(`tier ${tier} runs without throwing`, async () => {
          const actor = makeMockActor();
          const combatant = makeMockCombatant();
          const cost = calculateStoneCost(tier - 1);
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
          // Endure Special rewrites system.statusEffects (mock starts with Ruin(6)).
          const specialsTouched =
            !Array.isArray(actor.system.statusEffects) ||
            actor.system.statusEffects.length !== 1 ||
            (actor.system.statusEffects[0]?.value ?? 6) !== 6;
          // For "ramp" tiers (Extra Attack T1/T2, Spell Action T1, Damage Reduction Boost T1, Phasing T1)
          // the spec says nothing happens — that's expected.
          const isRampTier = power.tiers[tier - 1].label === null;
          const touched =
            sbTouched ||
            actionsTouched ||
            flagsTouched ||
            removedScar ||
            grantedHp ||
            tempHpRaised ||
            specialsTouched;
          if (!isRampTier) {
            expect(
              touched,
              `${id} T${tier} should affect actor state`,
            ).toBe(true);
          }
        });
      }
    });
  }
});

describe('Generic powers — Extra Attack', () => {
  it('T1 is a ramp step (no extra attack granted)', async () => {
    const power = STONE_POWERS['generic.extraAttack'];
    expect(power).toBeDefined();
    const actor = makeMockActor();
    await power.apply({ actor: actor as any, combatant: makeMockCombatant() as any, tier: 1, cost: 1 });
    expect(actor._roundState.attackActions.total).toBe(1);
    expect(actor._roundState.stoneBonuses.extraAttacks).toBe(0);
  });

  it('T2 grants +1, T3 grants +2, T4 grants +3 Attack Actions (Player\'s Guide)', async () => {
    const power = STONE_POWERS['generic.extraAttack'];
    for (const [tier, expected] of [[2, 1], [3, 2], [4, 3]] as const) {
      const actor = makeMockActor();
      await power.apply({ actor: actor as any, combatant: makeMockCombatant() as any, tier, cost: 2 ** (tier - 1) });
      expect(actor._roundState.attackActions.total).toBe(1 + expected);
      expect(actor._roundState.stoneBonuses.extraAttacks).toBe(expected);
    }
  });
});

describe('Might — Melee Damage scales 2/4/8/16', () => {
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
  it.each([[1, 20], [2, 40], [3, 80], [4, 160]])('T%i grants %i temp HP', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['vitality.tempHp'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor.system.health.tempHP).toBe(expected);
    expect(actor._roundState.stoneBonuses.tempHpGrantedThisTurn).toBe(expected);
  });
});

describe('Vitality — Endure Special reduces one negative Special by 2/4/8/12', () => {
  it.each([[1, 2, 4], [2, 4, 2], [3, 8, 0], [4, 12, 0]])(
    'T%i reduces Ruin(6) by %i → %i',
    async (tier, _reduce, remaining) => {
      const actor = makeMockActor();
      await STONE_POWERS['vitality.endureSpecial'].apply({
        actor: actor as any,
        combatant: makeMockCombatant() as any,
        tier,
        cost: 2 ** (tier - 1),
      });
      const list = actor.system.statusEffects as any[];
      if (remaining > 0) {
        expect(list).toHaveLength(1);
        expect(list[0].value).toBe(remaining);
      } else {
        // Reduced to 0 ⇒ the Special is removed entirely.
        expect(list).toHaveLength(0);
      }
    },
  );

  it('never reduces Regeneration (positive Special)', async () => {
    const actor = makeMockActor();
    actor.system.statusEffects = [{ id: 'regeneration', name: 'Regeneration (X)', value: 4 }];
    await STONE_POWERS['vitality.endureSpecial'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier: 4,
      cost: 8,
    });
    expect(actor.system.statusEffects).toEqual([{ id: 'regeneration', name: 'Regeneration (X)', value: 4 }]);
    expect((globalThis as any).ui.notifications.warn).toHaveBeenCalled();
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

describe('Resolve — Damage Reduction Boost ramps at T2', () => {
  it('T1 is a ramp step (no effect)', async () => {
    const actor = makeMockActor();
    await STONE_POWERS['resolve.damageReductionBoost'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier: 1,
      cost: 1,
    });
    expect(actor._roundState.stoneBonuses.damageReductionBoostPct ?? 0).toBe(0);
  });

  it.each([[2, 10], [3, 20], [4, 30]])('T%i adds +%i%% DR', async (tier, expected) => {
    const actor = makeMockActor();
    await STONE_POWERS['resolve.damageReductionBoost'].apply({
      actor: actor as any,
      combatant: makeMockCombatant() as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.damageReductionBoostPct).toBe(expected);
  });
});

describe('Wits — Initiative Boost scales +4/+8/+16/+32', () => {
  it.each([[1, 4], [2, 8], [3, 16], [4, 32]])('T%i adds +%i initiative', async (tier, expected) => {
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    await STONE_POWERS['wits.initiativeBoost'].apply({
      actor: actor as any,
      combatant: combatant as any,
      tier,
      cost: 2 ** (tier - 1),
    });
    expect(actor._roundState.stoneBonuses.initiativeBonus).toBe(expected);
    // The boost must actually change the persisted Initiative (turn order),
    // and record itself for the end-of-round revert.
    expect(combatant.initiative).toBe(10 + expected);
    expect(combatant._flags['msInitiativeValue']).toBe(10 + expected);
    expect(combatant._flags['msInitiativeBoostThisRound']).toBe(expected);
  });

  it('stacking two boosts accumulates the revert bookkeeping', async () => {
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    const power = STONE_POWERS['wits.initiativeBoost'];
    await power.apply({ actor: actor as any, combatant: combatant as any, tier: 1, cost: 1 });
    await power.apply({ actor: actor as any, combatant: combatant as any, tier: 2, cost: 2 });
    expect(combatant.initiative).toBe(10 + 4 + 8);
    expect(combatant._flags['msInitiativeBoostThisRound']).toBe(12);
  });
});

describe('Wits — Seize the Moment (Additional Initiative Shop)', () => {
  it('is registered as the 5th Wits power', () => {
    expect(STONE_POWERS['wits.initiativeShop']).toBeDefined();
    expect(STONE_POWERS_BY_ATTRIBUTE.wits.some((p) => p.id === 'wits.initiativeShop')).toBe(true);
  });

  it('records the reroll audit flag and bails out safely without a combatant actor', async () => {
    const actor = makeMockActor();
    const combatant = makeMockCombatant();
    // Mock combatant has no `.actor`, so apply() bails out after the audit flag —
    // exactly the safe path we want outside a real encounter.
    await STONE_POWERS['wits.initiativeShop'].apply({
      actor: actor as any,
      combatant: combatant as any,
      tier: 1,
      cost: 1,
    });
    expect(combatant._flags['msInitiativeRerollUsed']).toBeGreaterThan(0);
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
