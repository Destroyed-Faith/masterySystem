import { describe, expect, it } from 'vitest';

import {
  CONTEST_ATTRIBUTES,
  PHYSICAL_CONTEST_ATTRIBUTES,
  buildContestRollOptions,
  compareContestResults,
  contestSideFromRoll,
  initiatorAttributeChoices,
  opponentAttributeChoices,
  surpriseContestModifiers,
} from '../src/contests/opposed-attribute-contest.js';
import {
  buildContestCardHtml,
  contestConsequence,
  contestTitle,
  type AttributeContestState,
} from '../src/contests/contest-card.js';
import {
  buildCheckContestSwitchHtml,
  buildContestSectionHtml,
  readCheckContestMode,
  readContestDialogChoice,
} from '../src/contests/contest-dialog-section.js';
import { buildSkillRollContext, buildAttributeRollContext } from '../src/dice/roll-context-build.js';

function actor(attrs: Record<string, number>, rank = 3, extra: Record<string, unknown> = {}): any {
  const attributes: Record<string, { value: number }> = {};
  for (const [k, v] of Object.entries(attrs)) attributes[k] = { value: v };
  return {
    id: `a-${Object.keys(attrs).join('-')}`,
    name: 'Tester',
    type: 'character',
    system: {
      attributes,
      mastery: { rank },
      skills: { athletics: 6 },
      skillsSpent: {},
      health: { value: 40, max: 40 },
      ...extra,
    },
    items: [],
    getFlag: () => undefined,
  };
}

/** Minimal jQuery-ish reader over an HTML string for the dialog helpers. */
function fakeHtml(values: Record<string, string>) {
  return {
    find(selector: string) {
      const m = selector.match(/\[name="([^"]+)"\]/);
      const name = m ? m[1] : '';
      const value = values[name];
      return {
        val: () => value,
        length: value === undefined ? 0 : 1,
      };
    },
  };
}

describe('Opposed Attribute Contest — shared resolver', () => {
  it('builds an attribute pool with keep = Mastery Rank and no Skill / TN / Raise fields', () => {
    const a = actor({ might: 7, agility: 4 }, 3);
    const opts = buildContestRollOptions(a, 'might', { label: 'Contest' });
    expect(opts.numDice).toBe(7);
    expect(opts.keepDice).toBe(3);
    expect(opts.skill).toBe(0);
    expect(opts.tn).toBe(0);
    expect(opts.normalTn).toBe(0);
    expect(opts.declaredRaiseSlots).toBe(0);
    expect(opts.stoneBonusRaises).toBe(0);
    expect(opts.isSkillRoll).toBe(false);
    expect(opts.skillKey).toBeUndefined();
    expect(opts.rollKind).toBe('contest');
    expect(opts.poolAttribute).toBe('might');
    expect(opts.applyPoolPenalties).toBe(true);
    expect(opts.skipChat).toBe(true);
    expect(opts.rollAdvantage).toBeUndefined();
    expect(opts.rollDisadvantage).toBeUndefined();
  });

  it('passes Advantage / Disadvantage through to the roll engine', () => {
    const a = actor({ might: 5 }, 2);
    expect(buildContestRollOptions(a, 'might', { label: 'x', advantage: true }).rollAdvantage).toBe(true);
    expect(buildContestRollOptions(a, 'might', { label: 'x', disadvantage: true }).rollDisadvantage).toBe(true);
  });

  it('compares Final Results directly: higher wins, tie changes nothing', () => {
    expect(compareContestResults(21, 17)).toBe('initiator');
    expect(compareContestResults(12, 30)).toBe('opponent');
    expect(compareContestResults(18, 18)).toBe('tie');
  });

  it('Surprise applies Advantage / Disadvantage only to the initial Grapple contest', () => {
    expect(surpriseContestModifiers('grapple', true)).toEqual({ initiatorAdvantage: true, opponentDisadvantage: true });
    expect(surpriseContestModifiers('grapple', false)).toEqual({ initiatorAdvantage: false, opponentDisadvantage: false });
    expect(surpriseContestModifiers('grapple-escape', true)).toEqual({ initiatorAdvantage: false, opponentDisadvantage: false });
    expect(surpriseContestModifiers('general', true)).toEqual({ initiatorAdvantage: false, opponentDisadvantage: false });
  });

  it('offers all seven Attributes outside combat and Might / Agility for Grapple', () => {
    expect(opponentAttributeChoices('general')).toEqual([...CONTEST_ATTRIBUTES]);
    expect(opponentAttributeChoices('grapple')).toEqual([...PHYSICAL_CONTEST_ATTRIBUTES]);
    expect(opponentAttributeChoices('grapple-escape')).toEqual(['might', 'agility']);
    expect(initiatorAttributeChoices('grapple')).toEqual(['might', 'agility']);
  });

  it('copies only dice data from a roll result', () => {
    const side = contestSideFromRoll(
      { actorId: 'a', name: 'A', attributeKey: 'might' },
      6,
      3,
      { total: 19, dice: [8, 7, 4, 3, 2, 1], kept: [8, 7, 4], keptIndices: [0, 1, 2], dieChains: [[8], [7], [4], [3], [2], [1]] },
    );
    expect(side.total).toBe(19);
    expect(side.numDice).toBe(6);
    expect(side.keepDice).toBe(3);
    expect(side.kept).toEqual([8, 7, 4]);
    expect((side as any).tn).toBeUndefined();
    expect((side as any).raises).toBeUndefined();
  });
});

describe('Contest consequences per workflow', () => {
  it('Grapple: initiator win links both; tie or loss leaves the target free', () => {
    const win = contestConsequence('grapple', 'initiator', 'Bjorn', 'Wolf');
    expect(win.grapple).toBe('apply');
    expect(win.note).toMatch(/both|Grappled with each other/i);
    expect(win.note).toMatch(/no damage/i);
    expect(win.note).toMatch(/Unarmed Basic Attack/);
    expect(win.note).not.toMatch(/Mastery Rank damage|ignores Armor|Root/i);
    expect(contestConsequence('grapple', 'tie', 'Bjorn', 'Wolf')).toEqual({ grapple: 'none', note: 'Wolf remains free.' });
    expect(contestConsequence('grapple', 'opponent', 'Bjorn', 'Wolf').grapple).toBe('none');
  });

  it('Escape: escaper win ends the Grapple; tie or loss keeps it', () => {
    expect(contestConsequence('grapple-escape', 'initiator', 'Wolf', 'Bjorn').grapple).toBe('end');
    expect(contestConsequence('grapple-escape', 'tie', 'Wolf', 'Bjorn')).toEqual({ grapple: 'none', note: 'The Grapple remains.' });
    expect(contestConsequence('grapple-escape', 'opponent', 'Wolf', 'Bjorn').grapple).toBe('none');
  });

  it('non-combat contests have no mechanical consequence', () => {
    expect(contestConsequence('general', 'initiator', 'A', 'B')).toEqual({ grapple: 'none', note: '' });
    expect(contestConsequence('general', 'tie', 'A', 'B')).toEqual({ grapple: 'none', note: '' });
  });
});

describe('Contest chat card', () => {
  const pending: AttributeContestState = {
    context: 'grapple',
    initiator: {
      actorId: 'a1',
      name: 'Bjorn',
      attributeKey: 'might',
      numDice: 6,
      keepDice: 3,
      dice: [8, 5, 4, 3, 2, 1],
      kept: [8, 5, 4],
      keptIndices: [0, 1, 2],
      total: 17,
      advantage: true,
    },
    opponent: { actorId: 'n1', name: 'Wolf', attributeKey: 'might', choices: ['might', 'agility'], disadvantage: true },
    resolved: false,
    targetUnaware: true,
    attackActionSpent: true,
  };

  it('asks the opponent for Might or Agility and mentions no TN / Raises / Skill Points', () => {
    const html = buildContestCardHtml(pending);
    expect(html).toContain('data-action="ms-contest-answer"');
    expect(html).toContain('data-attribute="might"');
    expect(html).toContain('data-attribute="agility"');
    expect(html).not.toContain('data-attribute="wits"');
    expect(html).toMatch(/No TN, no Raises, no Skill Points/);
    expect(html).toMatch(/1 Attack Action spent/);
    expect(html).toMatch(/Grapple deals no damage/);
    expect(html).toContain('Advantage');
    expect(html).toContain('Disadvantage');
    expect(html).not.toMatch(/Spend Skill Points|Melee Weapons|Hand-to-Hand/);
    expect(contestTitle('grapple')).toMatch(/Grapple/);
  });

  it('shows both results and the outcome once resolved', () => {
    const resolved: AttributeContestState = {
      ...pending,
      resolved: true,
      opponentResult: {
        actorId: 'n1',
        name: 'Wolf',
        attributeKey: 'agility',
        numDice: 5,
        keepDice: 2,
        dice: [6, 6, 3, 2, 1],
        kept: [6, 6],
        keptIndices: [0, 1],
        total: 12,
      },
      outcome: 'initiator',
      consequenceNote: contestConsequence('grapple', 'initiator', 'Bjorn', 'Wolf').note,
    };
    const html = buildContestCardHtml(resolved);
    expect(html).not.toContain('data-action="ms-contest-answer"');
    expect(html).toContain('Bjorn wins the contest.');
    expect(html).toContain('Final Result: <strong>17</strong>');
    expect(html).toContain('Final Result: <strong>12</strong>');
    expect(html).toMatch(/Unarmed Basic Attack/);
  });

  it('general contests offer every Attribute to the opponent', () => {
    const html = buildContestCardHtml({
      ...pending,
      context: 'general',
      attackActionSpent: false,
      opponent: { ...pending.opponent, choices: [...CONTEST_ATTRIBUTES], disadvantage: false },
    });
    for (const key of CONTEST_ATTRIBUTES) expect(html).toContain(`data-attribute="${key}"`);
    expect(html).not.toMatch(/Attack Action/);
  });
});

describe('Check / Contest dialog mode (non-combat entry point)', () => {
  it('exposes the Attribute Contest mode beside the existing check', () => {
    const html = buildCheckContestSwitchHtml('Skill Check');
    expect(html).toContain('name="ccMode"');
    expect(html).toContain('value="check"');
    expect(html).toContain('value="contest"');
    expect(html).toContain('Skill Check');
    expect(html).toContain('Attribute Contest');
  });

  it('contest section lists all seven Attributes and the opponent choices, no TN or Raises', () => {
    const a = actor({ might: 6, agility: 4, vitality: 3, intellect: 3, resolve: 2, influence: 2, wits: 2 }, 2);
    const html = buildContestSectionHtml(a, {
      defaultAttribute: 'agility',
      opponents: [
        { key: 'token:t1', label: 'Wolf', actorId: 'n1', tokenId: 't1', targeted: true },
        { key: 'actor:n2', label: 'Priest (actor)', actorId: 'n2', targeted: false },
      ],
    });
    expect(html).toContain('name="contestAttribute"');
    for (const key of CONTEST_ATTRIBUTES) expect(html).toContain(`value="${key}"`);
    expect(html).toContain('value="agility" selected');
    expect(html).toContain('name="contestOpponent"');
    expect(html).toContain('value="token:t1" selected');
    expect(html).toContain('value="actor:n2"');
    expect(html).not.toMatch(/Difficulty|Raise TN|Skill Pool|Challenge MR/);
    expect(html).toMatch(/No Skill, no Skill Points, no TN, no Raises/);
  });

  it('a fixed attribute (attribute dialog) is shown, not selectable', () => {
    const a = actor({ might: 6 }, 2);
    const html = buildContestSectionHtml(a, { fixedAttribute: 'might', opponents: [] });
    expect(html).toContain('type="hidden" name="contestAttribute" value="might"');
    expect(html).toContain('No other creature available');
  });

  it('reads the chosen mode and contest fields', () => {
    expect(readCheckContestMode(fakeHtml({ ccMode: 'contest' }))).toBe('contest');
    expect(readCheckContestMode(fakeHtml({ ccMode: 'check' }))).toBe('check');
    expect(readCheckContestMode(fakeHtml({}))).toBe('check');
    expect(readContestDialogChoice(fakeHtml({ contestAttribute: 'resolve', contestOpponent: 'token:t1' }))).toEqual({
      attributeKey: 'resolve',
      opponentKey: 'token:t1',
    });
    expect(readContestDialogChoice(fakeHtml({ contestAttribute: 'athletics', contestOpponent: 'token:t1' }))).toBeNull();
    expect(readContestDialogChoice(fakeHtml({ contestAttribute: 'might', contestOpponent: '' }))).toBeNull();
  });
});

describe('Existing Skill Check behaviour is untouched', () => {
  it('skill checks still carry skillKey, isSkillRoll, TN and the skill raise model', () => {
    const a = actor({ might: 6, agility: 5 }, 3);
    const ctx = buildSkillRollContext(a, 'athletics', 'might', { baseTN: 22, raises: 1 });
    expect(ctx).not.toBeNull();
    expect(ctx!.rollOptions.isSkillRoll).toBe(true);
    expect(ctx!.rollOptions.skillKey).toBe('athletics');
    expect(ctx!.rollOptions.tn).toBe(22);
    expect(ctx!.rollOptions.raiseTn).toBe(26);
    expect(ctx!.rollOptions.declaredRaiseSlots).toBe(1);
    expect(ctx!.rollOptions.raiseModel).toBe('skill');
    expect(ctx!.rollOptions.rollKind).toBe('skill');
  });

  it('attribute checks keep TN and Raises and stay separate from contests', () => {
    const a = actor({ might: 6 }, 3);
    const ctx = buildAttributeRollContext(a, 'might', { baseTN: 22, raises: 0 });
    expect(ctx!.rollOptions.tn).toBe(22);
    expect(ctx!.rollOptions.isSkillRoll).toBe(false);
    const contest = buildContestRollOptions(a, 'might', { label: 'c' });
    expect(contest.tn).toBe(0);
    expect(contest.numDice).toBe(ctx!.rollOptions.numDice);
    expect(contest.keepDice).toBe(ctx!.rollOptions.keepDice);
  });
});
