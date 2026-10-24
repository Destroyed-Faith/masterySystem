import { describe, expect, it } from 'vitest';
import {
  getSkillRollDicePool,
  isSkillFullPoolReady,
  readAttributePoolValue,
  readSkillRating,
  skillFullPoolThreshold,
} from '../src/dice/roll-context-build.js';
import {
  ensureNpcHasPerception,
  findSituationalSkillByName,
  isNpcPerceptionSkill,
  poolPreviewLabel,
  readSituationalSkills,
  resolveNpcPerceptionSituational,
  suggestNpcPool,
  upsertSituationalSkill,
} from '../src/rules/npc-situational-skills.js';
import {
  getSkillRaiseAllowance,
  planSkillCheckDraft,
  type SkillCheckDraft,
} from '../src/rules/index.js';

function makeNpc(skills: Record<string, unknown>, attrs: Record<string, unknown>, mr = 2) {
  return {
    type: 'npc',
    items: [],
    system: {
      mastery: { rank: mr },
      skills,
      attributes: attrs,
      health: { currentBar: 0, bars: [{ name: 'Healthy', max: 10, current: 10, penalty: 0 }] },
    },
  };
}

describe('NPC skill / Perception pool reading', () => {
  it('readSkillRating accepts numbers and { value } shapes', () => {
    expect(readSkillRating({ skills: { perception: 6 } }, 'perception')).toBe(6);
    expect(readSkillRating({ skills: { perception: '8' } }, 'perception')).toBe(8);
    expect(readSkillRating({ skills: { perception: { value: 4 } } }, 'perception')).toBe(4);
    expect(readSkillRating({ skills: {} }, 'perception')).toBe(0);
  });

  it('readAttributePoolValue accepts { value } and bare numbers', () => {
    expect(readAttributePoolValue({ attributes: { wits: { value: 7 } } }, 'wits')).toBe(7);
    expect(readAttributePoolValue({ attributes: { wits: 5 } }, 'wits')).toBe(5);
  });

  it('unlocks full Wits pool when Perception ≥ 2×MR (legacy)', () => {
    const mr = 2;
    const threshold = skillFullPoolThreshold(mr);
    expect(threshold).toBe(4);
    const actor = makeNpc({ perception: 4 }, { wits: { value: 8 } }, mr);
    expect(isSkillFullPoolReady(readSkillRating(actor.system, 'perception'), mr)).toBe(true);
    const pool = getSkillRollDicePool(actor as any, 'perception', 'wits');
    expect(pool.halfPool).toBe(false);
    expect(pool.baseDice).toBe(8);
  });

  it('uses half Wits pool when Perception is below 2×MR (legacy)', () => {
    const actor = makeNpc({ perception: 2 }, { wits: { value: 8 } }, 2);
    const pool = getSkillRollDicePool(actor as any, 'perception', 'wits');
    expect(pool.halfPool).toBe(true);
    expect(pool.baseDice).toBe(4);
  });
});

describe('NPC situational skills (DF Guide pools)', () => {
  it('suggests Capable/Specialist pools for MR 1–3', () => {
    expect(suggestNpcPool(1, 'capable')).toBe(3);
    expect(suggestNpcPool(1, 'specialist')).toBe(4);
    expect(suggestNpcPool(2, 'capable')).toBe(6);
    expect(suggestNpcPool(2, 'specialist')).toBe(8);
    expect(suggestNpcPool(3, 'capable')).toBe(10);
    expect(suggestNpcPool(3, 'specialist')).toBe(12);
    expect(suggestNpcPool(4, 'capable')).toBe(10);
    expect(suggestNpcPool(4, 'specialist')).toBe(12);
  });

  it('Rank maps to Paid/Free allowances; Rank 0 has no Raises', () => {
    expect(getSkillRaiseAllowance(0)).toMatchObject({ maxPaid: 0, maxFree: 0 });
    expect(getSkillRaiseAllowance(2)).toMatchObject({ maxPaid: 2, maxFree: 0 });
    expect(getSkillRaiseAllowance(4)).toMatchObject({ maxPaid: 3, maxFree: 1 });
  });

  it('resolves Perception situational before legacy', () => {
    const system = {
      mastery: { rank: 2 },
      skills: { perception: 8 },
      situationalSkills: [
        { id: 'nss-1', name: 'Perception', poolDice: 6, skillRank: 2 },
      ],
      attributes: { wits: { value: 10 } },
    };
    const sit = resolveNpcPerceptionSituational(system);
    expect(sit).toEqual({ poolDice: 6, skillRank: 2, name: 'Perception' });
    expect(findSituationalSkillByName(readSituationalSkills(system), 'perception')?.poolDice).toBe(
      6,
    );
  });

  it('plans Skill Check with poolDice independent of Attribute', () => {
    const system = {
      mastery: { rank: 2 },
      attributes: {
        might: { value: 2 },
        agility: { value: 2 },
        vitality: { value: 2 },
        intellect: { value: 2 },
        resolve: { value: 2 },
        influence: { value: 2 },
        wits: { value: 99 },
      },
      situationalSkills: [
        { id: 'nss-stealth', name: 'Stealth', poolDice: 6, skillRank: 2 },
      ],
      skills: {},
    };
    const draft: SkillCheckDraft = {
      actorId: 'Actor.npc',
      paidRaises: 1,
      skill: { kind: 'npc-situational', id: 'nss-stealth' },
      attributeKey: '',
      baseTn: 12,
      taskDescription: 'Slip past the sentry',
      npcSituational: {
        skillId: 'nss-stealth',
        skillName: 'Stealth',
        poolDice: 6,
        skillRank: 2,
      },
      source: {
        kind: 'sheet-verbal',
        gmVerified: false,
        taskDescription: 'Slip past the sentry',
        attributeKey: '',
        baseTn: 12,
        skill: { kind: 'npc-situational', id: 'nss-stealth' },
      },
    };
    const plan = planSkillCheckDraft({ system, draft, requireKnownSkill: true });
    expect(plan.ok).toBe(true);
    expect(plan.numDice).toBe(6);
    expect(plan.keepDice).toBe(2);
    expect(plan.rank).toBe(2);
    expect(plan.paidRaises).toBe(1);
    expect(plan.finalTn).toBe(16);
    expect(plan.rollDisadvantage).toBe(false);
    // Attribute may be flavor-defaulted; pool must still come from situational entry.
    expect(plan.numDice).not.toBe(plan.attributeValue);
  });

  it('upsert + pool preview label', () => {
    const list = upsertSituationalSkill([], {
      id: 'a',
      name: 'Intimidate',
      poolDice: 8,
      skillRank: 1,
    });
    expect(list).toHaveLength(1);
    expect(poolPreviewLabel(8, 2)).toBe('8k2');
    expect(poolPreviewLabel(1, 3)).toBe('1k1');
  });

  it('ensures every NPC has Perception (Capable pool)', () => {
    const empty = { mastery: { rank: 2 }, situationalSkills: [] };
    const first = ensureNpcHasPerception(empty);
    expect(first.added).toBe(true);
    expect(first.skills).toHaveLength(1);
    expect(isNpcPerceptionSkill(first.skills[0]!)).toBe(true);
    expect(first.skills[0]!.poolDice).toBe(6);
    const again = ensureNpcHasPerception({ ...empty, situationalSkills: first.skills });
    expect(again.added).toBe(false);
    expect(again.skills).toHaveLength(1);
  });
});
