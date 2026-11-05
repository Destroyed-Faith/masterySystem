/**
 * Temporary read-model for artifact levelProgression identity (K2 / Fable F4–F5).
 *
 * Until Batch E persists IDs onto embedded rows / packs, consumers may fill
 * missing identity from the live source catalog. Rules:
 * - Never overwrite a row that already carries powerTemplateId or artifactFunctionId
 *   (protects GM Node-Editor reassignments).
 * - Copy identity fields atomically from the matching catalog row — no per-field
 *   `||` / `??` merges that could splice two different lines.
 * - Artifact key comes only from `flags['mastery-system'].echoArtifactKey`
 *   (never `system.echoKey`, which is the Echo imprint key).
 */

import type { ArtifactLevelProgressionRow } from '../types/item.js';
import { ECHO_ARTIFACTS } from './echo-artifacts.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';

/** Identity fields that may be filled from the catalog for blank rows. */
const IDENTITY_FIELDS = [
  'powerTemplateId',
  'artifactFunctionId',
  'rank',
  'limited',
  'isSpell',
  'castingAttribute',
  'spellResolution',
  'chosenSpecialKey',
] as const;

export type ArtifactRowIdentityField = (typeof IDENTITY_FIELDS)[number];

/** Minimal item shape needed to resolve catalog identity for a progression row. */
export interface ArtifactIdentityHost {
  flags?: { 'mastery-system'?: { echoArtifactKey?: unknown } };
  system?: {
    echoKey?: unknown;
    levelProgression?: ArtifactLevelProgressionRow[];
  } | null;
}

export function resolveEchoArtifactKey(item: ArtifactIdentityHost | null | undefined): string {
  // Intentionally ignore system.echoKey — that is the Echo imprint key, not an artifact id.
  void item?.system?.echoKey;
  return String(item?.flags?.['mastery-system']?.echoArtifactKey || '').trim();
}

export function rowHasStructuredIdentity(
  row: Pick<ArtifactLevelProgressionRow, 'powerTemplateId' | 'artifactFunctionId'> | null | undefined,
): boolean {
  if (!row) return false;
  return !!(row.powerTemplateId || row.artifactFunctionId);
}

function catalogDefinition(key: string): { levelProgression?: ArtifactLevelProgressionRow[] } | null {
  const echo = (ECHO_ARTIFACTS as Record<string, { levelProgression?: ArtifactLevelProgressionRow[] } | undefined>)[key];
  if (echo) return echo;
  const general = (GENERAL_ARTIFACTS as Record<string, { levelProgression?: ArtifactLevelProgressionRow[] } | undefined>)[key];
  return general || null;
}

/**
 * If the row already has structured identity, return it unchanged.
 * If not, and a catalog row exists for (echoArtifactKey, level), return a shallow
 * copy of `row` with identity fields taken wholly from that catalog row.
 */
export function enrichArtifactRowIdentity(
  item: ArtifactIdentityHost | null | undefined,
  row: ArtifactLevelProgressionRow,
): ArtifactLevelProgressionRow {
  if (rowHasStructuredIdentity(row)) return row;

  const key = resolveEchoArtifactKey(item);
  if (!key) return row;

  const def = catalogDefinition(key);
  if (!def?.levelProgression) return row;

  const catalogRow = def.levelProgression.find(
    (r) => Number(r.level) === Number(row.level),
  );
  if (!catalogRow || !rowHasStructuredIdentity(catalogRow)) return row;

  const enriched: ArtifactLevelProgressionRow = { ...row };
  for (const field of IDENTITY_FIELDS) {
    const value = catalogRow[field];
    if (value === undefined) continue;
    switch (field) {
      case 'powerTemplateId':
        enriched.powerTemplateId = value as string;
        break;
      case 'artifactFunctionId':
        enriched.artifactFunctionId = value as string;
        break;
      case 'rank':
        enriched.rank = value as number;
        break;
      case 'limited':
        enriched.limited = value as boolean;
        break;
      case 'isSpell':
        enriched.isSpell = value as boolean;
        break;
      case 'castingAttribute':
        enriched.castingAttribute = value as ArtifactLevelProgressionRow['castingAttribute'];
        break;
      case 'spellResolution':
        enriched.spellResolution = value as ArtifactLevelProgressionRow['spellResolution'];
        break;
      case 'chosenSpecialKey':
        enriched.chosenSpecialKey = value as string;
        break;
    }
  }
  return enriched;
}

/** Map every progression row through {@link enrichArtifactRowIdentity}. */
export function enrichArtifactLevelProgression(
  item: ArtifactIdentityHost | null | undefined,
  rows?: ArtifactLevelProgressionRow[] | null,
): ArtifactLevelProgressionRow[] {
  const list = Array.isArray(rows)
    ? rows
    : Array.isArray(item?.system?.levelProgression)
      ? item!.system!.levelProgression!
      : [];
  return list.map((row) => enrichArtifactRowIdentity(item, row));
}
