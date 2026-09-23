/**
 * v0.9.9 final Stone model: universal four Ranks, Normal vs Premium costs,
 * and Permanent Colorless Stones (2:1 conversion, MR cap, own pool).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  PREMIUM_STONE_POWER_IDS,
  STONE_POWERS,
  cumulativeStoneCostForRank,
  isPremiumStonePower,
  stonePowerRankCost,
} from '../src/stones/stone-powers.js';
import { resolveStonePowerActivation } from '../src/stones/stone-activation.js';
import { deriveMasteryRankFromStones } from '../src/utils/mastery-rank-sync.js';
import {
  assignmentsAreLegal,
  canConvertToPermanentColorless,
  canPlacePermanentStone,
  emptyAssignments,
  permanentColorlessCap,
  permanentColorlessCount,
  permanentStonesFromLifetimeXp,
  resolvedPermanentStoneTotal,
  stoneConcentrationCap,
  unassignedPermanentStones,
} from '../src/progression/v099-rules.js';
import {
  getPermanentColorlessStones,
  getSpendableColorlessStones,
  spendColorlessStones,
} from '../src/stones/colorless-stones.js';

beforeEach(() => {
  (globalThis as any).ui = { notifications: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } };
});

describe('Normal Stone Ability costs', () => {
  it('1 / 2 / 4 / 8 additional (1 / 3 / 7 / 15 total)', () => {
    for (const id of ['might.armor', 'resolve.healing', 'wits.initiativeBoost', 'generic.extraMovement']) {
      expect([1, 2, 3, 4].map((r) => stonePowerRankCost(id, r))).toEqual([1, 2, 4, 8]);
      expect(cumulativeStoneCostForRank(id, 4)).toBe(15);
    }
  });
});

describe('Premium Stone Ability costs', () => {
  it('2 / 4 / 6 / 8 additional (2 / 6 / 12 / 20 total)', () => {
    for (const id of PREMIUM_STONE_POWER_IDS) {
      expect([1, 2, 3, 4].map((r) => stonePowerRankCost(id, r))).toEqual([2, 4, 6, 8]);
      expect(cumulativeStoneCostForRank(id, 4)).toBe(20);
    }
  });

  it('all eight Premium Abilities expose Rank 1–4 and no Rank 5', () => {
    expect(PREMIUM_STONE_POWER_IDS).toHaveLength(8);
    for (const id of PREMIUM_STONE_POWER_IDS) {
      const power = STONE_POWERS[id];
      expect(power.premium).toBe(true);
      expect(power.tiers).toHaveLength(4);
      expect(stonePowerRankCost(id, 5)).toBe(0);
      expect(resolveStonePowerActivation(id, 4, 0).legal).toBe(false);
    }
  });

  it('Premium Rank 4 legally costs 20 — more than the MR8 Attribute cap of 16', () => {
    const mr8Total = permanentStonesFromLifetimeXp(960);
    expect(deriveMasteryRankFromStones(mr8Total)).toBeGreaterThanOrEqual(8);
    expect(stoneConcentrationCap(32, 8)).toBe(16);
    expect(cumulativeStoneCostForRank('might.parry', 4)).toBe(20);
    // The cost is NOT reduced to fit into one Attribute pool: extra resources
    // (Permanent / Initiative Colorless, Stone Power Support) close the gap.
    expect(cumulativeStoneCostForRank('might.parry', 4)).toBeGreaterThan(16);
  });
});

describe('Stone Power Support (four-Rank)', () => {
  it.each([2, 3, 4])('Rank %i support makes exactly that Rank free', (rank) => {
    for (let uses = 0; uses < 4; uses += 1) {
      const res = resolveStonePowerActivation('agility.crit', uses, rank);
      const expected = uses + 1 === rank ? 0 : stonePowerRankCost('agility.crit', uses + 1);
      expect(res.cost).toBe(expected);
      expect(res.tier).toBe(uses + 1);
    }
  });
});

describe('Permanent Colorless Stones — conversion and caps', () => {
  it('converts 2 unassigned progression Stones into 1 Permanent Colorless Stone', () => {
    const assignments = { ...emptyAssignments(), might: 2 };
    // 6 earned stones, 2 assigned, 0 colorless → 4 unassigned.
    expect(unassignedPermanentStones({ assignments, totalPermanent: 6 })).toBe(4);
    const check = canConvertToPermanentColorless({
      assignments,
      totalPermanent: 6,
      permanentColorless: 0,
      storedRank: 2,
    });
    expect(check.ok).toBe(true);
    // After one conversion: 4 − 2 = 2 unassigned remain.
    expect(
      unassignedPermanentStones({ assignments, totalPermanent: 6, permanentColorless: 1 }),
    ).toBe(2);
  });

  it('needs 2 unassigned Stones', () => {
    const assignments = { ...emptyAssignments(), might: 5 };
    const check = canConvertToPermanentColorless({
      assignments,
      totalPermanent: 6,
      permanentColorless: 0,
      storedRank: 2,
    });
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/2 unassigned/);
  });

  it('caps Permanent Colorless Stones at Mastery Rank', () => {
    expect(permanentColorlessCap(2)).toBe(2);
    expect(permanentColorlessCap(8)).toBe(8);
    // 6 earned Stones = MR2 → at most 2 Permanent Colorless Stones.
    const check = canConvertToPermanentColorless({
      assignments: emptyAssignments(),
      totalPermanent: 6,
      permanentColorless: 2,
      storedRank: 2,
    });
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/capped at Mastery Rank/);
  });

  it('does not consume the MR × 2 Attribute Stone limit', () => {
    // 7 earned (MR2, cap 4 per Attribute), 2 converted to 1 colorless:
    // 5 assignable. The Attribute cap only counts assigned Stones —
    // Permanent Colorless Stones never count against it.
    const assignments = { ...emptyAssignments(), might: 4 };
    const place = canPlacePermanentStone({
      attribute: 'might',
      assignments,
      totalPermanent: 7,
      storedRank: 2,
      permanentColorless: 1,
    });
    expect(place.ok).toBe(false);
    expect(place.reason).toMatch(/Mastery Rank × 2/);
    const other = canPlacePermanentStone({
      attribute: 'agility',
      assignments,
      totalPermanent: 7,
      storedRank: 2,
      permanentColorless: 1,
    });
    expect(other.ok).toBe(true);
    // With everything assigned or converted, nothing is left to place.
    const full = canPlacePermanentStone({
      attribute: 'agility',
      assignments: { ...emptyAssignments(), might: 4, agility: 1 },
      totalPermanent: 7,
      storedRank: 2,
      permanentColorless: 1,
    });
    expect(full.ok).toBe(false);
    expect(full.reason).toMatch(/No unassigned/);
  });

  it('assignmentsAreLegal accounts for converted Stones', () => {
    const assignments = { ...emptyAssignments(), might: 4, agility: 2 };
    expect(assignmentsAreLegal(assignments, 8, 2, 1).ok).toBe(true);
    expect(assignmentsAreLegal(assignments, 8, 2, 0).ok).toBe(false);
  });

  it('does not reduce Mastery Stone Value: total stays 2 + floor(XP / 20)', () => {
    // MR progression reads the earned total from Lifetime XP; a Permanent
    // Colorless Stone counts as the 2 Stones it replaced automatically.
    const system = {
      progression: { v099Stones: true, lifetimeXp: 120, permanentColorless: 2 },
    };
    expect(permanentStonesFromLifetimeXp(120)).toBe(8);
    expect(resolvedPermanentStoneTotal(system, 0)).toBe(8);
    expect(permanentColorlessCount(system)).toBe(2);
  });
});

describe('Permanent vs item-granted Colorless Stones', () => {
  function actorWith(temp: number, permanentCurrent: number, permanentMax: number) {
    const actor: any = {
      _flags: temp > 0 ? { tempColorlessStones: temp } : {},
      system: { stonePools: { colorless: { current: permanentCurrent, max: permanentMax } } },
      getFlag(_ns: string, k: string) {
        return this._flags[k];
      },
      async setFlag(_ns: string, k: string, v: any) {
        this._flags[k] = v;
      },
      async unsetFlag(_ns: string, k: string) {
        delete this._flags[k];
      },
      async update(data: Record<string, any>) {
        for (const [path, value] of Object.entries(data)) {
          const segs = path.split('.');
          let t: any = this;
          for (let i = 0; i < segs.length - 1; i++) {
            if (t[segs[i]] == null) t[segs[i]] = {};
            t = t[segs[i]];
          }
          t[segs[segs.length - 1]] = value;
        }
      },
    };
    return actor;
  }

  it('spendable = temporary pile + Ready Permanent Colorless', () => {
    const actor = actorWith(2, 3, 3);
    expect(getSpendableColorlessStones(actor)).toBe(5);
    expect(getPermanentColorlessStones(actor)).toEqual({ current: 3, max: 3 });
  });

  it('spends temporary first (they vanish), then Exhausts permanent', async () => {
    const actor = actorWith(2, 3, 3);
    expect(await spendColorlessStones(actor, 4)).toBe(true);
    // Temporary pile empty (spent + flag removed), permanent 3 → 1.
    expect(actor._flags.tempColorlessStones).toBeUndefined();
    expect(actor.system.stonePools.colorless.current).toBe(1);
    expect(actor.system.stonePools.colorless.max).toBe(3);
  });

  it('refuses to overspend', async () => {
    const actor = actorWith(1, 1, 1);
    expect(await spendColorlessStones(actor, 3)).toBe(false);
    expect(actor._flags.tempColorlessStones).toBe(1);
    expect(actor.system.stonePools.colorless.current).toBe(1);
  });

  it('permanent Stones never ride the temporary pile (max is preserved)', async () => {
    const actor = actorWith(0, 2, 2);
    expect(await spendColorlessStones(actor, 2)).toBe(true);
    expect(actor.system.stonePools.colorless.current).toBe(0);
    // The pool keeps its max — the Stones are Exhausted, not gone.
    expect(actor.system.stonePools.colorless.max).toBe(2);
  });
});

describe('non-premium sanity', () => {
  it('Normal abilities are not premium and premium detection follows aliases', () => {
    expect(isPremiumStonePower('resolve.healing')).toBe(false);
    expect(isPremiumStonePower('resolve.damageReductionBoost')).toBe(true);
  });
});
