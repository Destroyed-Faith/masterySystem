/**
 * Unified GM Rolls dialog — simplified Skill publish + comparative helpers.
 * Per-character Skill assignment now happens in chat (see chat-driven-skill-check.test.ts).
 */
import { describe, expect, it } from 'vitest';
import {
  defaultComparativeConfig,
  emptyApproach,
  equipmentPenaltyBreakdown,
  listActorSkillOptions,
  skillKeyFromRef,
  skillRefFromKey,
  taskLevelTnPresets,
  applyApproachToRow,
} from '../src/epic-roll/rolls-skill-panel.js';
import {
  resolveComparativeSkillCheck,
  skillAdvantageLabel,
} from '../src/rules/index.js';
import {
  planGroupAmbushStealthPool,
  sumGroupPhysicalSkillPenalties,
} from '../src/combat/group-ambush.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function mockActor(opts: {
  id: string;
  name: string;
  specs?: Array<{ id: string; name: string; field?: string; rank: number }>;
  attributes?: Record<string, number>;
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

describe('Task Level presets', () => {
  it('matches TN ladder 4…32', () => {
    expect(taskLevelTnPresets().map((p) => p.tn)).toEqual([4, 8, 12, 16, 20, 24, 28, 32]);
  });
});

describe('Approach helpers remain available for chat Modify', () => {
  it('applyApproachToRow still maps Skill / Attribute / TN', () => {
    const row = applyApproachToRow(
      emptyApproach({
        skillKey: 'physical:tracking',
        suggestedAttribute: 'wits',
        baseTn: 12,
      }),
      'alaris',
    );
    expect(skillKeyFromRef(row.skillRef)).toBe('physical:tracking');
    expect(row.attributeKey).toBe('wits');
    expect(row.baseTn).toBe(12);
  });
});

describe('Standard vs Comparative resolution rules', () => {
  it('Comparative compares totals directly; ties favor defender', () => {
    expect(
      resolveComparativeSkillCheck({ challengerTotal: 20, defenderTotal: 18 }).challengerWins,
    ).toBe(true);
    expect(
      resolveComparativeSkillCheck({ challengerTotal: 15, defenderTotal: 15 }).tieFavorsDefender,
    ).toBe(true);
  });

  it('default comparative config uses virtual opposition without creating Actors', () => {
    const cfg = defaultComparativeConfig();
    expect(cfg.source).toBe('virtual');
    expect(cfg.virtual.poolDice).toBeGreaterThan(0);
  });
});

describe('Group Ambush — combined equipment penalties', () => {
  it('plans specialist pool via group-ambush module', () => {
    const specialist = mockActor({
      id: 'scout',
      name: 'Scout',
      specs: [{ id: 'physical:stealth', name: 'Stealth', field: 'physical', rank: 4 }],
      attributes: { agility: 12 },
    });
    const heavy = mockActor({ id: 'tank', name: 'Tank', attributes: { agility: 8 } });
    const plan = planGroupAmbushStealthPool({
      specialist,
      participants: [specialist, heavy],
      attributeKey: 'agility',
    });
    expect(plan.ok).toBe(true);
    expect(plan.basePool).toBe(12);
    expect(plan.finalPool).toBe(Math.max(0, plan.basePool - plan.combinedPenalty));
  });

  it('equipmentPenaltyBreakdown ignores unrelated actors when not passed', () => {
    const a = mockActor({ id: 'a', name: 'A' });
    const onlyA = equipmentPenaltyBreakdown([a]);
    expect(onlyA.rows).toHaveLength(1);
    expect(sumGroupPhysicalSkillPenalties([a, mockActor({ id: 'b', name: 'B' })]).rows).toHaveLength(
      2,
    );
  });
});

describe('Competing GM Skill Check dialog retired; Rolls publishes chat request', () => {
  it('showSkillCheckRequestDialog redirects to Rolls', () => {
    const file = readFileSync(
      resolve(__dirname, '../src/chat/skill-check-request.ts'),
      'utf8',
    );
    expect(file).toMatch(/showEpicMasteryRollConfigDialog/);
    expect(file).toMatch(/export async function showSkillCheckRequestDialog/);
  });

  it('Rolls Skill Start publishes open chat request (no mandatory per-char Skills)', () => {
    const file = readFileSync(
      resolve(__dirname, '../src/epic-roll/rolls-skill-start.ts'),
      'utf8',
    );
    expect(file).toMatch(/createSkillCheckRequest/);
    expect(file).toMatch(/invitedActorIds/);
    expect(file).not.toMatch(/participantRows/);
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
  it('does not rewrite specialization ids or ranks when listing options', () => {
    const actor = mockActor({
      id: 'oda',
      name: 'Oda',
      specs: [
        { id: 'mental:investigation', name: 'Investigation', field: 'mental', rank: 2 },
      ],
    });
    const snapshot = structuredClone(actor.system.specializations);
    void listActorSkillOptions(actor);
    expect(skillAdvantageLabel(2)).toMatch(/showing/);
    expect(actor.system.specializations).toEqual(snapshot);
  });
});
