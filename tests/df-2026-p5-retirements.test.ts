import { describe, expect, it } from 'vitest';
import { buildRestHealthBarUpdates, buildSafeHavenRestUpdates } from '../src/utils/safe-haven-rest';
import { medicineSpecializationRank } from '../src/rules/specializations';
import { createEmptyBond, validateBondRitual } from '../src/stones/summon-bond-bind';
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

describe('DF 2026 P5 — Summon task mapping is retired', () => {
  it('blocks Apply while a legacy task mapping is stored', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'Actor.1',
      movementMode: 'flying',
      stoneAttributes: ['vitality'],
    });
    expect('taskSpecMap' in bond).toBe(false);
    bond.taskSpecMap = { tracking: 'a' };
    expect(validateBondRitual(bond, 2).errors).toContain(
      'Summon task mapping is retired; natural tasks use the owner\'s Professions.',
    );
  });
});

describe('DF 2026 P5 — Emergency Medicine TN', () => {
  it('is patient MR × 4', () => {
    expect(emergencyMedicineTnForPatient({ system: { mastery: { rank: 3 } } })).toBe(12);
  });
});
