import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CORE_RITUALS } from '../src/rules/core-rituals.js';
import {
  planRitualRaises,
  ritualTrainingModifiers,
} from '../src/rules/ritual-tn.js';
import { skillAdvantageRerollMax } from '../src/rules/skill-advantage.js';
import {
  buildSummonNaturalTaskKey,
  planSummonNaturalTask,
  summonTaskAllowsProfessionTransfer,
} from '../src/stones/summon-natural-task.js';
import {
  buildSummonSkillDiceRefundUpdate,
  planSummonSkillDiceRefund,
} from '../src/migrations/summon-skill-dice-refund-migration.js';
import { applyBondFieldDelta } from '../src/stones/summon-bond-spend.js';
import { computeSummonBond, emptyBondSpend } from '../src/stones/summon-bond-rules.js';
import { tokensSummary } from '../src/stones/summon-bond-bind.js';
import { professionIdentityKey } from '../src/rules/specializations.js';

function mockOwner(opts: {
  attrs?: Record<string, number>;
  specs: Array<{ id: string; name: string; rank: number; scope?: string }>;
  mr?: number;
}) {
  const flags: Record<string, unknown> = { 'mastery-system': {} };
  return {
    id: 'owner-1',
    name: 'Owner',
    flags,
    system: {
      mastery: { rank: opts.mr ?? 3 },
      attributes: Object.fromEntries(
        Object.entries(opts.attrs ?? { wits: 8, agility: 6, might: 5, influence: 4 }).map(
          ([k, v]) => [k, { value: v }],
        ),
      ),
      specializations: opts.specs.map((s) => ({
        id: s.id,
        name: s.name,
        scope: s.scope ?? '',
        rank: s.rank,
      })),
    },
    getFlag(_ns: string, key: string) {
      return (flags['mastery-system'] as any)?.[key];
    },
    async setFlag(_ns: string, key: string, value: unknown) {
      (flags['mastery-system'] as any)[key] = value;
    },
  };
}

describe('K8 Rituals — optional Profession, Stones required', () => {
  it('exposes all 16 Core Rituals with no Profession gate in TN planning', () => {
    expect(CORE_RITUALS).toHaveLength(16);
    const bare = planRitualRaises({ taskLevel: 3, namedTier: 0 });
    expect(bare.ok).toBe(true);
    expect(bare.baseTn).toBe(12);
    expect(bare.sealedStones).toBe(1);
    expect(bare.freeRaises).toBe(0);
  });

  it('applies Training Advantage only when a Profession Rank is supplied', () => {
    expect(ritualTrainingModifiers(0)).toEqual({
      rollDisadvantage: false,
      skillAdvantageRerollMax: 0,
    });
    expect(ritualTrainingModifiers(4).skillAdvantageRerollMax).toBe(4);
    expect(ritualTrainingModifiers(4).rollDisadvantage).toBe(false);
  });

  it('Guide states Stones are the only character-resource prerequisite', () => {
    const guide = readFileSync(
      resolve('docs/Rules/Canonical/Players_Handbook.md'),
      'utf8',
    );
    expect(guide).toContain(
      'The required Stones are the only character-resource prerequisite',
    );
    expect(guide).toContain('### Owner Professions for Summons');
    expect(guide).not.toContain('### Summon Skills');
    expect(guide).toContain('### Beta Profession Respec');
  });
});

describe('K8 Summon natural tasks — owner Profession checks', () => {
  const trackerId = professionIdentityKey('Tracker');
  const blacksmithId = professionIdentityKey('Blacksmith');
  const courtierId = professionIdentityKey('Courtier');
  const perceptionId = 'perception:perception';

  it('Tracker 4 + scent-tracking Hound plans one owner-based Rank 4 Training Check', () => {
    const owner = mockOwner({
      specs: [
        { id: trackerId, name: 'Tracker', rank: 4, scope: 'Scent trails and prey signs.' },
        { id: perceptionId, name: 'Perception', rank: 2 },
      ],
      mr: 3,
      attrs: { wits: 10 },
    });
    const plan = planSummonNaturalTask(owner, {
      taskDescription: 'The hound follows a scent trail through the brush.',
      taskKind: 'tracking',
      attributeKey: 'wits',
      professionId: trackerId,
      transferExplanation: 'Tracker experience reading trails transfers to the hound\'s scent work.',
      gmApproved: true,
      taskKey: 'scent-trail-1',
    });
    expect(plan.ok).toBe(true);
    expect(plan.poolDice).toBe(10);
    expect(plan.keepDice).toBe(3);
    expect(plan.skillAdvantageRerollMax).toBe(skillAdvantageRerollMax(4));
    expect(plan.rollDisadvantage).toBe(false);
    expect(plan.profession?.name).toBe('Tracker');
  });

  it('rejects Blacksmith forging and Courtier negotiation through animals', () => {
    expect(
      summonTaskAllowsProfessionTransfer({
        taskDescription: 'The hound forges iron fittings at the anvil.',
        taskKind: 'craft',
      }).ok,
    ).toBe(false);
    expect(
      summonTaskAllowsProfessionTransfer({
        taskDescription: 'The owl negotiates a treaty with the mayor.',
        taskKind: 'social',
      }).ok,
    ).toBe(false);

    const owner = mockOwner({
      specs: [
        { id: blacksmithId, name: 'Blacksmith', rank: 6 },
        { id: courtierId, name: 'Courtier', rank: 7 },
        { id: perceptionId, name: 'Perception', rank: 2 },
      ],
    });
    const forge = planSummonNaturalTask(owner, {
      taskDescription: 'Forge a horseshoe with the hound\'s paws.',
      taskKind: 'forging',
      attributeKey: 'might',
      professionId: blacksmithId,
      transferExplanation: 'High Rank Blacksmith.',
      gmApproved: true,
    });
    expect(forge.ok).toBe(false);
    expect(forge.rejected).toBe(true);

    const talk = planSummonNaturalTask(owner, {
      taskDescription: 'Persuade the merchant through the owl.',
      taskKind: 'persuasion',
      attributeKey: 'influence',
      professionId: courtierId,
      transferExplanation: 'Courtier Rank 7.',
      gmApproved: true,
    });
    expect(talk.ok).toBe(false);
    expect(talk.rejected).toBe(true);
  });

  it('independent Perception uses owner Perception; remote sight needs Shared Sense', () => {
    const owner = mockOwner({
      specs: [{ id: perceptionId, name: 'Perception', rank: 2 }],
      attrs: { wits: 7 },
      mr: 2,
    });
    const independent = planSummonNaturalTask(owner, {
      taskDescription: 'The owl watches the camp from a branch.',
      independentPerception: true,
      attributeKey: 'wits',
    });
    expect(independent.ok).toBe(true);
    expect(independent.usesPerception).toBe(true);
    expect(independent.skillAdvantageRerollMax).toBe(skillAdvantageRerollMax(2));

    const remoteBlocked = planSummonNaturalTask(owner, {
      taskDescription: 'Owner looks through the owl\'s eyes.',
      attributeKey: 'wits',
      independentPerception: true,
      sharedSenseActive: true,
      bodyHasSharedSense: false,
    });
    expect(remoteBlocked.ok).toBe(false);
    expect(remoteBlocked.error).toMatch(/Shared Sense/i);

    const remoteOk = planSummonNaturalTask(owner, {
      taskDescription: 'Owner looks through the owl\'s eyes.',
      attributeKey: 'wits',
      independentPerception: true,
      sharedSenseActive: true,
      bodyHasSharedSense: true,
    });
    expect(remoteOk.ok).toBe(true);
  });

  it('one task key per Bond — second attempt is refused', () => {
    const owner = mockOwner({
      specs: [
        { id: trackerId, name: 'Tracker', rank: 4 },
        { id: perceptionId, name: 'Perception', rank: 2 },
      ],
    });
    const again = planSummonNaturalTask(owner, {
      taskDescription: 'The hound follows the same scent again.',
      attributeKey: 'wits',
      professionId: trackerId,
      transferExplanation: 'Same tracking work.',
      gmApproved: true,
      taskKey: 'scent-trail-1',
      resolvedTaskKeys: ['scent-trail-1'],
    });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already resolved/i);
  });

  it('blocks new Skill Dice purchases and credits legacy Tokens idempotently', () => {
    const spend = emptyBondSpend(1);
    spend.skillDicePurchases = 2;
    expect(
      applyBondFieldDelta(spend, 'skillDicePurchases', 1, {
        boundStoneCount: 1,
        bonusTokens: 0,
        movementMode: 'flying',
      }),
    ).toBeNull();

    const actor = {
      id: 'a1',
      name: 'Migrator',
      system: {
        summonBonds: [
          {
            id: 'bond-owl',
            name: 'Scout Owl',
            spend: { ...emptyBondSpend(1), skillDicePurchases: 2 },
            selectedSkills: ['perception', 'stealth'],
            skillDiceAlloc: { perception: 2, stealth: 2 },
            bonusTokens: 0,
          },
        ],
      },
      flags: { 'mastery-system': {} },
      getFlag() {
        return undefined;
      },
    };
    const plan = planSummonSkillDiceRefund(actor);
    expect(plan.totalTokensCredited).toBe(2);
    expect(plan.bonds[0]?.alreadyRefunded).toBe(false);

    const first = buildSummonSkillDiceRefundUpdate(actor);
    expect(first.update['system.summonBonds'][0].skillDiceTokenCredit).toBe(2);
    expect(first.update['system.summonBonds'][0].spend.skillDicePurchases).toBe(0);
    expect(first.update['system.summonBonds'][0].selectedSkills).toEqual([]);

    // Apply stamp onto a fresh actor snapshot and ensure second plan is idempotent.
    const after = {
      ...actor,
      system: { summonBonds: first.update['system.summonBonds'] },
      flags: { 'mastery-system': { summonSkillDiceRefunded: true } },
      getFlag(_ns: string, key: string) {
        return key === 'summonSkillDiceRefunded' ? true : undefined;
      },
    };
    const second = planSummonSkillDiceRefund(after);
    expect(second.alreadyFullyRefunded).toBe(true);
    expect(second.totalTokensCredited).toBe(0);

    const computed = computeSummonBond({
      boundStoneCount: 1,
      bonusTokens: 0,
      skillDiceTokenCredit: 2,
      movementMode: 'flying',
      spend: emptyBondSpend(1),
    });
    // 8 base Tokens + 2 credit; Scout Owl spends 6 → 4 remaining with credit alone before other spends
    expect(computed.tokensAvailable).toBe(10);
  });

  it('preserves Scout Owl / Shadow Panther freed Tokens as unspent in the Guide', () => {
    const guide = readFileSync(
      resolve('docs/Rules/Canonical/Players_Handbook.md'),
      'utf8',
    );
    expect(guide).toContain('The Owl needs no purchased Skill Dice');
    expect(guide).toContain('| **Spent** | **6 Tokens** |');
    expect(guide).toContain('| **Unspent** | **2 Tokens** |');
    expect(guide).toContain('The Panther does not purchase Skill Dice');
    expect(guide).toContain('| **Spent** | **14 Tokens** |');
    expect(guide).toMatch(/12 m Flying Movement/);
    expect(guide).toMatch(/Passive: Damage at Power Level 2/);
  });

  it('skillDiceTokenCredit is real upgrade budget, not display-only', () => {
    const spend = emptyBondSpend(1);
    spend.attackPurchases = 4; // 8 Tokens — fully spent without credit
    const noCredit = {
      boundStoneCount: 1,
      bonusTokens: 0,
      movementMode: 'walking' as const,
      selectedSkills: [] as string[],
      ownerSkillRatings: {},
      maxBonusTokens: 0,
    };
    expect(applyBondFieldDelta(spend, 'damagePurchases', 1, noCredit)).toBeNull();

    const withCredit = { ...noCredit, skillDiceTokenCredit: 2 };
    const next = applyBondFieldDelta(spend, 'damagePurchases', 1, withCredit);
    expect(next?.damagePurchases).toBe(1);

    const computed = computeSummonBond({
      boundStoneCount: 1,
      bonusTokens: 0,
      skillDiceTokenCredit: 2,
      movementMode: 'walking',
      spend: next!,
    });
    expect(computed.tokensAvailable).toBe(10);
    expect(computed.tokensSpent).toBe(10);
    expect(computed.tokensRemaining).toBe(0);

    const summary = tokensSummary({
      id: 'b1',
      name: 'Credit Bond',
      boundStoneCount: 1,
      bonusTokens: 0,
      skillDiceTokenCredit: 2,
      movementMode: 'walking',
      spend: next!,
      stoneAttributes: ['wits'],
      bodies: [],
      selectedSkills: [],
      skillDiceAlloc: {},
    } as any);
    expect(summary.skillDiceTokenCredit).toBe(2);
    expect(summary.available).toBe(10);
    expect(summary.remaining).toBe(0);
  });
});

describe('K8 Summon Natural Task UI wiring', () => {
  it('exposes a Natural Task control on the Summon Bond sheet and dialog', () => {
    const sheet = readFileSync(resolve('templates/actor/character-sheet.hbs'), 'utf8');
    expect(sheet).toContain('js-sheet-summon-natural-task');
    expect(sheet).toContain('Natural Task');

    const sheetTs = readFileSync(resolve('src/sheets/character-sheet.ts'), 'utf8');
    expect(sheetTs).toContain('SummonNaturalTaskDialog');
    expect(sheetTs).toContain('js-sheet-summon-natural-task');

    const dialogTs = readFileSync(resolve('src/stones/summon-natural-task-dialog.ts'), 'utf8');
    expect(dialogTs).toContain('planSummonNaturalTask');
    expect(dialogTs).toContain('executeSummonNaturalTask');
    expect(dialogTs).toContain('naturalTaskResolvedKeys');

    const dialogHbs = readFileSync(
      resolve('templates/dialogs/summon-natural-task.hbs'),
      'utf8',
    );
    expect(dialogHbs).toContain('js-snt-profession');
    expect(dialogHbs).toContain('js-snt-task');
    expect(dialogHbs).toContain('js-snt-roll');
  });

  it('builds stable one-check task keys from Profession + description', () => {
    expect(buildSummonNaturalTaskKey('Follow a scent trail', 'tracker:tracker')).toBe(
      'tracker:tracker:follow-a-scent-trail',
    );
    expect(buildSummonNaturalTaskKey('Follow a scent trail!', 'tracker:tracker')).toBe(
      'tracker:tracker:follow-a-scent-trail',
    );
  });
});
