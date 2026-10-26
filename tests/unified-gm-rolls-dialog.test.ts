/**
 * Unified GM Rolls dialog — Skill panel helpers, per-character assignment,
 * Standard/Comparative modes, Group Ambush preview, competing dialog retired.
 */
import { describe, expect, it } from 'vitest';
import {
  applyApproachToRow,
  defaultComparativeConfig,
  emptyApproach,
  equipmentPenaltyBreakdown,
  listActorSkillOptions,
  participantSkillPreview,
  skillKeyFromRef,
  skillRefFromKey,
  taskLevelTnPresets,
} from '../src/epic-roll/rolls-skill-panel.js';
import { ensureParticipantRows } from '../src/epic-roll/rolls-skill-start.js';
import {
  resolveComparativeSkillCheck,
  skillAdvantageLabel,
} from '../src/rules/index.js';
import {
  planGroupAmbushStealthPool,
  sumGroupPhysicalSkillPenalties,
} from '../src/combat/group-ambush.js';
import { assignmentForActor, type SkillCheckRequestPayload } from '../src/chat/skill-check-request.js';

function mockActor(opts: {
  id: string;
  name: string;
  specs?: Array<{ id: string; name: string; field?: string; rank: number }>;
  attributes?: Record<string, number>;
  armorPenalty?: number;
}) {
  return {
    id: opts.id,
    name: opts.name,
    type: 'character',
    system: {
      specializations: (opts.specs || []).map((s) => ({
        id: s.id,
        name: s.name,
        field: s.field || 'physical',
        scope: '',
        rank: s.rank,
      })),
      attributes: Object.fromEntries(
        Object.entries(opts.attributes || { wits: 10, intellect: 8, agility: 12 }).map(
          ([k, v]) => [k, { value: v }],
        ),
      ),
      mastery: { rank: 3 },
    },
    items: [],
    getFlag: () => undefined,
  };
}

describe('Unified Rolls — Allowed Approaches & per-character assignment', () => {
  it('supports different Skills, Attributes, and TNs for the same obstacle', () => {
    const tracking = emptyApproach({
      skillKey: 'physical:tracking',
      label: 'Tracking',
      suggestedAttribute: 'wits',
      baseTn: 12,
    });
    const survival = emptyApproach({
      skillKey: 'physical:survival',
      label: 'Survival',
      suggestedAttribute: 'wits',
      baseTn: 16,
    });
    const investigation = emptyApproach({
      skillKey: 'mental:investigation',
      label: 'Investigation',
      suggestedAttribute: 'intellect',
      baseTn: 20,
    });

    const alaris = applyApproachToRow(tracking, 'alaris');
    const scurry = applyApproachToRow(survival, 'scurry');
    const oda = applyApproachToRow(investigation, 'oda');

    expect(alaris.baseTn).toBe(12);
    expect(scurry.baseTn).toBe(16);
    expect(oda.baseTn).toBe(20);
    expect(alaris.attributeKey).toBe('wits');
    expect(oda.attributeKey).toBe('intellect');
    expect(skillKeyFromRef(alaris.skillRef)).toBe('physical:tracking');
    expect(skillKeyFromRef(oda.skillRef)).toBe('mental:investigation');
  });

  it('Task Level presets match TN ladder 4…32', () => {
    expect(taskLevelTnPresets().map((p) => p.tn)).toEqual([4, 8, 12, 16, 20, 24, 28, 32]);
  });

  it('ensureParticipantRows fills missing actors from the first approach', () => {
    const approach = emptyApproach({
      skillKey: 'perception',
      suggestedAttribute: 'wits',
      baseTn: 12,
    });
    const rows = ensureParticipantRows(
      ['a', 'b'],
      [{ actorId: 'a', skillRef: { kind: 'untrained' }, attributeKey: 'might', baseTn: 8 }],
      [approach],
      12,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]!.skillRef).toEqual({ kind: 'untrained' });
    expect(rows[0]!.baseTn).toBe(8);
    expect(rows[1]!.skillRef).toEqual({ kind: 'perception' });
    expect(rows[1]!.baseTn).toBe(12);
  });

  it('lists Perception and Untrained plus character Specs', () => {
    const actor = mockActor({
      id: 'oda',
      name: 'Oda',
      specs: [{ id: 'mental:investigation', name: 'Investigation', rank: 2 }],
    });
    const opts = listActorSkillOptions(actor);
    expect(opts.some((o) => o.key === 'perception')).toBe(true);
    expect(opts.some((o) => o.key === 'untrained')).toBe(true);
    expect(opts.some((o) => o.key === 'mental:investigation')).toBe(true);
  });

  it('participant preview exposes Skill Advantage without mutating Specs', () => {
    const actor = mockActor({
      id: 'alaris',
      name: 'Alaris',
      specs: [{ id: 'physical:tracking', name: 'Tracking', field: 'physical', rank: 2 }],
      attributes: { wits: 10 },
    });
    const before = JSON.stringify(actor.system.specializations);
    const preview = participantSkillPreview(actor, {
      actorId: 'alaris',
      skillRef: { kind: 'specialization', id: 'physical:tracking' },
      attributeKey: 'wits',
      baseTn: 12,
    });
    expect(preview.rank).toBe(2);
    expect(preview.advantageLabel).toBe(skillAdvantageLabel(2));
    expect(preview.poolLabel).toMatch(/10k/);
    expect(JSON.stringify(actor.system.specializations)).toBe(before);
  });
});

describe('assignmentForActor — per-character Attribute and TN', () => {
  const basePayload = (): SkillCheckRequestPayload => ({
    schema: 'df-skill-check-request-gm-defined-2026-10-24',
    requestId: 'r1',
    taskDescription: 'Examine footprints',
    note: '',
    baseTn: 12,
    attributeKey: 'wits',
    defaultSkill: { kind: 'perception' },
    perActorSkill: {
      alaris: { kind: 'specialization', id: 'physical:tracking' },
      oda: { kind: 'specialization', id: 'mental:investigation' },
    },
    perActorAttribute: { alaris: 'wits', oda: 'intellect' },
    perActorBaseTn: { alaris: 12, oda: 20 },
    targetActorIds: ['alaris', 'oda'],
    responses: { alaris: { status: 'pending' }, oda: { status: 'pending' } },
    createdBy: 'gm',
    mode: 'standard',
  });

  it('returns distinct Attribute and Base TN per actor', () => {
    const p = basePayload();
    const a = assignmentForActor(p, 'alaris');
    const o = assignmentForActor(p, 'oda');
    expect(a.attributeKey).toBe('wits');
    expect(a.baseTn).toBe(12);
    expect(a.skill).toEqual({ kind: 'specialization', id: 'physical:tracking' });
    expect(o.attributeKey).toBe('intellect');
    expect(o.baseTn).toBe(20);
    expect(a.mode).toBe('standard');
  });

  it('Comparative mode forces Base TN 0', () => {
    const p = basePayload();
    p.mode = 'comparative';
    const a = assignmentForActor(p, 'alaris');
    expect(a.mode).toBe('comparative');
    expect(a.baseTn).toBe(0);
  });
});

describe('Standard vs Comparative resolution rules', () => {
  it('Comparative compares totals directly; ties favor defender', () => {
    expect(resolveComparativeSkillCheck({ challengerTotal: 20, defenderTotal: 18 }).challengerWins).toBe(
      true,
    );
    expect(resolveComparativeSkillCheck({ challengerTotal: 15, defenderTotal: 15 }).tieFavorsDefender).toBe(
      true,
    );
    expect(resolveComparativeSkillCheck({ challengerTotal: 10, defenderTotal: 12 }).challengerWins).toBe(
      false,
    );
  });

  it('default comparative config uses virtual opposition without creating Actors', () => {
    const cfg = defaultComparativeConfig();
    expect(cfg.source).toBe('virtual');
    expect(cfg.virtual.poolDice).toBeGreaterThan(0);
    expect(cfg.groupAmbush).toBe(false);
  });
});

describe('Group Ambush — combined equipment penalties', () => {
  it('plans specialist pool with combined penalties via group-ambush module', () => {
    const specialist = mockActor({
      id: 'scout',
      name: 'Scout',
      specs: [{ id: 'physical:stealth', name: 'Stealth', field: 'physical', rank: 4 }],
      attributes: { agility: 12 },
    });
    const heavy = mockActor({ id: 'tank', name: 'Tank', attributes: { agility: 8 } });
    // Inject penalty via module under test using getEquippedPhysicalSkillPenaltyDice —
    // when equipment returns 0 in unit env, combined still equals base pool.
    const plan = planGroupAmbushStealthPool({
      specialist,
      participants: [specialist, heavy],
      attributeKey: 'agility',
    });
    expect(plan.ok).toBe(true);
    expect(plan.basePool).toBe(12);
    expect(plan.finalPool).toBe(Math.max(0, plan.basePool - plan.combinedPenalty));
    expect(plan.keepDice).toBeGreaterThanOrEqual(1);
    expect(plan.participantPenalties.length).toBeGreaterThanOrEqual(1);
  });

  it('equipmentPenaltyBreakdown ignores unrelated actors when not passed', () => {
    const a = mockActor({ id: 'a', name: 'A' });
    const b = mockActor({ id: 'b', name: 'B' });
    const { rows } = equipmentPenaltyBreakdown([a, b]);
    expect(rows.map((r) => r.actorId).sort()).toEqual(['a', 'b']);
    const onlyA = equipmentPenaltyBreakdown([a]);
    expect(onlyA.rows).toHaveLength(1);
    expect(onlyA.rows[0]!.actorId).toBe('a');
  });

  it('sumGroupPhysicalSkillPenalties is used by ambush planning', () => {
    const actors = [mockActor({ id: '1', name: 'One' }), mockActor({ id: '2', name: 'Two' })];
    const { total, rows } = sumGroupPhysicalSkillPenalties(actors);
    expect(rows).toHaveLength(2);
    expect(total).toBeGreaterThanOrEqual(0);
  });
});

describe('Competing GM Skill Check dialog retired', () => {
  it('showSkillCheckRequestDialog redirects to Rolls (mastery-epic-roll-config)', async () => {
    const src = await import('../src/chat/skill-check-request.js');
    expect(typeof src.showSkillCheckRequestDialog).toBe('function');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const file = fs.readFileSync(
      path.resolve(__dirname, '../src/chat/skill-check-request.ts'),
      'utf8',
    );
    expect(file).toMatch(/showEpicMasteryRollConfigDialog/);
    expect(file).toMatch(/Competing standalone/);
    expect(file).toMatch(/Retire the competing Skill Check chat button/);
    expect(file).not.toMatch(/title:\s*masteryLocalize\(\s*'MASTERY\.df2026\.skillRequest\.title'/);
  });

  it('skillRefFromKey maps perception / untrained / specialization ids', () => {
    expect(skillRefFromKey('perception')).toEqual({ kind: 'perception' });
    expect(skillRefFromKey('untrained')).toEqual({ kind: 'untrained' });
    expect(skillRefFromKey('physical:stealth')).toEqual({
      kind: 'specialization',
      id: 'physical:stealth',
    });
  });
});

describe('Character Skill data preservation', () => {
  it('does not rewrite specialization ids or ranks when previewing / assigning', () => {
    const actor = mockActor({
      id: 'oda',
      name: 'Oda',
      specs: [
        { id: 'mental:investigation', name: 'Investigation', field: 'mental', rank: 2 },
        { id: 'physical:tracking', name: 'Tracking', field: 'physical', rank: 3 },
      ],
    });
    const snapshot = structuredClone(actor.system.specializations);
    void listActorSkillOptions(actor);
    void participantSkillPreview(actor, {
      actorId: 'oda',
      skillRef: { kind: 'specialization', id: 'mental:investigation' },
      attributeKey: 'intellect',
      baseTn: 20,
    });
    void applyApproachToRow(
      emptyApproach({ skillKey: 'physical:tracking', baseTn: 12 }),
      'oda',
    );
    expect(actor.system.specializations).toEqual(snapshot);
  });
});
