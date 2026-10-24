import { describe, expect, it } from 'vitest';
import {
  authoritativeBaseTn,
  authoritativeCheckContext,
  bindDraftToGmRequest,
  buildSkillCheckResolvedSnapshot,
  clampPaidRaises,
  finalSkillTn,
  finalizeSkillCheckAllocation,
  freeAllowance,
  getSkillRaiseAllowance,
  missingGmContextFields,
  paidCap,
  paidRaiseSelectOptions,
  planSkillCheckDraft,
  planSpecializationRoll,
  skillCheckSuccessRaiseBudget,
  validateAgainstGmAssignment,
  validatePaidRaisesDeclaration,
  validateSkillRaiseEffectAllocation,
  type SkillCheckDraft,
} from '../src/rules/index.js';

const trackingSystem = {
  mastery: { rank: 3 },
  attributes: {
    might: { value: 2 },
    agility: { value: 3 },
    vitality: { value: 3 },
    intellect: { value: 4 },
    resolve: { value: 3 },
    influence: { value: 2 },
    wits: { value: 6 },
  },
  specializations: [
    {
      id: 'physical:tracking',
      name: 'Tracking',
      field: 'physical',
      scope: 'Following trails',
      rank: 4,
    },
    {
      id: 'science-craft:alchemy',
      name: 'Alchemy',
      field: 'science-craft',
      scope: 'Brewing',
      rank: 8,
    },
    {
      id: 'investigation:perception',
      name: 'Perception',
      field: 'investigation',
      scope: 'Noticing details',
      rank: 2,
    },
  ],
};

function gmRequestDraft(
  paid: number,
  overrides?: Partial<{
    attributeKey: string;
    baseTn: number;
    skillId: string;
    task: string;
  }>,
): SkillCheckDraft {
  const attributeKey = overrides?.attributeKey ?? 'wits';
  const baseTn = overrides?.baseTn ?? 12;
  const skill = {
    kind: 'specialization' as const,
    id: overrides?.skillId ?? 'physical:tracking',
  };
  const task = overrides?.task ?? 'Examine tracks at the north gate';
  return {
    actorId: 'Actor.mira',
    paidRaises: paid,
    skill,
    attributeKey,
    baseTn,
    taskDescription: task,
    source: {
      kind: 'gm-request',
      requestId: 'req-1',
      gmVerified: true,
      taskDescription: task,
      attributeKey: 'wits',
      baseTn: 12,
      skill: { kind: 'specialization', id: 'physical:tracking' },
    },
  };
}

describe('DF 2026 Skill Check dual entry — Rank table', () => {
  it('Paid cap and Free allowance for Ranks 0–8', () => {
    const expected: Array<[number, number, number]> = [
      [0, 0, 0],
      [1, 1, 0],
      [2, 2, 0],
      [3, 3, 0],
      [4, 3, 1],
      [5, 4, 1],
      [6, 4, 2],
      [7, 5, 2],
      [8, 5, 3],
    ];
    for (const [rank, paid, free] of expected) {
      expect(paidCap(rank)).toBe(paid);
      expect(freeAllowance(rank)).toBe(free);
      expect(getSkillRaiseAllowance(rank)).toEqual({
        maxPaid: paid,
        maxFree: free,
        maxTotal: paid + free,
      });
    }
  });

  it('Rank 4 Paid options 0..3 with Final TN labels', () => {
    const r4 = paidRaiseSelectOptions(4, 12);
    expect(r4.map((o) => o.paid)).toEqual([0, 1, 2, 3]);
    expect(r4.map((o) => o.finalTn)).toEqual([12, 16, 20, 24]);
  });
});

describe('DF 2026 GM-defined check — Tracking / Wits / TN 12', () => {
  it('authoritative context locks Attribute, Skill, Base TN; player only varies Paid', () => {
    const forged = gmRequestDraft(2, {
      attributeKey: 'intellect',
      baseTn: 4,
      skillId: 'science-craft:alchemy',
    });
    const ctx = authoritativeCheckContext(forged);
    expect(ctx.attributeKey).toBe('wits');
    expect(ctx.baseTn).toBe(12);
    expect(ctx.skill).toEqual({ kind: 'specialization', id: 'physical:tracking' });
    expect(ctx.gmVerified).toBe(true);

    const plan = planSkillCheckDraft({ system: trackingSystem, draft: forged });
    expect(plan.ok).toBe(true);
    expect(plan.attributeKey).toBe('wits');
    expect(plan.baseTn).toBe(12);
    expect(plan.skillName).toBe('Tracking');
    expect(plan.finalTn).toBe(20);
    expect(plan.numDice).toBe(6);
    expect(plan.keepDice).toBe(3);
    expect(plan.showFreeBanner).toBe(true);
    expect(plan.freeRaisesOnSuccess).toBe(1);
  });

  it('Paid 0/1/2/3 → Final TN 12/16/20/24; success budget Paid+Free', () => {
    for (const [paid, tn] of [
      [0, 12],
      [1, 16],
      [2, 20],
      [3, 24],
    ] as const) {
      const plan = planSkillCheckDraft({
        system: trackingSystem,
        draft: gmRequestDraft(paid),
      });
      expect(plan.finalTn).toBe(tn);
    }
    const plan = planSkillCheckDraft({
      system: trackingSystem,
      draft: gmRequestDraft(2),
    });
    const ok = buildSkillCheckResolvedSnapshot({
      plan,
      actorId: 'mira',
      source: gmRequestDraft(2).source,
      rollTotal: 25,
      success: true,
    });
    expect(ok.allocationStatus).toBe('pending');
    expect(skillCheckSuccessRaiseBudget(4, 2).available).toBe(3);

    const fail = buildSkillCheckResolvedSnapshot({
      plan,
      actorId: 'mira',
      source: gmRequestDraft(2).source,
      rollTotal: 18,
      success: false,
    });
    expect(fail.allocationStatus).toBe('not-applicable');
  });

  it('validateAgainstGmAssignment rejects Skill / Attribute / TN overrides', () => {
    const assignment = {
      attributeKey: 'wits',
      baseTn: 12,
      skill: { kind: 'specialization' as const, id: 'physical:tracking' },
    };
    const okDraft = bindDraftToGmRequest(gmRequestDraft(1), {
      requestId: 'req-1',
      taskDescription: 'Tracks',
      ...assignment,
    });
    expect(validateAgainstGmAssignment(okDraft, assignment).ok).toBe(true);

    const badSkill: SkillCheckDraft = {
      ...okDraft,
      skill: { kind: 'specialization', id: 'science-craft:alchemy' },
      source: {
        ...okDraft.source,
        kind: 'gm-request',
        gmVerified: true,
        requestId: 'req-1',
        taskDescription: 'Tracks',
        attributeKey: 'wits',
        baseTn: 12,
        skill: { kind: 'specialization', id: 'science-craft:alchemy' },
      },
    };
    expect(validateAgainstGmAssignment(badSkill, assignment).ok).toBe(false);

    const badAttr: SkillCheckDraft = {
      ...okDraft,
      attributeKey: 'intellect',
      source: {
        ...(okDraft.source as any),
        attributeKey: 'intellect',
      },
    };
    expect(validateAgainstGmAssignment(badAttr, assignment).ok).toBe(false);

    const badTn: SkillCheckDraft = {
      ...okDraft,
      baseTn: 8,
      source: {
        ...(okDraft.source as any),
        baseTn: 8,
      },
    };
    expect(validateAgainstGmAssignment(badTn, assignment).ok).toBe(false);
  });
});

describe('DF 2026 GM-defined — multi-PC + Perception', () => {
  it('two PCs share Base TN 12 with independent Paid / Final TN', () => {
    const mira = planSkillCheckDraft({
      system: trackingSystem,
      draft: gmRequestDraft(2),
    });
    const evarrSystem = {
      ...trackingSystem,
      mastery: { rank: 2 },
      attributes: { ...trackingSystem.attributes, wits: { value: 4 } },
    };
    const evarrDraft: SkillCheckDraft = {
      actorId: 'evarr',
      paidRaises: 2,
      skill: { kind: 'perception' },
      attributeKey: 'wits',
      baseTn: 12,
      taskDescription: 'Examine tracks at the north gate',
      source: {
        kind: 'gm-request',
        requestId: 'req',
        gmVerified: true,
        taskDescription: 'Examine tracks at the north gate',
        attributeKey: 'wits',
        baseTn: 12,
        skill: { kind: 'perception' },
      },
    };
    const evarr = planSkillCheckDraft({ system: evarrSystem, draft: evarrDraft });
    expect(mira.baseTn).toBe(12);
    expect(mira.finalTn).toBe(20);
    expect(evarr.baseTn).toBe(12);
    expect(evarr.finalTn).toBe(20);
    expect(evarr.skillName).toBe('Perception');
    expect(evarr.showFreeBanner).toBe(false);
    expect(mira.rank).toBe(4);
    expect(evarr.rank).toBe(2);
  });

  it('Perception request cannot be substituted with Alchemy via draft forge', () => {
    const draft: SkillCheckDraft = {
      actorId: 'mira',
      paidRaises: 0,
      skill: { kind: 'specialization', id: 'science-craft:alchemy' },
      attributeKey: 'intellect',
      baseTn: 8,
      source: {
        kind: 'gm-request',
        requestId: 'req-p',
        gmVerified: true,
        taskDescription: 'Notice the ambush',
        attributeKey: 'wits',
        baseTn: 12,
        skill: { kind: 'perception' },
      },
    };
    const plan = planSkillCheckDraft({ system: trackingSystem, draft });
    expect(plan.skillName).toBe('Perception');
    expect(plan.attributeKey).toBe('wits');
    expect(plan.baseTn).toBe(12);
    expect(
      validateAgainstGmAssignment(draft, {
        attributeKey: 'wits',
        baseTn: 12,
        skill: { kind: 'perception' },
      }).ok,
    ).toBe(false);
  });
});

describe('DF 2026 sheet-verbal — missing GM context', () => {
  it('does not invent Attribute/TN; reports missing fields', () => {
    expect(missingGmContextFields({ taskDescription: '', attributeKey: '', baseTn: Number.NaN })).toEqual([
      'task',
      'attribute',
      'baseTn',
    ]);
    const incomplete: SkillCheckDraft = {
      actorId: 'mira',
      paidRaises: 0,
      skill: { kind: 'specialization', id: 'physical:tracking' },
      attributeKey: '',
      baseTn: Number.NaN,
      source: {
        kind: 'sheet-verbal',
        gmVerified: false,
        taskDescription: '',
        attributeKey: '',
        baseTn: Number.NaN,
        skill: { kind: 'specialization', id: 'physical:tracking' },
      },
    };
    const plan = planSkillCheckDraft({ system: trackingSystem, draft: incomplete });
    expect(plan.ok).toBe(false);
    expect(plan.missing).toEqual(expect.arrayContaining(['task', 'attribute', 'baseTn']));
    expect(plan.gmVerified).toBe(false);
  });

  it('accepts complete GM-announced local record without claiming verified', () => {
    const draft: SkillCheckDraft = {
      actorId: 'mira',
      paidRaises: 1,
      skill: { kind: 'specialization', id: 'physical:tracking' },
      attributeKey: 'wits',
      baseTn: 12,
      taskDescription: 'Tracks (verbal)',
      source: {
        kind: 'sheet-verbal',
        gmVerified: false,
        taskDescription: 'Tracks (verbal)',
        attributeKey: 'wits',
        baseTn: 12,
        skill: { kind: 'specialization', id: 'physical:tracking' },
      },
    };
    const plan = planSkillCheckDraft({ system: trackingSystem, draft });
    expect(plan.ok).toBe(true);
    expect(plan.gmVerified).toBe(false);
    expect(plan.sourceKind).toBe('sheet-verbal');
    expect(plan.finalTn).toBe(16);
  });
});

describe('DF 2026 Skill Check — validation & allocation', () => {
  it('rejects forged paidRaises=8 for Rank 2; untrained 0 Raises', () => {
    expect(validatePaidRaisesDeclaration(2, 8).ok).toBe(false);
    expect(clampPaidRaises(2, 8)).toEqual({ paid: 2, clamped: true });
    const untrained = planSkillCheckDraft({
      system: trackingSystem,
      draft: {
        actorId: 'x',
        paidRaises: 0,
        skill: { kind: 'untrained' },
        attributeKey: 'wits',
        baseTn: 12,
        taskDescription: 'Force the lock',
        source: {
          kind: 'gm-request',
          requestId: 'u',
          gmVerified: true,
          taskDescription: 'Force the lock',
          attributeKey: 'wits',
          baseTn: 12,
          skill: { kind: 'untrained' },
        },
      },
    });
    expect(untrained.ok).toBe(true);
    expect(untrained.rollDisadvantage).toBe(true);
    expect(untrained.freeRaisesOnSuccess).toBe(0);
  });

  it('effect allocation + finalize; high roll never exceeds Paid+Free', () => {
    const plan = planSkillCheckDraft({
      system: trackingSystem,
      draft: gmRequestDraft(2),
    });
    const snap = buildSkillCheckResolvedSnapshot({
      plan,
      actorId: 'mira',
      source: gmRequestDraft(2).source,
      rollTotal: 25,
      success: true,
    });
    expect(validateSkillRaiseEffectAllocation(3, { scope: 2, insight: 2 }).ok).toBe(false);
    const done = finalizeSkillCheckAllocation(
      snap,
      { scope: 2, insight: 1, speed: 0, quality: 0, efficiency: 0, safety: 0 },
      'Two more track groups',
    );
    expect(done.ok).toBe(true);
    expect(done.snapshot.allocationStatus).toBe('finalized');
    expect(skillCheckSuccessRaiseBudget(4, 2).available).toBe(3);
    expect(finalSkillTn(12, 2)).toBe(20);
    expect(authoritativeBaseTn(gmRequestDraft(0))).toBe(12);
  });

  it('planSpecializationRoll still ignores Free pre-select', () => {
    const plan = planSpecializationRoll({
      rank: 4,
      attributeValue: 6,
      masteryRank: 3,
      baseTn: 12,
      paidRaises: 2,
      freeRaises: 99,
    });
    expect(plan.ok).toBe(true);
    expect(plan.finalTn).toBe(20);
    expect(plan.freeRaises).toBe(1);
  });
});
