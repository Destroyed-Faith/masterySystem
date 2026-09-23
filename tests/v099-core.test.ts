import { describe, expect, it, vi } from 'vitest';
import {
  applyGuaranteedEightExchange,
  assignmentsAreLegal,
  buildStoneProgressionSlots,
  canPlacePermanentStone,
  compressedAttributeXpBetween,
  cumulativeOldAttributeXp,
  earnedAttributeXpInvestment,
  highestKeptIndices,
  martialDamageApplies,
  maxGuaranteedEights,
  maxStoneCommitment,
  passiveSkillValue,
  permanentStonesFromLifetimeXp,
  chunkLifetimeSlots,
  lifetimeLineSlotCount,
  rollGuaranteedEightChain,
  startingPackageIsValid,
  stoneConcentrationCap,
} from '../src/progression/v099-rules.js';
import { planV099Migration, v099PrepareUpdate } from '../src/progression/v099-migration.js';
import { planV099Respec, v099RespecUpdate } from '../src/progression/v099-respec.js';
import { masteryRoll } from '../src/dice/roll-handler.js';
import { STONE_POWERS, isPremiumStonePower } from '../src/stones/stone-powers.js';

const KEYS = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'] as const;

function attrs(values: number[]) {
  const out: Record<string, { value: number }> = {};
  KEYS.forEach((key, i) => {
    out[key] = { value: values[i] ?? 2 };
  });
  return out;
}

function flat(values: number[]) {
  const out: Record<string, number> = {};
  KEYS.forEach((key, i) => {
    out[key] = values[i] ?? 0;
  });
  return out;
}

function actor(system: any, flags: Record<string, unknown> = {}) {
  const a: any = {
    type: 'character',
    name: 'Tester',
    system,
    flags: { 'mastery-system': { ...flags } },
  };
  a.getFlag = (_scope: string, key: string) => a.flags['mastery-system'][key];
  return a;
}

describe('v0.9.9 Attribute migration', () => {
  it('treats an untouched old starting package as 0 earned XP', () => {
    const current = flat([8, 8, 6, 6, 4, 4, 2]);
    expect(KEYS.reduce((sum, key) => sum + cumulativeOldAttributeXp(current[key]), 0)).toBe(38);
    expect(earnedAttributeXpInvestment(current, null)).toEqual({ xp: 0, source: 'package' });
  });

  it('preserves Attribute XP above the old starting package', () => {
    const current = flat([11, 8, 6, 6, 4, 4, 3]);
    expect(earnedAttributeXpInvestment(current, null).xp).toBe(7);
  });

  it('uses the cumulative old table for uneven values', () => {
    const current = flat([15, 7, 5, 6, 4, 4, 3]);
    const total = KEYS.reduce((sum, key) => sum + cumulativeOldAttributeXp(current[key]), 0);
    expect(total).toBe(51);
    expect(earnedAttributeXpInvestment(current, null).xp).toBe(13);
  });

  it('uses a post-creation snapshot when one exists', () => {
    const current = flat([10, 8, 6, 6, 4, 4, 1]);
    const snapshot = flat([8, 8, 6, 6, 4, 4, 2]);
    const earned = earnedAttributeXpInvestment(current, snapshot);
    expect(earned).toEqual({ xp: 4, source: 'snapshot' });
  });

  it('prices a high Attribute on the old table without halving it', () => {
    expect(cumulativeOldAttributeXp(40)).toBe(120);
    const current = flat([40, 8, 6, 6, 4, 4, 2]);
    expect(earnedAttributeXpInvestment(current, null).xp).toBe(112);
  });

  it('does not rewrite a character the second time', () => {
    const system = {
      attributes: attrs([8, 8, 6, 6, 4, 4, 2]),
      xp: { totalEarned: 20, freeEarned: 0 },
    };
    const first = actor(system);
    const update = v099PrepareUpdate(first);
    expect(update).not.toBeNull();
    expect((update as any)['system.progression'].earnedAttributeXp).toBe(0);
    expect(first.system.attributes.might.value).toBe(8);
    first.system.progression = (update as any)['system.progression'];
    first.flags['mastery-system'].v099CorePrepared = true;
    expect(v099PrepareUpdate(first)).toBeNull();
    expect(planV099Migration(first).alreadyPrepared).toBe(true);
    expect(first.system.attributes.might.value).toBe(8);
  });
});

describe('v0.9.9 Lifetime XP and Stones', () => {
  it.each([
    [0, 2],
    [20, 3],
    [120, 8],
    [140, 9],
    [240, 14],
  ])('Lifetime XP %i grants %i permanent Stones', (xp, stones) => {
    expect(permanentStonesFromLifetimeXp(xp)).toBe(stones);
  });

  it('derives Lifetime XP from earned counters and does not invent a missing total', () => {
    const known = actor({ xp: { totalEarned: 40, freeEarned: 5 }, points: { xp: 3 } });
    expect(planV099Migration(known).lifetimeXp).toBe(45);
    const unknown = actor({ attributes: attrs([8, 8, 6, 6, 4, 4, 2]) });
    const plan = planV099Migration(unknown);
    expect(plan.lifetimeXp).toBeNull();
    expect(plan.needsLifetimeInput).toBe(true);
  });

  it('enforces MR × 2 and uses the new rank when a Stone crosses a threshold', () => {
    const seven = flat([4, 3, 0, 0, 0, 0, 0]);
    const blocked = canPlacePermanentStone({
      attribute: 'might',
      assignments: seven,
      totalPermanent: 7,
      storedRank: 2,
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.cap).toBe(4);
    const raised = canPlacePermanentStone({
      attribute: 'might',
      assignments: seven,
      totalPermanent: 8,
      storedRank: 2,
    });
    expect(raised.ok).toBe(true);
    expect(raised.masteryRank).toBe(3);
    expect(raised.cap).toBe(6);
  });

  it('does not let a stored Mastery Rank above the stone total raise the cap', () => {
    expect(permanentStonesFromLifetimeXp(200)).toBe(12);
    expect(stoneConcentrationCap(12, 8)).toBe(6);
    expect(stoneConcentrationCap(12, 2)).toBe(6);
    expect(stoneConcentrationCap(7, 8)).toBe(4);
    const atTwoHundredXp = canPlacePermanentStone({
      attribute: 'might',
      assignments: flat([7, 0, 0, 0, 0, 0, 0]),
      totalPermanent: 12,
      storedRank: 8,
    });
    expect(atTwoHundredXp.ok).toBe(false);
    expect(atTwoHundredXp.cap).toBe(6);
    const stillAdept = canPlacePermanentStone({
      attribute: 'might',
      assignments: flat([4, 2, 0, 0, 0, 0, 0]),
      totalPermanent: 7,
      storedRank: 8,
    });
    expect(stillAdept.ok).toBe(false);
    expect(stillAdept.cap).toBe(4);
  });

  it('reassigns migrated Stones from Lifetime XP instead of the old pools', () => {
    const existing = actor({
      mastery: { rank: 3 },
      attributes: attrs([16, 8, 8, 6, 6, 4, 4]),
      progression: { earnedAttributeXp: 0, lifetimeXp: 20, v099Stones: false },
      points: { xp: 0 },
      xp: { totalSpent: 0 },
      stonePools: { might: { current: 2, max: 2 } },
    }, { needsV099Respec: true });
    const starting = flat([4, 4, 3, 3, 2, 2, 2]);
    const plan = planV099Respec(existing, {
      starting,
      attributes: starting,
      stones: flat([1, 1, 1, 0, 0, 0, 0]),
    });
    expect(plan.ok).toBe(true);
    expect(plan.permanentStones).toBe(3);
    const update = v099RespecUpdate(existing, plan);
    expect(update['system.stonePools.might.max']).toBe(1);
    expect(update['system.progression.v099Stones']).toBe(true);
    expect(update['flags.mastery-system.needsV099Respec']).toBe(false);
    expect(assignmentsAreLegal(plan.stones, 3, 3).ok).toBe(true);
  });
});

describe('v0.9.9 respec spending', () => {
  it('accepts the new starting package and compressed Attribute costs', () => {
    expect(startingPackageIsValid(flat([4, 4, 3, 3, 2, 2, 2]))).toBe(true);
    expect(startingPackageIsValid(flat([8, 8, 6, 6, 4, 4, 2]))).toBe(false);
    const start = flat([4, 2, 2, 2, 3, 3, 4]);
    const raised = { ...start, might: 5 };
    expect(compressedAttributeXpBetween(start, raised)).toBe(4);
  });
});

describe('Guaranteed Eight', () => {
  it('is unavailable at exactly MR and at MR + 7', () => {
    expect(maxGuaranteedEights(3, 3)).toBe(0);
    expect(maxGuaranteedEights(10, 3)).toBe(0);
  });

  it('allows exactly one at MR + 8 and at pool 18 / MR 3', () => {
    expect(maxGuaranteedEights(11, 3)).toBe(1);
    expect(maxGuaranteedEights(18, 3)).toBe(1);
    expect(applyGuaranteedEightExchange(18, 3, 1)).toEqual({
      ok: true,
      rolledDice: 10,
      guaranteedEights: 1,
    });
    expect(applyGuaranteedEightExchange(18, 3, 2).ok).toBe(false);
  });

  it('explodes onward from the guaranteed 8 and is not automatically kept', () => {
    const chain = rollGuaranteedEightChain(() => 1);
    expect(chain.faces[0]).toBe(8);
    expect(chain.total).toBe(9);
    const exploding = rollGuaranteedEightChain(
      (() => {
        const faces = [8, 3];
        return () => faces.shift() ?? 1;
      })(),
    );
    expect(exploding.faces).toEqual([8, 8, 3]);
    expect(exploding.total).toBe(19);
    expect(highestKeptIndices([9, 15, 4], 1)).toEqual([1]);
  });

  it('allows multiple Guaranteed Eights when the remaining dice still meet MR', () => {
    expect(maxGuaranteedEights(27, 3)).toBe(3);
    expect(applyGuaranteedEightExchange(27, 3, 2)).toEqual({
      ok: true,
      rolledDice: 11,
      guaranteedEights: 2,
    });
  });

  it('resolves health penalties before deciding how many conversions are legal', async () => {
    const wounded = {
      items: [],
      system: {
        mastery: { rank: 3 },
        health: {
          bars: [
            { current: 0, max: 10 },
            { current: 10, max: 10 },
          ],
          currentBar: 1,
        },
      },
    };
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const result = await masteryRoll({
        numDice: 19,
        keepDice: 3,
        skill: 0,
        tn: 1,
        skipChat: true,
        actorRef: wounded,
        applyPoolPenalties: true,
        guaranteedEights: 1,
        rollKind: 'skill',
        poolAndKeep: true,
      });
      expect(result.guaranteedEights).toBe(1);
      expect(result.poolBeforeGuaranteed).toBe(18);
      expect(result.rolledDice).toBe(10);
      expect(result.dice).toHaveLength(11);
      expect(result.dieChains?.[0]?.[0]).toBe(8);
    } finally {
      random.mockRestore();
    }
  });

  it('does not convert dice on a damage roll', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const result = await masteryRoll({
        numDice: 18,
        keepDice: 3,
        skill: 0,
        skipChat: true,
        guaranteedEights: 1,
        rollKind: 'damage',
      });
      expect(result.guaranteedEights).toBeUndefined();
      expect(result.dice).toHaveLength(18);
    } finally {
      random.mockRestore();
    }
  });
});

describe('Martial Damage and Tier 4 cap', () => {
  it('applies to martial attacks and not to spells', () => {
    expect(martialDamageApplies({ attackKind: 'melee' })).toBe(true);
    expect(martialDamageApplies({ attackKind: 'ranged' })).toBe(true);
    expect(martialDamageApplies({ attackKind: 'natural' })).toBe(true);
    expect(martialDamageApplies({ attackKind: 'aoe' })).toBe(true);
    expect(martialDamageApplies({ powerIsSpell: true, attackKind: 'melee' })).toBe(false);
    expect(martialDamageApplies({ npcIsSpell: true })).toBe(false);
    expect(martialDamageApplies({ attackKind: 'spell' })).toBe(false);
  });

  it('keeps the persisted id and the player-facing name', () => {
    expect(STONE_POWERS['might.meleeDamage'].id).toBe('might.meleeDamage');
    expect(STONE_POWERS['might.meleeDamage'].name).toBe('Martial Damage');
    expect(STONE_POWERS['might.meleeDamage'].tiers).toHaveLength(4);
  });

  it('caps a Normal ability at 15 Stones and a Premium ability at 20', () => {
    expect(maxStoneCommitment(false)).toBe(15);
    expect(maxStoneCommitment(true)).toBe(20);
    expect(isPremiumStonePower('generic.extraAttack')).toBe(true);
    expect(STONE_POWERS['generic.extraAttack'].tiers[0].value).toBe(1);
    expect(passiveSkillValue(4)).toBe(8);
  });

  it('prints Start on the first two Stone slots and milestones after that', () => {
    const slots = buildStoneProgressionSlots(20, { might: 1 });
    expect(slots[0].label).toBe('Start');
    expect(slots[1].label).toBe('Start');
    expect(slots[2].label).toBe('20');
    expect(slots[0].abbrev).toBe('MIG');
    expect(slots.filter((slot) => slot.unlocked)).toHaveLength(3);
    expect(slots).toHaveLength(lifetimeLineSlotCount());
    expect(slots.at(-1)?.label).toBe('660');
    expect(chunkLifetimeSlots(slots)).toHaveLength(1);
  });

  it('continues Lifetime XP past 660 on the next line', () => {
    const slots = buildStoneProgressionSlots(700, {});
    const rows = chunkLifetimeSlots(slots);
    expect(rows[0]?.at(-1)?.label).toBe('660');
    expect(rows[1]?.map((slot) => slot.label)).toEqual(['680', '700']);
    expect(rows[1]?.every((slot) => slot.unlocked)).toBe(true);
  });
});
