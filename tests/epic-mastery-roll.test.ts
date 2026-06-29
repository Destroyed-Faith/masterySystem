import { describe, expect, it } from 'vitest';
import {
  buildAttributeRollContext,
  buildDifficultyPresets,
  buildSaveRollContext,
  buildSkillRollContext,
  getSkillRollDicePool,
} from '../src/dice/roll-context-build.js';
import {
  formatDiceSummary,
  isSessionReadyToComplete,
  mergeParticipantResult,
  skipParticipantInSession,
} from '../src/epic-roll/epic-mastery-roll-types.js';
import { buildEpicMasteryRollSummaryHtml } from '../src/epic-roll/epic-mastery-roll-chat.js';
import { getSkillSpendOptions, buildSkillSpendPackets, sumSelectedPacketSpend } from '../src/epic-roll/epic-mastery-roll-skill-spend.js';
import type { EpicMasteryRollSession } from '../src/epic-roll/epic-mastery-roll-types.js';

function mockActor(overrides: Record<string, unknown> = {}): Actor {
  const base = {
    id: 'actor1',
    name: 'Test Hero',
    type: 'character',
    system: {
      mastery: { rank: 4 },
      attributes: {
        might: { value: 10 },
        agility: { value: 8 },
        vitality: { value: 6 },
        intellect: { value: 6 },
        resolve: { value: 4 },
        influence: { value: 4 },
        wits: { value: 4 },
      },
      skills: { athletics: 2 },
      health: { bars: [{ current: 10, max: 10 }], currentBar: 0 },
    },
    items: { contents: [] },
  };
  return { ...base, ...overrides } as unknown as Actor;
}

describe('buildDifficultyPresets', () => {
  it('uses 8 × challenge MR as standard TN', () => {
    const p = buildDifficultyPresets(4);
    expect(p.standard).toBe(32);
    expect(p.hard).toBe(40);
  });
});

describe('buildRollContext', () => {
  it('builds skill roll with half-pool when rating below MR', () => {
    const actor = mockActor({
      system: {
        mastery: { rank: 4 },
        attributes: { might: { value: 10 }, agility: { value: 8 } },
        skills: { athletics: 2 },
        health: { bars: [{ current: 10, max: 10 }], currentBar: 0 },
      },
    });
    const ctx = buildSkillRollContext(actor, 'athletics', 'might', { baseTN: 32, raises: 0 });
    expect(ctx).not.toBeNull();
    expect(ctx!.rollOptions.numDice).toBe(5);
    expect(ctx!.rollOptions.isSkillRoll).toBe(false);
    expect(ctx!.rollOptions.flavor).toMatch(/Half-pool/i);
  });

  it('builds full skill pool when rating meets MR', () => {
    const actor = mockActor({
      system: {
        mastery: { rank: 4 },
        attributes: { might: { value: 10 }, agility: { value: 8 } },
        skills: { athletics: 4 },
        health: { bars: [{ current: 10, max: 10 }], currentBar: 0 },
      },
    });
    const ctx = buildSkillRollContext(actor, 'athletics', 'might', { baseTN: 32, raises: 1 });
    expect(ctx!.rollOptions.numDice).toBe(10);
    expect(ctx!.rollOptions.isSkillRoll).toBe(true);
    expect(ctx!.rollOptions.raiseTn).toBe(36);
  });

  it('builds attribute roll context', () => {
    const actor = mockActor();
    const ctx = buildAttributeRollContext(actor, 'might', { baseTN: 24, raises: 0 });
    expect(ctx!.rollOptions.numDice).toBe(10);
    expect(ctx!.rollOptions.keepDice).toBe(4);
    expect(ctx!.label).toBe('Might Check');
  });

  it('skill rolls use attribute pool dice and keep MR highest', () => {
    const actor = mockActor({
      system: {
        mastery: { rank: 4 },
        attributes: { might: { value: 10 }, agility: { value: 8 } },
        skills: { athletics: 4 },
        health: { bars: [{ current: 10, max: 10 }], currentBar: 0 },
      },
    });
    const pool = getSkillRollDicePool(actor, 'athletics', 'might');
    expect(pool.numDice).toBe(10);
    expect(pool.keepDice).toBe(4);

    const ctx = buildSkillRollContext(actor, 'athletics', 'might', { baseTN: 32, raises: 0 });
    expect(ctx!.rollOptions.numDice).toBe(10);
    expect(ctx!.rollOptions.keepDice).toBe(4);
  });

  it('builds body save using higher attribute', () => {
    const actor = mockActor();
    const ctx = buildSaveRollContext(actor, 'body', { baseTN: 32, raises: 0 });
    expect(ctx!.rollOptions.numDice).toBe(10);
    expect(ctx!.rollOptions.rollKind).toBe('saveBody');
    expect(ctx!.rollOptions.isSaveRoll).toBe(true);
  });
});

describe('Epic Mastery Roll session helpers', () => {
  const baseSession = (): EpicMasteryRollSession => ({
    id: 'sess1',
    title: 'Cliff Climb',
    flavor: '',
    showTn: true,
    tn: { challengeMR: 4, baseTN: 32, raises: 0 },
    roll: { kind: 'skill', skillKey: 'athletics' },
    participants: [
      { actorId: 'a1', actorName: 'Hero', status: 'pending' },
      { actorId: 'a2', actorName: 'Rogue', status: 'pending' },
    ],
    results: {},
    status: 'active',
  });

  it('marks staged participants as awaiting_spend', () => {
    let session = baseSession();
    session = mergeParticipantResult(
      session,
      {
        actorId: 'a1',
        actorName: 'Hero',
        label: 'Athletics Check',
        total: 28,
        normalTn: 32,
        success: false,
        raises: 0,
        diceSummary: '6,5,4,3',
        awaitingConfirm: true,
      },
      { staged: true },
    );
    expect(session.participants.find((p) => p.actorId === 'a1')?.status).toBe('awaiting_spend');
    expect(isSessionReadyToComplete(session)).toBe(false);
  });

  it('detects session ready when all participants resolved', () => {
    let session = baseSession();
    expect(isSessionReadyToComplete(session)).toBe(false);

    session = mergeParticipantResult(session, {
      actorId: 'a1',
      actorName: 'Hero',
      label: 'Athletics Check',
      total: 35,
      normalTn: 32,
      success: true,
      raises: 0,
      diceSummary: '8,7,6,5',
    });
    expect(isSessionReadyToComplete(session)).toBe(false);

    session = mergeParticipantResult(session, {
      actorId: 'a2',
      actorName: 'Rogue',
      label: 'Athletics Check',
      total: 28,
      normalTn: 32,
      success: false,
      raises: 0,
      diceSummary: '6,5,4,3',
    });
    expect(isSessionReadyToComplete(session)).toBe(true);
  });

  it('marks skipped participants as resolved', () => {
    const session = skipParticipantInSession(baseSession(), 'a2');
    expect(session.participants.find((p) => p.actorId === 'a2')?.status).toBe('skipped');
    expect(session.results.a2?.skipped).toBe(true);
  });

  it('formats dice summary', () => {
    expect(formatDiceSummary([8, 7, 6])).toBe('8, 7, 6');
    expect(formatDiceSummary([])).toBe('—');
  });
});

describe('Epic skill spend helpers', () => {
  it('offers MR-step spend options when pool allows', () => {
    const actor = mockActor({
      system: {
        mastery: { rank: 4 },
        attributes: { might: { value: 10 } },
        skills: { athletics: 4 },
        skillsSpent: { athletics: 0 },
        health: { bars: [{ current: 10, max: 10 }], currentBar: 0 },
      },
    }) as any;
    const rollResult = {
      total: 20,
      dice: [6, 5, 4, 3],
      kept: [6, 5, 4, 3],
      skill: 0,
      tn: 32,
      raises: 0,
      success: false,
      exploded: [],
    };
    const { options, remainingPool } = getSkillSpendOptions(actor, 'athletics', rollResult);
    expect(remainingPool).toBe(4);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]!.amount).toBe(4);
  });

  it('builds MR packets like the skill sheet (max four, MR-sized chunks)', () => {
    expect(buildSkillSpendPackets(8, 2).map((p) => p.amount)).toEqual([2, 2, 2, 2]);
    expect(buildSkillSpendPackets(3, 2).map((p) => p.amount)).toEqual([2, 1, 0, 0]);
    expect(buildSkillSpendPackets(12, 3).map((p) => p.amount)).toEqual([3, 3, 3, 3]);
    expect(buildSkillSpendPackets(8, 4).map((p) => p.amount)).toEqual([4, 4, 0, 0]);
  });

  it('sums only selected clickable packets', () => {
    const packets = buildSkillSpendPackets(8, 2);
    expect(sumSelectedPacketSpend(packets, [true, true, false, false])).toBe(4);
    expect(sumSelectedPacketSpend(packets, [true, true, true, true])).toBe(8);
  });
});

describe('Epic Mastery Roll summary HTML', () => {
  it('includes success and failure labels', () => {
    const session: EpicMasteryRollSession = {
      id: 's1',
      title: 'Group Stealth',
      flavor: 'Cross the courtyard',
      showTn: true,
      tn: { challengeMR: 4, baseTN: 32, raises: 0 },
      roll: { kind: 'skill', skillKey: 'stealth' },
      participants: [{ actorId: 'a1', actorName: 'Hero', status: 'rolled' }],
      results: {
        a1: {
          actorId: 'a1',
          actorName: 'Hero',
          label: 'Stealth Check',
          total: 40,
          normalTn: 32,
          success: true,
          raises: 2,
          diceSummary: '8,8,7,6',
        },
      },
      status: 'complete',
    };

    const html = buildEpicMasteryRollSummaryHtml(session);
    expect(html).toMatch(/Group Stealth/);
    expect(html).toMatch(/Success/);
    expect(html).toMatch(/Hero/);
  });
});
