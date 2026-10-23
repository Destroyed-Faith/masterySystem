import { describe, expect, it } from 'vitest';
import { buildRestHealthBarUpdates, buildSafeHavenRestUpdates } from '../src/utils/safe-haven-rest';
import {
  medicineSpecializationRank,
  summonTaskDiceCaps,
  validateSummonTaskSpecMap,
} from '../src/rules/specializations';
import { finalizeRolledPool } from '../src/dice/pool-finalize';
import { emergencyMedicineTnForPatient } from '../src/combat/death-check';

function bars(...currents: number[]) {
  return currents.map((c) => ({ current: c, max: 5 }));
}

describe('DF 2026 P5 — Safe Haven scar recovery uses Medicine Spec', () => {
  const specs = (rank: number) => [
    { id: 'science-craft:medicine', name: 'Medicine', field: 'science-craft', scope: 'Heal wounds', rank },
  ];

  it('finds Medicine rank from specializations', () => {
    expect(medicineSpecializationRank({ specializations: specs(5) })).toBe(5);
    expect(medicineSpecializationRank({ specializations: [] })).toBe(0);
  });

  it('restores 1 / 2 / 3 scarred bars at Medicine rank 0 / 4 / 8', () => {
    const health = { bars: bars(0, 0, 0, 5, 5) };
    const base = buildSafeHavenRestUpdates({ mastery: { rank: 2 }, health, specializations: [] });
    const r4 = buildSafeHavenRestUpdates({ mastery: { rank: 2 }, health, specializations: specs(4) });
    const r8 = buildSafeHavenRestUpdates({ mastery: { rank: 2 }, health, specializations: specs(8) });
    const scarred = (u: any) => (u['system.health.bars'] as any[]).filter((b) => b.current === 0).length;
    expect(scarred(base)).toBe(2);
    expect(scarred(r4)).toBe(1);
    expect(scarred(r8)).toBe(0);
  });

  it('buildRestHealthBarUpdates honours scarBarsToRestore', () => {
    const out = buildRestHealthBarUpdates({ health: { bars: bars(0, 0, 5) } }, {
      restoreOneScarredBar: false,
      scarBarsToRestore: 2,
    });
    expect((out['system.health.bars'] as any[]).every((b) => b.current > 0)).toBe(true);
  });
});

describe('DF 2026 P5 — Fear pool floor', () => {
  const actor = (fear: number) => ({ system: { fear, attributes: { might: { value: 6 } } } });

  it('keeps two dice when Fear would drop the pool lower', () => {
    const res = finalizeRolledPool(actor(10), 6, 2, {
      rollKind: 'skill',
      poolAttribute: 'might',
      applyPoolPenalties: false,
      applyFear: true,
    });
    expect(res.numDice).toBe(2);
  });
});

describe('DF 2026 P5 — Summon task mapping', () => {
  const ownerSpecs = [
    { id: 'a', name: 'Tracker', field: 'survival' as const, scope: 'x', rank: 3 },
    { id: 'b', name: 'Sneak', field: 'finesse' as const, scope: 'x', rank: 2 },
  ];

  it('limits mapped tasks to the slot count', () => {
    const map = { tracking: 'a', stealth: 'b', search: 'a' } as const;
    expect(validateSummonTaskSpecMap({ map, boundStones: 1, ownerSpecs }).length).toBeGreaterThan(0);
    expect(validateSummonTaskSpecMap({ map, boundStones: 2, ownerSpecs })).toEqual([]);
  });

  it('caps dice at 2 × Spec Rank, Perception at 2 × MR', () => {
    const caps = summonTaskDiceCaps({
      map: { tracking: 'a', perception: 'owner-mr' },
      ownerSpecs,
      ownerMasteryRank: 4,
    });
    expect(caps.tracking).toBe(6);
    expect(caps.perception).toBe(8);
  });
});

describe('DF 2026 P5 — Emergency Medicine TN', () => {
  it('is patient MR × 4', () => {
    expect(emergencyMedicineTnForPatient({ system: { mastery: { rank: 3 } } })).toBe(12);
  });
});
