import { describe, expect, it } from 'vitest';
import {
  MINOR_EXPRESSION_TO_IMPRINT,
  planDf2026ActorMigration,
} from '../src/migrations/df-2026-rules-migration.js';
import { DF_2026_RULES_SCHEMA_VERSION } from '../src/rules/index.js';

describe('DF 2026 actor migration', () => {
  it('maps known Minor Expressions to Echo Imprints', () => {
    expect(MINOR_EXPRESSION_TO_IMPRINT['intellect-mage-hand']).toBe('mage-hand');
    expect(MINOR_EXPRESSION_TO_IMPRINT['agility-catfall']).toBe('catfall');
  });

  it('is idempotent once rulesSchemaVersion is set', () => {
    const actor = {
      id: 'a1',
      name: 'Alaris',
      type: 'character',
      system: {
        progression: { rulesSchemaVersion: DF_2026_RULES_SCHEMA_VERSION },
        skills: { stealth: { rating: 8 } },
      },
      flags: { 'mastery-system': {} },
    };
    const { update, summary } = planDf2026ActorMigration(actor);
    expect(update).toBeNull();
    expect(summary.alreadyMigrated).toBe(true);
  });

  it('archives legacy skills and proposes mapped Imprints without inventing Specs', () => {
    const actor = {
      id: 'a2',
      name: 'Legacy',
      type: 'character',
      system: {
        mastery: { rank: 2 },
        progression: {},
        skills: { stealth: { rating: 12 }, medicine: { rating: 8 } },
        minorExpressions: { selected: ['intellect-mage-hand', 'agility-catfall', 'might-hold-fast'] },
      },
      flags: { 'mastery-system': {} },
      getFlag(scope: string, key: string) {
        return this.flags?.[scope]?.[key];
      },
    };
    const { update, summary } = planDf2026ActorMigration(actor);
    expect(update).not.toBeNull();
    expect(update!['system.progression.rulesSchemaVersion']).toBe(DF_2026_RULES_SCHEMA_VERSION);
    expect(update!['system.echoImprints']).toEqual(['mage-hand', 'catfall']);
    expect(summary.archived).toContain('skills');
    expect(summary.warnings.some((w) => /hold-fast|manual/i.test(w) || /Minor Expression/i.test(w))).toBe(true);
    expect(summary.warnings.some((w) => /Specializations/i.test(w))).toBe(true);
    expect(update!['system.specializations']).toBeUndefined();
  });
});
