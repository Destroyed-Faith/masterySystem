/**
 * Legacy cleanup 2026: the one old → new mapping table and the item
 * classification shared by the migration, the template resync hold and the
 * regression tests. Every removed template either maps to exactly one
 * canonical template or goes to the GM conflict list; nothing is guessed.
 */

export const LEGACY_CLEANUP_STATE_KEY = 'legacyCleanup2026MigrationState';

export const LC_MIGRATED_FLAG = 'legacyCleanupMigrated';
export const LC_BACKUP_FLAG = 'legacyCleanupBackup';
export const LC_CONFLICT_FLAG = 'legacyCleanupConflict';
export const LC_RETIRED_FLAG = 'legacyCleanupRetired';
export const LC_NOTE_FLAG = 'legacyCleanupNote';

/** Removed template → canonical template (same delivery, same Power Level). */
export const LEGACY_CLEANUP_TEMPLATE_REMAP: Readonly<Record<string, string>> = {
  'active-melee-heal-cleanse-mixed': 'active-melee-single-cleanse',
  'active-ranged-heal-cleanse-mixed': 'active-ranged-single-cleanse',
};

/** Removed templates without a canonical counterpart (D3 / D4): owned items go to the conflict list. */
export const LEGACY_CLEANUP_CONFLICT_TEMPLATES: ReadonlySet<string> = new Set([
  'active-melee-damage-stunned',
  'active-ranged-damage-stunned',
  'active-melee-control-pull-disarm',
  'active-ranged-control-pull-disarm',
  'active-melee-control-push-prone',
  'active-ranged-control-push-prone',
  'active-cleanse-absorption',
  'active-melee-single-dispel',
  'active-ranged-single-dispel',
  'active-melee-aoe-dispel',
  'active-ranged-aoe-dispel',
  'active-melee-damage-dispel-mixed',
  'active-ranged-damage-dispel-mixed',
  'active-melee-targeted-special',
  'active-ranged-targeted-special',
  'active-melee-aoe-targeted-special',
  'active-ranged-aoe-targeted-special',
]);

/** Removed with Actives v0.9.9.6; that migration remaps or flags these. */
export const V0996_OWNED_TEMPLATE_RE = /^active-(?:(?:melee|ranged)-damage-t[3-6]|mental-attack)$/;

/** Old Moonlight Mending grant: now Ranged Single Target Restoration on the Artifact. */
export const ARTIFACT_SINGLE_HEAL_RE = /^active-(?:melee|ranged)-single-heal$/;

/** Zone T5 Root (D5): not printed in Actives v0.9.9.6. */
export const ZONE_ROOT_TEMPLATE = 'active-ranged-zone-t5';
export const ZONE_ROOT_SPECIAL = 'root';

/** Weapon AoE Powers no longer carry an optional Special. */
export const WEAPON_AOE_TEMPLATE_RE = /^active-(?:melee|ranged)-weapon-aoe$/;

export interface LegacyTargetRef {
  templateId: string;
  special: string | null;
}

/**
 * `${templateId}::${special}` → canonical target for Artifact-granted lines.
 * Rending Spiral (Dragon Claws) and Lor-Keth's Staff L1 (D2).
 */
export const LEGACY_CLEANUP_SPECIAL_REMAP: Readonly<Record<string, LegacyTargetRef>> = {
  'active-melee-weapon-aoe::lacerate': { templateId: 'active-melee-aoe-damage-t4', special: 'lacerate' },
  'active-melee-damage-t5::challenge': { templateId: 'active-melee-instant-special-t6', special: 'expose' },
};

export type LegacyPowerClass =
  | { kind: 'remap'; to: LegacyTargetRef; reason: string }
  | { kind: 'conflict'; reason: string }
  | { kind: 'retire'; reason: string }
  | { kind: 'v0996'; reason: string };

/**
 * Classify one owned power (or Artifact pick) by template + Special. `null`
 * means the item is not part of this cleanup.
 */
export function classifyLegacyPower(
  templateId: string,
  special: string | null,
  artifactSourced: boolean,
): LegacyPowerClass | null {
  const tid = String(templateId || '').trim();
  if (!tid) return null;
  const key = `${tid}::${special ?? ''}`;
  const specialRemap = LEGACY_CLEANUP_SPECIAL_REMAP[key];

  const remap = LEGACY_CLEANUP_TEMPLATE_REMAP[tid];
  if (remap) {
    return { kind: 'remap', to: { templateId: remap, special: null }, reason: 'Heal + Cleanse (Mixed) → Cleanse (D3).' };
  }
  if (LEGACY_CLEANUP_CONFLICT_TEMPLATES.has(tid)) {
    return { kind: 'conflict', reason: `${tid} is not a canonical Power (D3/D4). Kept unchanged for GM decision.` };
  }
  if (tid === ZONE_ROOT_TEMPLATE && special === ZONE_ROOT_SPECIAL) {
    return { kind: 'conflict', reason: 'Zone Root (T5) is not printed in Actives v0.9.9.6 (D5). Kept unchanged for GM decision.' };
  }
  if (ARTIFACT_SINGLE_HEAL_RE.test(tid)) {
    if (!artifactSourced) return null;
    return {
      kind: 'retire',
      reason: 'Old Moonlight Mending Heal Active. Moonlight Mending is now Ranged Single Target Restoration from the Artifact (D1).',
    };
  }
  if (WEAPON_AOE_TEMPLATE_RE.test(tid) && special) {
    if (artifactSourced && specialRemap) {
      return { kind: 'remap', to: specialRemap, reason: 'Artifact Weapon AoE + Special → AoE Special (Rending Spiral).' };
    }
    return { kind: 'conflict', reason: `Weapon AoE Powers no longer carry an optional Special (${special}). Kept unchanged for GM decision.` };
  }
  if (V0996_OWNED_TEMPLATE_RE.test(tid)) {
    if (artifactSourced && specialRemap) {
      return { kind: 'remap', to: specialRemap, reason: "Lor-Keth's Staff L1 → Melee Single Target Special: Expose (D2)." };
    }
    return { kind: 'v0996', reason: `${tid} was removed with Actives v0.9.9.6 and is handled by that migration.` };
  }
  return null;
}

function readMsFlags(item: any): Record<string, unknown> {
  return (item?.flags?.['mastery-system'] ?? {}) as Record<string, unknown>;
}

/** True when an item came from an Artifact / Echo grant. */
export function isArtifactSourcedItem(item: any): boolean {
  if (!item) return false;
  const flags = readMsFlags(item);
  if (flags.echoBound || flags.fromArtifact || flags.artifactGranted) return true;
  const sys = item.system ?? {};
  return sys.echoBound === true || sys.fromArtifact === true || sys.artifactGranted === true;
}

/** True when the legacy-cleanup migration already decided this item (flagged or migrated). */
export function isLegacyCleanupFlagged(item: any): boolean {
  const flags = readMsFlags(item);
  return !!flags[LC_CONFLICT_FLAG] || flags[LC_RETIRED_FLAG] === true || flags[LC_MIGRATED_FLAG] === true;
}

/**
 * Template resync hold: conflicted / retired items are never re-baked, and
 * cleanup candidates keep their stored values until the migration is applied.
 */
export function isLegacyCleanupResyncHeld(item: any, migrationApplied: boolean): boolean {
  const flags = readMsFlags(item);
  if (flags[LC_CONFLICT_FLAG] || flags[LC_RETIRED_FLAG] === true) return true;
  if (migrationApplied) return false;
  const sys = item?.system ?? {};
  const special = sys.chosenSpecial?.key ? String(sys.chosenSpecial.key) : null;
  return classifyLegacyPower(String(sys.templateId ?? ''), special, isArtifactSourcedItem(item)) !== null;
}
