/**
 * Unit tests for the Encounter Generator balance model.
 */
import { describe, it, expect } from 'vitest';
import {
  DIFFICULTY_PARAMS,
  damageDiceForTarget,
  deriveEncounterPlan,
  escalationFactor,
  evadeToMrAgility,
  recommendRespawn,
  solveAttackDiceForHitRate,
  splitHpAcrossPhases,
} from '../src/creation/encounter-generator/encounter-generator-balance';
import { buildPartyMetrics, extractPartyMember } from '../src/creation/encounter-generator/encounter-generator-analysis';
import type { PartyMetrics } from '../src/creation/encounter-generator/encounter-generator-types';

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

function makeParty(size: number, mr: number, evade: number, hp: number, seed = 5): PartyMetrics {
  const members = [];
  for (let i = 0; i < size; i++) {
    members.push(
      extractPartyMember(
        {
          id: `pc-${i}`,
          name: `PC ${i}`,
          system: {
            mastery: { rank: mr },
            combat: { evadeTotal: evade, armorTotal: mr, damageReductionPct: 0 },
            attributes: { might: { value: mr * 4 }, agility: { value: 8 } },
            health: { bars: [{ max: hp }] },
          },
          items: [],
        },
        2000,
        seededRng(seed + i),
      ),
    );
  }
  return buildPartyMetrics(members);
}

describe('DIFFICULTY_PARAMS', () => {
  it('has all three tiers with escalating boss TTK', () => {
    expect(DIFFICULTY_PARAMS.moderate.bossTTKRounds).toBeLessThan(DIFFICULTY_PARAMS.hard.bossTTKRounds);
    expect(DIFFICULTY_PARAMS.hard.bossTTKRounds).toBeLessThan(DIFFICULTY_PARAMS.brutal.bossTTKRounds);
  });
});

describe('escalationFactor', () => {
  it('is non-decreasing and clamps past the table', () => {
    expect(escalationFactor(0)).toBe(1.0);
    expect(escalationFactor(1)).toBeGreaterThan(escalationFactor(0));
    expect(escalationFactor(10)).toBe(escalationFactor(4));
  });
});

describe('splitHpAcrossPhases', () => {
  it('sums back to the total and has the right length', () => {
    const parts = splitHpAcrossPhases(101, 4);
    expect(parts.length).toBe(4);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(101);
  });
  it('never produces fewer HP than phases', () => {
    const parts = splitHpAcrossPhases(1, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(3);
  });
});

describe('evadeToMrAgility', () => {
  it('uses MR×4 only (no agility contribution)', () => {
    const r = evadeToMrAgility(18, 4);
    expect(r.mr).toBe(5);
    expect(r.realizedEvade).toBe(20);
    expect(r.agility).toBe(2);
  });
  it('bumps MR to reach high target evade', () => {
    const r = evadeToMrAgility(30, 4);
    expect(r.mr).toBe(8);
    expect(r.realizedEvade).toBe(32);
  });
  it('never drops evade below MR×4', () => {
    const r = evadeToMrAgility(4, 4);
    expect(r.realizedEvade).toBe(16);
  });
  it('respects an explicit MR ceiling (party + 1)', () => {
    const r = evadeToMrAgility(30, 4, 3);
    expect(r.mr).toBe(3);
  });
});

describe('damageDiceForTarget', () => {
  it('rounds to nearest dice and clamps', () => {
    expect(damageDiceForTarget(0, 2, 16)).toBe(2);
    expect(damageDiceForTarget(1000, 2, 16)).toBe(16);
    expect(damageDiceForTarget(10.3)).toBe(2); // 10.3 / 5.14 ≈ 2
  });
});

describe('solveAttackDiceForHitRate', () => {
  it('returns a pool within range and higher target rate needs >= dice', () => {
    const lowRate = solveAttackDiceForHitRate(16, 3, 0.4, 2, 16, 1200, seededRng(11));
    const highRate = solveAttackDiceForHitRate(16, 3, 0.8, 2, 16, 1200, seededRng(11));
    expect(lowRate).toBeGreaterThanOrEqual(2);
    expect(highRate).toBeLessThanOrEqual(16);
    expect(highRate).toBeGreaterThanOrEqual(lowRate);
  });
});

describe('recommendRespawn', () => {
  it('scales minions-per-wave with party size and pressure', () => {
    const party = makeParty(4, 3, 16, 30);
    const mod = recommendRespawn(party, DIFFICULTY_PARAMS.moderate);
    const bru = recommendRespawn(party, DIFFICULTY_PARAMS.brutal);
    expect(bru.perWave).toBeGreaterThanOrEqual(mod.perWave);
    expect(bru.cadence).toBeLessThanOrEqual(mod.cadence);
  });
});

describe('deriveEncounterPlan', () => {
  const party = makeParty(4, 3, 16, 36);

  it('produces the requested number of bosses, phases and minions', () => {
    const plan = deriveEncounterPlan(
      party,
      'hard',
      { bossCount: 2, phasesPerBoss: 3, minionCount: 4, respawnCadence: 2 },
      seededRng(99),
    );
    expect(plan.bosses.length).toBe(2);
    expect(plan.minions.length).toBe(4);
    for (const boss of plan.bosses) {
      expect(boss.phases.length).toBe(3);
      expect(boss.kind).toBe('boss');
    }
    for (const minion of plan.minions) {
      expect(minion.phases.length).toBe(1);
      expect(minion.kind).toBe('minion');
    }
  });

  it('sets sane stat ranges and escalating phases', () => {
    const plan = deriveEncounterPlan(
      party,
      'hard',
      { bossCount: 1, phasesPerBoss: 4, minionCount: 0, respawnCadence: 0 },
      seededRng(7),
    );
    const boss = plan.bosses[0];
    expect(boss.mr).toBeGreaterThanOrEqual(1);
    expect(boss.attackSlots).toBeGreaterThanOrEqual(1);
    for (const phase of boss.phases) {
      expect(phase.hp).toBeGreaterThan(0);
      expect(phase.attackDiceCount).toBeGreaterThanOrEqual(2);
      expect(phase.attackDiceCount).toBeLessThanOrEqual(16);
      expect(phase.damageDiceCount).toBeGreaterThanOrEqual(2);
      expect(phase.damageDiceCount).toBeLessThanOrEqual(16);
    }
    // later phases hit at least as hard as the first
    expect(boss.phases[boss.phases.length - 1].damageDiceCount).toBeGreaterThanOrEqual(
      boss.phases[0].damageDiceCount,
    );
  });

  it('fills in respawn recommendations', () => {
    const plan = deriveEncounterPlan(
      party,
      'brutal',
      { bossCount: 1, phasesPerBoss: 2, minionCount: 6, respawnCadence: 1 },
      seededRng(3),
    );
    expect(plan.respawn.minionsPerWave).toBe(6);
    expect(plan.respawn.cadenceRounds).toBe(1);
    expect(plan.respawn.recommendedPerWave).toBeGreaterThan(0);
    expect(plan.respawn.recommendedCadence).toBeGreaterThan(0);
  });
});
