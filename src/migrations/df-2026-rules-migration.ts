/**
 * DF 2026-10-23 actor schema migration.
 *
 * - Idempotent via `system.progression.rulesSchemaVersion === 2026.10.23`
 * - Backs up legacy Skills / Minor Expressions / Echo Cards / Social Combat /
 *   Death flags into `flags.mastery-system.legacySnapshot` before clearing
 *   active hooks.
 * - Does NOT invent Specialization Ranks or Imprint selections for advanced PCs.
 */

import { DF_2026_RULES_SCHEMA_VERSION } from '../rules/index.js';
import { CORE_RITUALS } from '../rules/core-rituals.js';
import { ECHO_IMPRINTS } from '../rules/echo-imprints.js';

export const DF_2026_LEGACY_SNAPSHOT_FLAG = 'legacySnapshot';

export interface Df2026MigrationSummary {
  actorId: string;
  actorName: string;
  changed: boolean;
  alreadyMigrated: boolean;
  archived: string[];
  warnings: string[];
}

function flag(actor: any, key: string): unknown {
  try {
    return actor?.getFlag?.('mastery-system', key);
  } catch {
    return actor?.flags?.['mastery-system']?.[key];
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null));
}

/** Exact Minor Expression → Echo Imprint ID mappings when semantics align. */
export const MINOR_EXPRESSION_TO_IMPRINT: Record<string, string> = {
  'intellect-mage-hand': 'mage-hand',
  'intellect-message': 'message',
  'intellect-arcane-spark': 'arcane-spark',
  'agility-catfall': 'catfall',
  'influence-glamour': 'glamour',
};

export function planDf2026ActorMigration(actor: any): {
  update: Record<string, unknown> | null;
  summary: Df2026MigrationSummary;
} {
  const empty: Df2026MigrationSummary = {
    actorId: String(actor?.id || ''),
    actorName: String(actor?.name || ''),
    changed: false,
    alreadyMigrated: false,
    archived: [],
    warnings: [],
  };
  if (!actor || actor.type !== 'character') {
    return { update: null, summary: empty };
  }

  const system = actor.system ?? {};
  const progression = system.progression ?? {};
  if (String(progression.rulesSchemaVersion || '') === DF_2026_RULES_SCHEMA_VERSION) {
    return {
      update: null,
      summary: { ...empty, alreadyMigrated: true },
    };
  }

  const archived: string[] = [];
  const warnings: string[] = [];
  const priorSnapshot = flag(actor, DF_2026_LEGACY_SNAPSHOT_FLAG);
  const legacySnapshot = priorSnapshot && typeof priorSnapshot === 'object'
    ? deepClone(priorSnapshot)
    : {
        migratedAt: new Date().toISOString(),
        fromVersion: String(progression.rulesVersion || progression.rulesSchemaVersion || 'pre-2026.10.23'),
        skills: deepClone(system.skills ?? null),
        skillPoints: deepClone(system.skillPoints ?? system.points?.skill ?? null),
        minorExpressions: deepClone(system.minorExpressions ?? null),
        echoCards: deepClone(system.echoCards ?? system.echo?.cards ?? null),
        socialCombat: deepClone(system.socialCombat ?? null),
        death: deepClone(system.death ?? system.dying ?? null),
        pursuit: deepClone(system.pursuit ?? null),
      };

  if (system.skills) archived.push('skills');
  if (system.minorExpressions || system.expressions) archived.push('minorExpressions');
  if (system.echoCards || system.echo?.cards) archived.push('echoCards');
  if (system.socialCombat) archived.push('socialCombat');
  if (system.death || system.dying) archived.push('death');
  if (system.pursuit) archived.push('pursuit');

  const existingSpecs = Array.isArray(system.specializations) ? system.specializations : [];
  if (!existingSpecs.length && system.skills && typeof system.skills === 'object') {
    warnings.push(
      'Legacy fixed Skills archived. Choose free-named Specializations (do not auto-convert Ratings).',
    );
  }

  const existingImprints = Array.isArray(system.echoImprints) ? system.echoImprints : [];
  const proposedImprints = [...existingImprints];
  const exprList: string[] = Array.isArray(system.minorExpressions?.selected)
    ? system.minorExpressions.selected
    : Array.isArray(system.minorExpressions)
      ? system.minorExpressions
      : [];
  for (const rawId of exprList) {
    const mapped = MINOR_EXPRESSION_TO_IMPRINT[String(rawId)];
    if (mapped && ECHO_IMPRINTS.some((e) => e.id === mapped) && !proposedImprints.includes(mapped)) {
      proposedImprints.push(mapped);
    } else if (!mapped) {
      warnings.push(`Minor Expression "${rawId}" needs manual Echo Imprint choice.`);
    }
  }

  const mr = Math.max(1, Math.floor(Number(system.mastery?.rank) || 2));
  if (proposedImprints.length > mr) {
    warnings.push(
      `Proposed Imprints (${proposedImprints.length}) exceed MR ${mr}; trim selections after migration.`,
    );
  }

  const update: Record<string, unknown> = {
    'system.progression.rulesSchemaVersion': DF_2026_RULES_SCHEMA_VERSION,
    'system.rituals.universalCoreIds': CORE_RITUALS.map((r) => r.id),
    [`flags.mastery-system.${DF_2026_LEGACY_SNAPSHOT_FLAG}`]: legacySnapshot,
    // Active Echo Card / Social Combat / Death Save state cleared; data kept in snapshot.
    'system.echoCards': null,
    'system.socialCombat': null,
    'system.death': null,
    'system.dying': null,
    'system.pursuit': null,
  };

  if (!existingImprints.length && proposedImprints.length) {
    update['system.echoImprints'] = proposedImprints.slice(0, mr);
  }

  return {
    update,
    summary: {
      actorId: empty.actorId,
      actorName: empty.actorName,
      changed: true,
      alreadyMigrated: false,
      archived,
      warnings,
    },
  };
}

export async function runDf2026RulesMigration(
  actors: any[],
  opts?: { dryRun?: boolean },
): Promise<Df2026MigrationSummary[]> {
  const user = (globalThis as any).game?.user;
  if (user && user.isGM === false) return [];
  const summaries: Df2026MigrationSummary[] = [];
  for (const actor of actors || []) {
    if (!actor || actor.type !== 'character') continue;
    const { update, summary } = planDf2026ActorMigration(actor);
    summaries.push(summary);
    if (!update || opts?.dryRun) continue;
    try {
      await actor.update(update);
    } catch (err) {
      console.warn('Mastery System | DF 2026 migration failed', actor?.name, err);
      summary.warnings.push(`Update failed: ${String(err)}`);
    }
  }
  return summaries;
}
