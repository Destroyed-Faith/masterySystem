import { describe, expect, it } from 'vitest';
import { buildAttributeRollContext, buildDifficultyPresets } from '../src/dice/roll-context-build.js';
import {
  buildEpicDiceFaces,
  formatDiceSummary,
  formatEpicRollDiceSummary,
  isSessionReadyToComplete,
  mergeParticipantResult,
  skipParticipantInSession,
} from '../src/epic-roll/epic-mastery-roll-types.js';
import { buildEpicMasteryRollSummaryHtml } from '../src/epic-roll/epic-mastery-roll-chat.js';
import {
  actorEpicRerollPoints,
  canSpendEpicRerollPoint,
  shouldStageEpicFailure,
} from '../src/epic-roll/epic-mastery-roll-roll.js';
import {
  isEpicRollPlayerCharacter,
  listEpicRollCandidatesFrom,
} from '../src/epic-roll/epic-mastery-roll-settings.js';
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
      health: { bars: [{ current: 10, max: 10 }], currentBar: 0 },
    },
    items: [],
  };
  return { ...base, ...overrides } as unknown as Actor;
}

describe('Challenge MR Standard TN', () => {
  it('uses (8 × Challenge MR) − 2, not 8 × MR', () => {
    expect(buildDifficultyPresets(1).standard).toBe(6);
    expect(buildDifficultyPresets(2).standard).toBe(14);
    expect(buildDifficultyPresets(5).standard).toBe(38);
    expect(buildDifficultyPresets(2).easy).toBe(10);
    expect(buildDifficultyPresets(2).challenging).toBe(18);
  });
});

describe('Skill Roll participant filter', () => {
  it('accepts character sheets and rejects NPC, summon, and other actors', () => {
    expect(isEpicRollPlayerCharacter(mockActor())).toBe(true);
    expect(isEpicRollPlayerCharacter(mockActor({ type: 'npc', name: 'Guard' }))).toBe(false);
    expect(isEpicRollPlayerCharacter(mockActor({ type: 'summon', name: 'Familiar' }))).toBe(false);
    expect(isEpicRollPlayerCharacter(mockActor({ type: 'divine', name: 'God' }))).toBe(false);
    expect(isEpicRollPlayerCharacter({ id: 'x', name: 'Legacy', type: 'Actor' })).toBe(false);
    expect(isEpicRollPlayerCharacter(null)).toBe(false);
  });

  it('rejects a character document that still uses the NPC sheet', () => {
    expect(
      isEpicRollPlayerCharacter(
        mockActor({
          flags: { core: { sheetClass: 'mastery-system.MasteryNpcSheet' } },
        }),
      ),
    ).toBe(false);
  });

  it('lists only character sheets from a mixed actor directory', () => {
    const rows = listEpicRollCandidatesFrom([
      mockActor({ id: 'pc1', name: 'Fin', type: 'character' }),
      mockActor({ id: 'npc1', name: 'Bandit', type: 'npc' }),
      mockActor({ id: 'sum1', name: 'Wolf', type: 'summon' }),
      mockActor({ id: 'pc2', name: 'Alaris', type: 'character' }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['pc2', 'pc1']);
    expect(rows.every((r) => r.type === 'character')).toBe(true);
  });
});

describe('buildDifficultyPresets', () => {
  it('uses (8 × challenge MR) − 2 as standard TN', () => {
    const p = buildDifficultyPresets(4);
    expect(p.standard).toBe(30);
    expect(p.hard).toBe(38);
    expect(p.easy).toBe(26);
  });
});

describe('buildRollContext', () => {
  it('builds attribute roll context', () => {
    const actor = mockActor();
    const ctx = buildAttributeRollContext(actor, 'might', { baseTN: 24, raises: 0 });
    expect(ctx!.rollOptions.numDice).toBe(10);
    expect(ctx!.rollOptions.keepDice).toBe(4);
    expect(ctx!.label).toBe('Might Check');
  });

});

describe('Epic Mastery Roll session helpers', () => {
  const baseSession = (): EpicMasteryRollSession => ({
    id: 'sess1',
    title: 'Cliff Climb',
    flavor: '',
    showTn: true,
    tn: { challengeMR: 4, baseTN: 32, raises: 0 },
    roll: { kind: 'attribute', attributeKey: 'might' },
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

  it('formats full epic dice summary with kept dice', () => {
    const summary = formatEpicRollDiceSummary({
      total: 21,
      dice: [4, 15, 6, 3],
      kept: [15, 6],
      keptIndices: [1, 2],
      dieChains: [[4], [8, 7], [6], [3]],
      skill: 0,
      tn: 16,
      raises: 1,
      success: true,
      exploded: [1],
    });
    expect(summary).toMatch(/Rolled:/);
    expect(summary).toMatch(/Kept: 15, 6/);
    const faces = buildEpicDiceFaces({
      total: 21,
      dice: [4, 15, 6, 3],
      kept: [15, 6],
      keptIndices: [1, 2],
      dieChains: [[4], [8, 7], [6], [3]],
      skill: 0,
      tn: 16,
      raises: 1,
      success: true,
      exploded: [1],
    });
    expect(faces.filter((f) => f.kept).map((f) => f.value)).toEqual([15, 6]);
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
      roll: { kind: 'attribute', attributeKey: 'agility' },
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

describe('Epic Mastery Roll reroll staging', () => {
  it('reads remaining Reroll Points from faithFractures.current', () => {
    const actor = mockActor({
      system: {
        mastery: { rank: 4 },
        attributes: { might: { value: 10 } },
        faithFractures: { current: 2, maximum: 3 },
      },
    });
    expect(actorEpicRerollPoints(actor)).toEqual({ current: 2, maximum: 3 });
    expect(canSpendEpicRerollPoint(actor)).toBe(true);
    expect(canSpendEpicRerollPoint(mockActor({ system: { faithFractures: { current: 0, maximum: 2 } } }))).toBe(
      false,
    );
  });

  it('stages a failure when a Reroll Point remains', () => {
    expect(
      shouldStageEpicFailure({
        success: false,
        hasRerollPoint: true,
        alreadyRerolled: false,
      }),
    ).toBe(true);
  });

  it('does not offer a second reroll after one has been used', () => {
    expect(
      shouldStageEpicFailure({
        success: false,
        hasRerollPoint: true,
        alreadyRerolled: true,
      }),
    ).toBe(false);
  });

  it('does not stage a successful roll', () => {
    expect(
      shouldStageEpicFailure({
        success: true,
        hasRerollPoint: true,
        alreadyRerolled: false,
      }),
    ).toBe(false);
  });
});
