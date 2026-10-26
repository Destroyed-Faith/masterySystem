import { describe, expect, it, vi } from 'vitest';
import {
  SPECIALIZATION_XP_PER_RANK,
  buildSpecializationSheetRows,
  finalSkillTn,
  getSkillRaiseAllowance,
  passiveSkillSucceeds,
  passiveSkillValue,
  planSpecializationRoll,
  rankUpSpecialization,
  readSpecializations,
  removeSpecialization,
  skillTaskBaseTn,
  specializationIdentityKey,
  specializationRankUpCost,
  upsertSpecialization,
  validateSkillRaiseAllocation,
  type SpecializationRecord,
} from '../src/rules/index.js';

const lockpicking: SpecializationRecord = {
  id: specializationIdentityKey('Lockpicking', 'finesse'),
  name: 'Lockpicking',
  field: 'finesse',
  scope: 'Opening mechanical locks with tools.',
  rank: 4,
};

describe('DF 2026 Specializations — Acceptance B (Raises / TN)', () => {
  it('raise allowance by Rank — Free retired; Paid uncapped when trained', () => {
    expect(getSkillRaiseAllowance(0)).toEqual({ maxPaid: 0, maxFree: 0, maxTotal: 0 });
    expect(getSkillRaiseAllowance(1).maxFree).toBe(0);
    expect(getSkillRaiseAllowance(1).maxPaid).toBe(Number.POSITIVE_INFINITY);
    expect(getSkillRaiseAllowance(4).maxFree).toBe(0);
    expect(getSkillRaiseAllowance(8).maxFree).toBe(0);
  });

  it('Base TN = Task Level × 4; each Paid Raise +4; Free Raises retired', () => {
    expect(skillTaskBaseTn(2)).toBe(8);
    expect(finalSkillTn(8, 0)).toBe(8);
    expect(finalSkillTn(8, 2)).toBe(16);
    const plan = planSpecializationRoll({
      rank: 4,
      attributeValue: 5,
      masteryRank: 3,
      taskLevel: 2,
      paidRaises: 2,
      freeRaises: 99, // ignored — Free Raises retired
    });
    expect(plan.ok).toBe(true);
    expect(plan.baseTn).toBe(8);
    expect(plan.finalTn).toBe(16);
    expect(plan.paidRaises).toBe(2);
    expect(plan.freeRaises).toBe(0);
    expect(plan.skillAdvantageRerollMax).toBe(3);
  });

  it('trained pool: Attribute dice, Keep = MR, no Disadvantage', () => {
    const plan = planSpecializationRoll({ rank: 2, attributeValue: 6, masteryRank: 3, taskLevel: 3 });
    expect(plan.trained).toBe(true);
    expect(plan.numDice).toBe(6);
    expect(plan.keepDice).toBe(3);
    expect(plan.rollDisadvantage).toBe(false);
    expect(plan.baseTn).toBe(12);
    expect(plan.skillAdvantageRerollMax).toBe(1);
  });

  it('rejects Free Raises; allows uncapped Paid when trained', () => {
    expect(validateSkillRaiseAllocation(2, 3, 0).ok).toBe(true);
    expect(validateSkillRaiseAllocation(3, 3, 1).ok).toBe(false);
    const plan = planSpecializationRoll({
      rank: 2,
      attributeValue: 4,
      masteryRank: 2,
      taskLevel: 2,
      paidRaises: 3,
    });
    expect(plan.ok).toBe(true);
    expect(plan.paidRaises).toBe(3);
    expect(plan.finalTn).toBe(20);
  });

  it('untrained: full Attribute pool + Disadvantage and 0 Raises', () => {
    const plan = planSpecializationRoll({
      rank: 0,
      attributeValue: 5,
      masteryRank: 2,
      taskLevel: 2,
    });
    expect(plan.ok).toBe(true);
    expect(plan.trained).toBe(false);
    expect(plan.numDice).toBe(5);
    expect(plan.keepDice).toBe(2);
    expect(plan.rollDisadvantage).toBe(true);
    expect(plan.paidRaises).toBe(0);
    expect(plan.freeRaises).toBe(0);
    expect(plan.finalTn).toBe(plan.baseTn);
  });

  it('untrained cannot take any Paid Raise; Free input is ignored', () => {
    const paid = planSpecializationRoll({
      rank: null,
      attributeValue: 5,
      masteryRank: 2,
      taskLevel: 2,
      paidRaises: 1,
    });
    expect(paid.ok).toBe(false);
    expect(paid.paidRaises).toBe(0);
    const freeIgnored = planSpecializationRoll({
      rank: undefined,
      attributeValue: 5,
      masteryRank: 2,
      taskLevel: 2,
      freeRaises: 1,
    });
    expect(freeIgnored.ok).toBe(true);
    expect(freeIgnored.freeRaises).toBe(0);
    expect(freeIgnored.paidRaises).toBe(0);
  });
});

describe('DF 2026 Specializations — Acceptance C (Passive Value / sheet rows)', () => {
  it('passive value = 2 × Attribute', () => {
    expect(passiveSkillValue(6)).toBe(12);
    expect(passiveSkillSucceeds(6, 12)).toBe(true);
    expect(passiveSkillSucceeds(6, 13)).toBe(false);
  });

  it('sheet rows carry Field label, allowance and passive hint', () => {
    const rows = buildSpecializationSheetRows([lockpicking], {
      might: 2,
      agility: 6,
      vitality: 3,
      intellect: 4,
      resolve: 2,
      influence: 2,
      wits: 5,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].fieldLabel).toBe('Finesse');
    expect(rows[0].maxFree).toBe(0);
    expect(rows[0].skillAdvantageLabel).toMatch(/1–3|1-3/);
    expect(rows[0].skillCritDailyAllowance).toBe(0);
    expect(rows[0].passiveBest).toBe(12);
    expect(rows[0].passiveBestAttribute).toBe('Agility');
    expect(rows[0].passiveHint).toContain('12');
  });

  it('reads arrays and keyed objects, skipping blank names', () => {
    const arr = readSpecializations({ specializations: [lockpicking, { name: '  ', rank: 2 }] });
    expect(arr.map((s) => s.name)).toEqual(['Lockpicking']);
    const obj = readSpecializations({ specializations: { a: { name: 'Haggling', field: 'social', rank: 2 } } });
    expect(obj[0].field).toBe('social');
    expect(obj[0].id).toBe(specializationIdentityKey('Haggling', 'social'));
    expect(readSpecializations({})).toEqual([]);
  });
});

describe('Specialization list helpers + Rank-up', () => {
  it('Rank-up uses XP ladder and caps at Rank 8', () => {
    expect(SPECIALIZATION_XP_PER_RANK).toBe(4); // deprecated constant retained
    expect(specializationRankUpCost(2)).toBe(6);
    expect(specializationRankUpCost(3)).toBe(8);
    expect(specializationRankUpCost(8)).toBe(0);
    const up = rankUpSpecialization([lockpicking], lockpicking.id);
    expect(up?.[0].rank).toBe(5);
    const maxed = [{ ...lockpicking, rank: 8 }];
    expect(rankUpSpecialization(maxed, lockpicking.id)).toBeNull();
    expect(rankUpSpecialization([lockpicking], 'missing')).toBeNull();
  });

  it('upsert / remove', () => {
    const added = upsertSpecialization([lockpicking], {
      ...lockpicking,
      id: specializationIdentityKey('Haggling', 'social'),
      name: 'Haggling',
      field: 'social',
      rank: 2,
    });
    expect(added).toHaveLength(2);
    const edited = upsertSpecialization(added, { ...lockpicking, scope: 'Updated.' }, lockpicking.id);
    expect(edited).toHaveLength(2);
    expect(edited[0].scope).toBe('Updated.');
    expect(removeSpecialization(edited, lockpicking.id)).toHaveLength(1);
  });
});

describe('Skill Spend retired', () => {
  it('epic roll spend options are always empty', async () => {
    const { getSkillSpendOptions } = await import('../src/epic-roll/epic-mastery-roll-skill-spend.js');
    const actor: any = { system: { skills: { stealth: 8 }, skillsSpent: {}, mastery: { rank: 2 } } };
    const out = getSkillSpendOptions(actor, 'stealth', { kept: [3], tn: 10, success: false, raises: 0 } as any, 0);
    expect(out.options).toEqual([]);
    expect(out.remainingPool).toBe(0);
  });

  it('registerSkillSpendClickHandler registers no hooks', async () => {
    const on = vi.fn();
    (globalThis as any).Hooks = { on };
    const { registerSkillSpendClickHandler } = await import('../src/chat/skill-spend-handler.js');
    registerSkillSpendClickHandler();
    expect(on).not.toHaveBeenCalled();
  });

  it('retroactive Stealth spend always returns 0', async () => {
    const { promptRetroactiveStealthSpend } = await import('../src/combat/perception-gate.js');
    const actor: any = { system: { skills: { stealth: 8 }, skillsSpent: {}, mastery: { rank: 2 } } };
    await expect(promptRetroactiveStealthSpend(actor, 20, 10)).resolves.toBe(0);
  });
});
