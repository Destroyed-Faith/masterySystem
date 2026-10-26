/**
 * Chat-driven Skill Check workflow — state machine + consolidated results.
 */
import { describe, expect, it } from 'vitest';
import {
  SKILL_CHECK_REQUEST_SCHEMA,
  applyApprove,
  applyDecline,
  applyProposal,
  applyReject,
  applyRollResult,
  approvedAssignment,
  canActorJoinRequest,
  readyToFinalize,
  type SkillCheckRequestPayload,
} from '../src/chat/skill-check-request-state.js';
import { buildConsolidatedResultsHtml } from '../src/chat/skill-check-request.js';
import { resolveComparativeSkillCheck } from '../src/rules/index.js';
import {
  listActorSpecializationOptions,
  listActorSkillOptions,
  resolveSkillRank,
  skillRefFromKey,
} from '../src/epic-roll/rolls-skill-panel.js';

function basePayload(partial?: Partial<SkillCheckRequestPayload>): SkillCheckRequestPayload {
  return {
    schema: SKILL_CHECK_REQUEST_SCHEMA,
    requestId: 'req-1',
    lifecycle: 'open',
    title: 'Footprints Outside the City',
    taskDescription: 'Follow the footprints outside the northern city gates.',
    note: '',
    mode: 'standard',
    baseTn: 12,
    showTn: true,
    invitedActorIds: [],
    participants: {},
    createdBy: 'gm',
    ...partial,
  };
}

function mockActor(id: string, specs: Array<{ id: string; name: string; rank: number }>) {
  return {
    id,
    name: id,
    system: {
      specializations: specs.map((s) => ({
        id: s.id,
        name: s.name,
        field: 'physical',
        scope: '',
        rank: s.rank,
      })),
      attributes: { wits: { value: 10 }, intellect: { value: 8 } },
      mastery: { rank: 3 },
    },
  };
}

describe('Publish open Skill Check request', () => {
  it('starts open with empty participants and default TN', () => {
    const p = basePayload();
    expect(p.lifecycle).toBe('open');
    expect(Object.keys(p.participants)).toHaveLength(0);
    expect(p.baseTn).toBe(12);
    expect(p.schema).toBe(SKILL_CHECK_REQUEST_SCHEMA);
  });

  it('open join allows any actor when invitedActorIds is empty', () => {
    const p = basePayload();
    expect(canActorJoinRequest(p, 'alaris')).toBe(true);
    expect(canActorJoinRequest(p, 'oda')).toBe(true);
  });

  it('audience restriction blocks uninvited actors', () => {
    const p = basePayload({ invitedActorIds: ['alaris'] });
    expect(canActorJoinRequest(p, 'alaris')).toBe(true);
    expect(canActorJoinRequest(p, 'oda')).toBe(false);
  });
});

describe('Join / decline / propose', () => {
  it('decline records Not Participating', () => {
    const p = applyDecline(basePayload(), 'scurry');
    expect(p.participants.scurry?.status).toBe('declined');
  });

  it('proposal stores Skill, Attribute, optional explanation without rolling', () => {
    const p = applyProposal(basePayload(), 'alaris', {
      skill: { kind: 'specialization', id: 'physical:tracking' },
      attributeKey: 'wits',
      explanation: 'I examine the footprints.',
    });
    expect(p.participants.alaris?.status).toBe('proposed');
    expect(p.participants.alaris?.proposedSkill).toEqual({
      kind: 'specialization',
      id: 'physical:tracking',
    });
    expect(p.participants.alaris?.proposedAttributeKey).toBe('wits');
    expect(p.participants.alaris?.explanation).toMatch(/footprints/);
    expect(p.participants.alaris?.rollTotal).toBeUndefined();
  });

  it('player proposal options are stored Specs only (no synthetic Perception/Untrained)', () => {
    const actor = mockActor('oda', [
      { id: 'mental:investigation', name: 'Investigation', rank: 2 },
      { id: 'physical:tracking', name: 'Tracking', rank: 2 },
    ]);
    const opts = listActorSpecializationOptions(actor);
    expect(opts.some((o) => o.key === 'perception')).toBe(false);
    expect(opts.some((o) => o.key === 'untrained')).toBe(false);
    expect(opts.map((o) => o.key).sort()).toEqual([
      'mental:investigation',
      'physical:tracking',
    ]);
    expect(opts.find((o) => o.key === 'physical:tracking')?.label).toMatch(/Tracking · Rank 2/);
    expect(resolveSkillRank(actor, skillRefFromKey('mental:investigation'))).toBe(2);
  });

  it('GM helper list still includes Untrained for overrides', () => {
    const actor = mockActor('oda', [
      { id: 'mental:investigation', name: 'Investigation', rank: 2 },
    ]);
    expect(listActorSkillOptions(actor).some((o) => o.key === 'untrained')).toBe(true);
  });
});

describe('GM approve / modify / reject', () => {
  it('Approve uses default TN when not overridden', () => {
    let p = applyProposal(basePayload({ baseTn: 12 }), 'alaris', {
      skill: { kind: 'specialization', id: 'physical:tracking' },
      attributeKey: 'wits',
    });
    p = applyApprove(p, 'alaris');
    expect(p.participants.alaris?.status).toBe('approved');
    expect(p.participants.alaris?.baseTn).toBe(12);
    expect(p.lifecycle).toBe('rolling');
  });

  it('supports different TNs for different approved approaches', () => {
    let p = basePayload({ baseTn: 12 });
    p = applyProposal(p, 'alaris', {
      skill: { kind: 'specialization', id: 'physical:tracking' },
      attributeKey: 'wits',
    });
    p = applyProposal(p, 'scurry', {
      skill: { kind: 'specialization', id: 'physical:survival' },
      attributeKey: 'wits',
    });
    p = applyProposal(p, 'oda', {
      skill: { kind: 'specialization', id: 'mental:investigation' },
      attributeKey: 'intellect',
    });
    p = applyApprove(p, 'alaris', { baseTn: 12 });
    p = applyApprove(p, 'scurry', { baseTn: 16 });
    p = applyApprove(p, 'oda', { baseTn: 20 });
    expect(p.participants.alaris?.baseTn).toBe(12);
    expect(p.participants.scurry?.baseTn).toBe(16);
    expect(p.participants.oda?.baseTn).toBe(20);
    expect(p.participants.oda?.attributeKey).toBe('intellect');
  });

  it('Reject allows revised proposal', () => {
    let p = applyProposal(basePayload(), 'oda', {
      skill: { kind: 'specialization', id: 'mental:investigation' },
      attributeKey: 'intellect',
    });
    p = applyReject(p, 'oda');
    expect(p.participants.oda?.status).toBe('rejected');
    expect(canActorJoinRequest(p, 'oda')).toBe(true);
    p = applyProposal(p, 'oda', {
      skill: { kind: 'perception' },
      attributeKey: 'wits',
    });
    expect(p.participants.oda?.status).toBe('proposed');
  });

  it('unapproved actors have no assignment for rolling', () => {
    const p = applyProposal(basePayload(), 'alaris', {
      skill: { kind: 'perception' },
      attributeKey: 'wits',
    });
    expect(approvedAssignment(p, 'alaris')).toBeNull();
  });
});

describe('Rolling gates and results', () => {
  it('prevents roll result apply unless approved', () => {
    let p = applyProposal(basePayload(), 'alaris', {
      skill: { kind: 'perception' },
      attributeKey: 'wits',
    });
    p = applyRollResult(p, 'alaris', { rollTotal: 20, success: true });
    expect(p.participants.alaris?.status).toBe('proposed');
  });

  it('applies roll once after approval', () => {
    let p = applyProposal(basePayload(), 'alaris', {
      skill: { kind: 'perception' },
      attributeKey: 'wits',
    });
    p = applyApprove(p, 'alaris');
    p = applyRollResult(p, 'alaris', {
      rollTotal: 19,
      success: true,
      finalTn: 12,
      paidRaises: 0,
    });
    expect(p.participants.alaris?.status).toBe('rolled');
    expect(p.participants.alaris?.rollTotal).toBe(19);
    // Duplicate apply ignored
    p = applyRollResult(p, 'alaris', { rollTotal: 99, success: false });
    expect(p.participants.alaris?.rollTotal).toBe(19);
  });

  it('Comparative outcomes favor defender on ties', () => {
    expect(
      resolveComparativeSkillCheck({ challengerTotal: 14, defenderTotal: 14 }).tieFavorsDefender,
    ).toBe(true);
  });

  it('readyToFinalize ignores declined players', () => {
    let p = basePayload();
    p = applyDecline(p, 'scurry');
    p = applyProposal(p, 'alaris', {
      skill: { kind: 'perception' },
      attributeKey: 'wits',
    });
    p = applyApprove(p, 'alaris');
    p = applyRollResult(p, 'alaris', { rollTotal: 15, success: true, finalTn: 12 });
    expect(readyToFinalize(p)).toBe(true);
  });

  it('buildConsolidatedResultsHtml renders Standard table (helper only; no Publish Results)', () => {
    let p = basePayload({ title: 'Footprints Outside the City' });
    p = applyProposal(p, 'alaris', {
      skill: { kind: 'specialization', id: 'physical:tracking' },
      attributeKey: 'wits',
    });
    p = applyApprove(p, 'alaris', { baseTn: 12 });
    p = applyRollResult(p, 'alaris', {
      rollTotal: 19,
      success: true,
      finalTn: 12,
    });
    const html = buildConsolidatedResultsHtml(p);
    expect(html).toMatch(/Footprints Outside the City/);
    expect(html).toMatch(/19/);
    expect(html).toMatch(/Success/);
  });

  it('source no longer exposes Publish Results; uses Close Check', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const file = fs.readFileSync(
      path.resolve(__dirname, '../src/chat/skill-check-request.ts'),
      'utf8',
    );
    expect(file).toMatch(/ms-scr-close/);
    expect(file).toMatch(/Close Check/);
    expect(file).not.toMatch(/Publish results/);
    expect(file).toMatch(/skillCheckRequestAck/);
    expect(file).toMatch(/executeApprovedSkillRoll/);
    expect(file).toMatch(/listActorSpecializationOptions/);
  });
});

describe('Character Skill data preservation', () => {
  it('proposal helpers do not mutate Spec arrays', () => {
    const actor = mockActor('oda', [
      { id: 'mental:investigation', name: 'Investigation', rank: 2 },
    ]);
    const before = structuredClone(actor.system.specializations);
    void listActorSkillOptions(actor);
    void skillRefFromKey('mental:investigation');
    expect(actor.system.specializations).toEqual(before);
  });
});
