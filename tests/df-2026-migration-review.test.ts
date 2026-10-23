import { describe, expect, it, vi } from 'vitest';
import { planDf2026ActorMigration } from '../src/migrations/df-2026-rules-migration.js';
import {
  DF_2026_REVIEWED_FLAG,
  applyDf2026Review,
  buildDf2026ReviewPlan,
  buildDf2026ReviewUpdate,
  listDf2026ReviewPlans,
} from '../src/migrations/df-2026-migration-review-plan.js';
import { DF_2026_RULES_SCHEMA_VERSION } from '../src/rules/index.js';
import {
  buildActorSystemFromPayload,
  normalizeImportEchoImprintIds,
  normalizeImportSpecializations,
} from '../src/import/character-import-build.js';
import { validateCharacterImportDocument } from '../src/import/character-import-validation.js';
import {
  buildMasteryCharacterExport,
  exportMasteryCharacterJson,
} from '../src/import/character-export.js';
import { buildCharacterPrintContext } from '../src/sheets/character-print.js';

function legacyActor(overrides: Record<string, any> = {}) {
  const actor: any = {
    id: 'a1',
    name: 'Legacy',
    type: 'character',
    system: {
      mastery: { rank: 2 },
      attributes: {
        might: { value: 8 },
        agility: { value: 8 },
        intellect: { value: 8 },
        influence: { value: 8 },
        wits: { value: 8 },
      },
      progression: {},
      skills: { stealth: { rating: 12 }, medicine: 8, athletics: 0 },
      minorExpressions: {
        selected: ['intellect-mage-hand', 'agility-catfall', 'might-hold-fast'],
      },
      xp: { total: 40 },
      stonePools: { might: { current: 1, max: 1 } },
    },
    flags: { 'mastery-system': {} },
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
    update: vi.fn(async () => undefined),
    ...overrides,
  };
  return actor;
}

/** Apply a migration update onto the fake actor so the review sees post-migration data. */
function migrated(actor: any) {
  const { update } = planDf2026ActorMigration(actor);
  expect(update).not.toBeNull();
  actor.system.progression.rulesSchemaVersion = update!['system.progression.rulesSchemaVersion'];
  actor.system.echoImprints = update!['system.echoImprints'] ?? [];
  actor.flags['mastery-system'].legacySnapshot = update!['flags.mastery-system.legacySnapshot'];
  return actor;
}

describe('DF 2026 migration review plan', () => {
  it('lists legacy Skills as Spec suggestions only — no Rank is assigned', () => {
    const plan = buildDf2026ReviewPlan(migrated(legacyActor()));
    expect(plan.specSuggestions.map((s) => s.suggestedName)).toEqual(['Stealth', 'Medicine']);
    for (const s of plan.specSuggestions) {
      expect(s).not.toHaveProperty('rank');
      expect(s).not.toHaveProperty('suggestedRank');
    }
    expect(plan.specSuggestions[0].legacyRating).toBe(12);
    // Zero-rated skills are not suggested.
    expect(plan.specSuggestions.some((s) => s.skillKey === 'athletics')).toBe(false);
    // Nothing was written as a Specialization (and certainly no Rank 2).
    expect(plan.currentSpecializations).toEqual([]);
    expect(plan.needsReview).toBe(true);
  });

  it('reports unmapped Minor Expressions and Imprint trim warnings (count > MR)', () => {
    const actor = migrated(legacyActor());
    actor.system.mastery.rank = 1;
    const plan = buildDf2026ReviewPlan(actor);
    expect(plan.unmappedExpressions.map((u) => u.id)).toEqual(['might-hold-fast']);
    expect(plan.mappedImprintIds).toEqual(['mage-hand', 'catfall']);
    expect(plan.proposedImprintIds.length).toBeGreaterThan(plan.masteryRank);
    expect(plan.trimmedImprintIds.length).toBe(plan.proposedImprintIds.length - plan.masteryRank);
    expect(plan.imprintTrimWarning).toMatch(/exceed Mastery Rank 1/);
  });

  it('only lists migrated, unreviewed characters', () => {
    const fresh = legacyActor({ id: 'fresh' });
    const done = migrated(legacyActor({ id: 'done' }));
    done.flags['mastery-system'][DF_2026_REVIEWED_FLAG] = '2026-10-23T00:00:00.000Z';
    const open = migrated(legacyActor({ id: 'open' }));
    const plans = listDf2026ReviewPlans([fresh, done, open]);
    expect(plans.map((p) => p.actorId)).toEqual(['open']);
    expect(listDf2026ReviewPlans([done], { includeReviewed: true })).toHaveLength(1);
  });

  it('save writes only specializations + echoImprints + review stamp', async () => {
    const actor = migrated(legacyActor());
    const result = await applyDf2026Review(actor, {
      specializations: [
        { name: 'Stealth', field: 'survival', scope: 'Moving unseen', rank: 1 },
      ],
      echoImprints: ['mage-hand'],
    });
    expect(result.ok).toBe(true);
    expect(actor.update).toHaveBeenCalledTimes(1);
    const update = (actor.update as any).mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(update).sort()).toEqual(
      [
        'system.specializations',
        'system.echoImprints',
        `flags.mastery-system.${DF_2026_REVIEWED_FLAG}`,
      ].sort(),
    );
    const specs = update['system.specializations'] as any[];
    expect(specs).toHaveLength(1);
    expect(specs[0].rank).toBe(1);
    // XP / Stones / Powers / Artifacts keys are never part of the review update.
    for (const key of Object.keys(update)) {
      expect(key).not.toMatch(/xp|stone|power|artifact|items/i);
    }
  });

  it('rejects invalid input (missing scope, Imprints over MR) without writing', async () => {
    const actor = migrated(legacyActor());
    const noScope = buildDf2026ReviewUpdate(actor, {
      specializations: [{ name: 'Stealth', field: 'survival', scope: '', rank: 1 }],
      echoImprints: [],
    });
    expect(noScope.ok).toBe(false);
    expect(noScope.update).toBeNull();

    const tooMany = await applyDf2026Review(actor, {
      specializations: [],
      echoImprints: ['mage-hand', 'catfall', 'message'],
    });
    expect(tooMany.ok).toBe(false);
    expect(tooMany.errors.join(' ')).toMatch(/At most 2/);
    expect(actor.update).not.toHaveBeenCalled();
  });

  it('migration schema stays idempotent', () => {
    const actor = migrated(legacyActor());
    const again = planDf2026ActorMigration(actor);
    expect(again.update).toBeNull();
    expect(again.summary.alreadyMigrated).toBe(true);
  });
});

describe('DF 2026 import shape', () => {
  const specs = [
    { name: 'Lockpicking', field: 'finesse', scope: 'Opening locks quietly', rank: 2 },
    { name: 'Lockpicking', field: 'finesse', scope: 'duplicate', rank: 3 },
    { name: 'Tracking', field: 'survival', scope: 'Following trails', rank: 12 },
  ];

  it('normalizes Specializations (identity id, de-dupe, rank clamp)', () => {
    const out = normalizeImportSpecializations(specs);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: 'finesse:lockpicking', rank: 2 });
    expect(out[1].rank).toBe(8);
  });

  it('caps Imprints at MR and drops unknown ids', () => {
    expect(normalizeImportEchoImprintIds(['mage-hand', 'nope', 'catfall', 'message'], 2)).toEqual([
      'mage-hand',
      'catfall',
    ]);
  });

  it('writes system.specializations and system.echoImprints; legacy stays archive-only', () => {
    const system = buildActorSystemFromPayload({
      name: 'Importer',
      attributes: { might: 8, agility: 8, intellect: 8 },
      masteryRank: 2,
      specializations: [{ name: 'Lockpicking', field: 'finesse', scope: 'Locks', rank: 2 }],
      echoImprints: ['mage-hand'],
      skills: { stealth: 5 },
      minorExpressions: ['intellect-mage-hand'],
    } as any) as any;
    expect(system.specializations).toEqual([
      { id: 'finesse:lockpicking', name: 'Lockpicking', field: 'finesse', scope: 'Locks', rank: 2 },
    ]);
    expect(system.echoImprints).toEqual(['mage-hand']);
    expect(system.progression.rulesSchemaVersion).toBe(DF_2026_RULES_SCHEMA_VERSION);
    // Legacy fields are preserved as-is but are never turned into Specializations.
    expect(system.skills).toEqual({ stealth: 5 });
    expect(system.specializations).toHaveLength(1);
  });

  it('legacy-only payload is not stamped as DF 2026 (migration will handle it)', () => {
    const system = buildActorSystemFromPayload({
      name: 'Old',
      attributes: { might: 8 },
      masteryRank: 2,
      skills: { stealth: 5 },
    } as any) as any;
    expect(system.progression.rulesSchemaVersion).toBeUndefined();
    expect(system.specializations).toEqual([]);
    expect(system.echoImprints).toEqual([]);
  });

  const basePayload = {
    name: 'Valid',
    attributes: { might: 8, agility: 8, vitality: 8, intellect: 8, resolve: 8, influence: 8, wits: 8 },
    masteryRank: 2,
    powers: [
      { templateId: 'passive-evade', rank: 4 },
      { templateId: 'passive-temp-hp', rank: 4 },
      { templateId: 'ab-evade', rank: 4 },
      { templateId: 'reaction-evade', rank: 4 },
      { templateId: 'active-melee-weapon-single', rank: 2 },
      { templateId: 'active-melee-damage-t4', special: 'ruin', rank: 2 },
    ],
  };
  const wrap = (character: Record<string, unknown>) => ({
    schemaVersion: 1,
    exportKind: 'mastery-character-import',
    systemId: 'mastery-system',
    character: { ...basePayload, ...character },
  });

  it('validates specializations + echoImprints', () => {
    const fiveSpecs = Array.from({ length: 5 }, (_, i) => ({
      name: `Spec ${i + 1}`,
      field: 'finesse',
      scope: `Scope ${i + 1}`,
      rank: 2,
    }));
    const ok = validateCharacterImportDocument(
      wrap({
        specializations: fiveSpecs,
        echoImprints: ['mage-hand'],
      }),
    );
    expect(ok.errors).toEqual([]);
    expect(ok.ok).toBe(true);

    const partialOk = validateCharacterImportDocument(
      wrap({
        creationComplete: false,
        specializations: [{ name: 'Lockpicking', field: 'finesse', scope: 'Locks', rank: 2 }],
        echoImprints: ['mage-hand'],
      }),
    );
    expect(partialOk.ok).toBe(true);

    const bad = validateCharacterImportDocument(
      wrap({
        specializations: [{ name: 'X', field: 'nonsense', scope: 'x', rank: 1 }],
        echoImprints: ['mage-hand', 'catfall', 'message'],
      }),
    );
    expect(bad.ok).toBe(false);
    expect(bad.errors.some((e) => /Field/i.test(e))).toBe(true);
    expect(bad.errors.some((e) => /At most 2/.test(e))).toBe(true);
  });
});

describe('DF 2026 export round-trip', () => {
  it('exports specializations + echoImprints and re-validates as an importable actor document', () => {
    const actor = migrated(legacyActor());
    actor.system.specializations = [
      { id: 'finesse:lockpicking', name: 'Lockpicking', field: 'finesse', scope: 'Locks', rank: 2 },
    ];
    actor.system.echoImprints = ['mage-hand'];
    actor.items = [];

    const doc = buildMasteryCharacterExport(actor, { exportedAt: '2026-10-23T00:00:00.000Z' });
    expect(doc.exportKind).toBe('mastery-foundry-actor');
    expect((doc.actor.system as any).specializations).toHaveLength(1);
    expect((doc.actor.system as any).echoImprints).toEqual(['mage-hand']);

    const parsed = JSON.parse(exportMasteryCharacterJson(actor));
    expect(parsed.actor.system.specializations[0].name).toBe('Lockpicking');
    const validation = validateCharacterImportDocument(parsed);
    expect(validation.ok).toBe(true);
  });
});

describe('DF 2026 print context', () => {
  it('prints Specializations and Echo Imprints', () => {
    const actor: any = {
      id: 'p1',
      name: 'Printer',
      type: 'character',
      items: [],
      system: {
        mastery: { rank: 2 },
        progression: { rulesSchemaVersion: DF_2026_RULES_SCHEMA_VERSION },
        attributes: { intellect: { value: 8 }, agility: { value: 4 }, might: { value: 8 } },
        specializations: [
          { id: 'finesse:lockpicking', name: 'Lockpicking', field: 'finesse', scope: 'Locks', rank: 3 },
        ],
        echoImprints: ['mage-hand'],
      },
    };
    const ctx = buildCharacterPrintContext(actor) as any;
    expect(ctx.showSpecializations).toBe(true);
    expect(ctx.specializationGroups[0].label).toBe('Finesse');
    expect(ctx.specializationGroups[0].specs[0]).toMatchObject({ name: 'Lockpicking', rank: 3 });
    expect(ctx.specializationGroups[0].specs[0].pips.filter((p: any) => p.filled)).toHaveLength(3);
    expect(ctx.showEchoImprints).toBe(true);
    expect(ctx.echoImprints[0]).toMatchObject({ name: 'Mage Hand', tier: 8 });
    expect(ctx.echoImprintSlots).toBe(2);
  });
});
