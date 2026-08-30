/**
 * Tests for the deterministic exploding-d8 Pool & Keep probability engine.
 */
import { describe, it, expect } from 'vitest';
import {
  EXPLODING_D8_MEAN,
  PLAIN_D8_MEAN,
  clearProbabilityCaches,
  damageJointPmf,
  expectedOverThreshold,
  expectedRaises,
  explodingSumPmf,
  hitChance,
  plainDamagePmf,
  pmfAtLeast,
  pmfMean,
  pmfQuantile,
  poolKeepPmf,
  singleDiePmf,
} from '../src/creation/encounter-forge/probability';

describe('singleDiePmf', () => {
  it('sums to 1 and has near-exact exploding mean', () => {
    const pmf = singleDiePmf();
    let total = 0;
    for (const p of pmf) total += p;
    expect(total).toBeCloseTo(1, 12);
    // Truncation error bound: (1/8)^4 * (36/7 - 4.5) ≈ 1.6e-4.
    expect(pmfMean(pmf)).toBeCloseTo(EXPLODING_D8_MEAN, 3);
  });

  it('has the exact base-face probabilities', () => {
    const pmf = singleDiePmf();
    for (let face = 1; face <= 7; face += 1) expect(pmf[face]).toBeCloseTo(1 / 8, 12);
    expect(pmf[8]).toBe(0); // an 8 always explodes into 9..15 (until depth cap)
    for (let face = 9; face <= 15; face += 1) expect(pmf[face]).toBeCloseTo(1 / 64, 12);
  });
});

describe('explodingSumPmf', () => {
  it('n dice mean = n * single-die mean', () => {
    const pmf = explodingSumPmf(6);
    expect(pmfMean(pmf)).toBeCloseTo(6 * pmfMean(singleDiePmf()), 9);
  });

  it('is a proper distribution', () => {
    const pmf = explodingSumPmf(10);
    let total = 0;
    for (const p of pmf) total += p;
    expect(total).toBeCloseTo(1, 9);
  });
});

describe('plainDamagePmf (damage dice never explode)', () => {
  it('mean is 4.5 per die', () => {
    expect(pmfMean(plainDamagePmf(1))).toBeCloseTo(PLAIN_D8_MEAN, 12);
    expect(pmfMean(plainDamagePmf(7))).toBeCloseTo(7 * PLAIN_D8_MEAN, 9);
  });

  it('support is n..8n', () => {
    const pmf = plainDamagePmf(4);
    expect(pmf[3]).toBe(0);
    expect(pmf[4]).toBeGreaterThan(0);
    expect(pmf[32]).toBeCloseTo(Math.pow(1 / 8, 4), 12);
  });
});

describe('damageJointPmf', () => {
  it('marginal over eights equals the plain damage PMF', () => {
    const joint = damageJointPmf(3);
    const plain = plainDamagePmf(3);
    for (let s = 0; s < plain.length; s += 1) {
      let m = 0;
      for (const pmf of joint) m += pmf[s] ?? 0;
      expect(m).toBeCloseTo(plain[s], 12);
    }
  });

  it('eights count follows Binomial(n, 1/8)', () => {
    const joint = damageJointPmf(4);
    const pZeroEights = joint[0].reduce((a, b) => a + b, 0);
    expect(pZeroEights).toBeCloseTo(Math.pow(7 / 8, 4), 12);
    const pAllEights = joint[4].reduce((a, b) => a + b, 0);
    expect(pAllEights).toBeCloseTo(Math.pow(1 / 8, 4), 12);
  });
});

describe('poolKeepPmf', () => {
  it('keep-all equals the plain convolution', () => {
    const keepAll = poolKeepPmf(3, 3);
    const conv = explodingSumPmf(3);
    for (let s = 0; s < conv.length; s += 1) {
      expect(keepAll[s] ?? 0).toBeCloseTo(conv[s], 9);
    }
  });

  it('1 of 1 equals the single die', () => {
    const one = poolKeepPmf(1, 1);
    const die = singleDiePmf();
    for (let v = 1; v <= 15; v += 1) expect(one[v]).toBeCloseTo(die[v], 12);
  });

  it('keep 1 of n matches the analytic maximum distribution', () => {
    // P(max <= x) = P(die <= x)^n
    const die = singleDiePmf();
    const n = 5;
    const pmf = poolKeepPmf(n, 1);
    let cum = 0;
    let cumMaxExpected = 0;
    for (let v = 1; v < die.length; v += 1) {
      cum += die[v];
      const cdfMax = Math.pow(cum, n);
      expect(pmf[v]).toBeCloseTo(cdfMax - cumMaxExpected, 10);
      cumMaxExpected = cdfMax;
    }
  });

  it('is monotone: more pool dice never lower the kept sum mean', () => {
    let prev = 0;
    for (let pool = 2; pool <= 12; pool += 1) {
      const mean = pmfMean(poolKeepPmf(pool, 2));
      expect(mean).toBeGreaterThan(prev);
      prev = mean;
    }
  });

  it('sums to 1 for a large pool', () => {
    const pmf = poolKeepPmf(16, 4);
    let total = 0;
    for (const p of pmf) total += p;
    expect(total).toBeCloseTo(1, 8);
  });
});

describe('hitChance / raises / quantiles', () => {
  it('is deterministic across cache clears', () => {
    const a = hitChance(7, 3, 16);
    clearProbabilityCaches();
    const b = hitChance(7, 3, 16);
    expect(a).toBe(b);
  });

  it('hit chance decreases with TN and increases with pool', () => {
    expect(hitChance(6, 3, 12)).toBeGreaterThan(hitChance(6, 3, 18));
    expect(hitChance(8, 3, 16)).toBeGreaterThan(hitChance(5, 3, 16));
  });

  it('sanity: 2k2 vs TN 2 is certain, vs TN 100 near-impossible', () => {
    expect(hitChance(2, 2, 2)).toBeCloseTo(1, 9);
    expect(hitChance(2, 2, 100)).toBeLessThan(1e-4);
  });

  it('expected raises match a direct PMF computation', () => {
    const pmf = poolKeepPmf(6, 3);
    let expected = 0;
    for (let s = 14; s < pmf.length; s += 1) expected += pmf[s] * Math.floor((s - 14) / 4);
    expect(expectedRaises(6, 3, 14)).toBeCloseTo(expected, 12);
  });

  it('quantile is the inverse of the CDF', () => {
    const pmf = poolKeepPmf(5, 2);
    const q50 = pmfQuantile(pmf, 0.5);
    expect(pmfAtLeast(pmf, q50 + 1)).toBeLessThan(0.5 + 1e-9);
    expect(pmfAtLeast(pmf, q50)).toBeGreaterThanOrEqual(0.5 - 1e-9);
  });

  it('expectedOverThreshold matches manual sum', () => {
    const pmf = plainDamagePmf(3);
    let manual = 0;
    for (let s = 0; s < pmf.length; s += 1) if (s > 10) manual += pmf[s] * (s - 10);
    expect(expectedOverThreshold(pmf, 10)).toBeCloseTo(manual, 12);
  });
});
