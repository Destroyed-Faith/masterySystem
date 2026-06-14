/**
 * Unit tests for the Encounter Generator analysis helpers.
 */
import { describe, it, expect } from 'vitest';
import {
  EXPLODING_D8_MEAN,
  buildPartyMetrics,
  estimateWeaponDamageMean,
  extractPartyMember,
  hitRate,
  meanRaisesOnHit,
  quantile,
  rollKeepSample,
  simulateAttackTotals,
} from '../src/creation/encounter-generator/encounter-generator-analysis';

/** Deterministic mulberry32 RNG for reproducible sampling. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('exploding d8 mean', () => {
  it('is 36/7', () => {
    expect(EXPLODING_D8_MEAN).toBeCloseTo(5.142857, 4);
  });
});

describe('rollKeepSample', () => {
  it('keeps at most `keep` dice and is >= keep', () => {
    const rng = seededRng(42);
    for (let i = 0; i < 100; i++) {
      const v = rollKeepSample(8, 2, rng);
      expect(v).toBeGreaterThanOrEqual(2); // each kept die at least 1
    }
  });

  it('larger pools produce larger kept totals on average', () => {
    const small = simulateAttackTotals(4, 2, 2000, seededRng(1));
    const big = simulateAttackTotals(12, 2, 2000, seededRng(1));
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    expect(avg(big)).toBeGreaterThan(avg(small));
  });
});

describe('quantile', () => {
  it('returns endpoints and middle', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(quantile(arr, 0)).toBe(1);
    expect(quantile(arr, 1)).toBe(5);
    expect(quantile(arr, 0.5)).toBe(3);
  });
  it('handles empty arrays', () => {
    expect(quantile([], 0.5)).toBe(0);
  });
});

describe('hitRate', () => {
  it('is monotonically non-increasing in the target number', () => {
    const totals = simulateAttackTotals(8, 2, 3000, seededRng(7));
    const low = hitRate(totals, 8);
    const mid = hitRate(totals, 16);
    const high = hitRate(totals, 30);
    expect(low).toBeGreaterThanOrEqual(mid);
    expect(mid).toBeGreaterThanOrEqual(high);
    expect(low).toBeLessThanOrEqual(1);
    expect(high).toBeGreaterThanOrEqual(0);
  });
});

describe('meanRaisesOnHit', () => {
  it('returns 0 when nothing hits', () => {
    expect(meanRaisesOnHit([5, 6, 7], 1000)).toBe(0);
  });
  it('counts raises in increments of 4 over the TN', () => {
    // totals 10 and 18 vs TN 10 -> raises 0 and 2 -> mean 1
    expect(meanRaisesOnHit([10, 18], 10)).toBeCloseTo(1, 5);
  });
});

describe('estimateWeaponDamageMean', () => {
  it('parses explicit dice count', () => {
    expect(estimateWeaponDamageMean({ damageDiceCount: 3 })).toBeCloseTo(3 * EXPLODING_D8_MEAN, 4);
  });
  it('parses "2d8" strings', () => {
    expect(estimateWeaponDamageMean({ baseDamage: '2d8' })).toBeCloseTo(2 * EXPLODING_D8_MEAN, 4);
  });
  it('parses bare numbers', () => {
    expect(estimateWeaponDamageMean({ baseDamage: '5' })).toBe(5);
  });
  it('defaults to a one-handed weapon', () => {
    expect(estimateWeaponDamageMean(null)).toBeCloseTo(2 * EXPLODING_D8_MEAN, 4);
  });
});

describe('extractPartyMember', () => {
  const actor = {
    id: 'abc',
    name: 'Hero',
    system: {
      mastery: { rank: 4 },
      combat: { evadeTotal: 18, armorTotal: 6, damageReductionPct: 10 },
      attributes: { might: { value: 16 }, agility: { value: 8 } },
      health: { bars: [{ max: 12 }, { max: 12 }, { max: 12 }, { max: 12 }, { max: 1 }] },
    },
    items: [],
  };

  it('reads combat and HP fields', () => {
    const m = extractPartyMember(actor, 500, seededRng(3));
    expect(m.mr).toBe(4);
    expect(m.evade).toBe(18);
    expect(m.armor).toBe(6);
    expect(m.drPct).toBe(10);
    expect(m.effectiveHP).toBe(49);
    expect(m.keep).toBe(4);
    expect(m.attackPool).toBe(16); // best attribute (Might 16)
    expect(m.mightMeleeBonus).toBe(4); // 2 * floor(16/8)
    expect(m.attackTotals.length).toBe(500);
  });

  it('falls back to MR-derived defaults when combat is missing', () => {
    const bare = { id: 'x', name: 'Bare', system: { mastery: { rank: 2 } }, items: [] };
    const m = extractPartyMember(bare, 100, seededRng(9));
    expect(m.evade).toBe(8); // MR*4
    expect(m.armor).toBe(2); // MR
    expect(m.effectiveHP).toBe(1); // no bars -> floored to 1
  });
});

describe('buildPartyMetrics', () => {
  it('aggregates members and pools attack totals', () => {
    const a = extractPartyMember(
      { id: '1', name: 'A', system: { mastery: { rank: 2 }, combat: { evadeTotal: 10, armorTotal: 2 }, attributes: { might: { value: 8 } }, health: { bars: [{ max: 16 }] } }, items: [] },
      200,
      seededRng(1),
    );
    const b = extractPartyMember(
      { id: '2', name: 'B', system: { mastery: { rank: 4 }, combat: { evadeTotal: 20, armorTotal: 4 }, attributes: { might: { value: 16 } }, health: { bars: [{ max: 24 }] } }, items: [] },
      200,
      seededRng(2),
    );
    const party = buildPartyMetrics([a, b]);
    expect(party.size).toBe(2);
    expect(party.avgEvade).toBe(15);
    expect(party.avgArmor).toBe(3);
    expect(party.pooledAttackTotals.length).toBe(400);
    // pooled is sorted ascending
    for (let i = 1; i < party.pooledAttackTotals.length; i++) {
      expect(party.pooledAttackTotals[i]).toBeGreaterThanOrEqual(party.pooledAttackTotals[i - 1]);
    }
  });
});
