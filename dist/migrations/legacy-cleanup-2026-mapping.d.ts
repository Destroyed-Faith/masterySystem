/**
 * Legacy cleanup 2026: the one old → new mapping table and the item
 * classification shared by the migration, the template resync hold and the
 * regression tests. Every removed template either maps to exactly one
 * canonical template or goes to the GM conflict list; nothing is guessed.
 */
export declare const LEGACY_CLEANUP_STATE_KEY = "legacyCleanup2026MigrationState";
export declare const LC_MIGRATED_FLAG = "legacyCleanupMigrated";
export declare const LC_BACKUP_FLAG = "legacyCleanupBackup";
export declare const LC_CONFLICT_FLAG = "legacyCleanupConflict";
export declare const LC_RETIRED_FLAG = "legacyCleanupRetired";
export declare const LC_NOTE_FLAG = "legacyCleanupNote";
/** Removed template → canonical template (same delivery, same Power Level). */
export declare const LEGACY_CLEANUP_TEMPLATE_REMAP: Readonly<Record<string, string>>;
/** Removed templates without a canonical counterpart (D3 / D4): owned items go to the conflict list. */
export declare const LEGACY_CLEANUP_CONFLICT_TEMPLATES: ReadonlySet<string>;
/** Removed with Actives v0.9.9.6; that migration remaps or flags these. */
export declare const V0996_OWNED_TEMPLATE_RE: RegExp;
/** Old Moonlight Mending grant: now Ranged Single Target Restoration on the Artifact. */
export declare const ARTIFACT_SINGLE_HEAL_RE: RegExp;
/** Zone T5 Root (D5): not printed in Actives v0.9.9.6. */
export declare const ZONE_ROOT_TEMPLATE = "active-ranged-zone-t5";
export declare const ZONE_ROOT_SPECIAL = "root";
/** Weapon AoE Powers no longer carry an optional Special. */
export declare const WEAPON_AOE_TEMPLATE_RE: RegExp;
export interface LegacyTargetRef {
    templateId: string;
    special: string | null;
}
/**
 * `${templateId}::${special}` → canonical target for Artifact-granted lines.
 * Rending Spiral (Dragon Claws) and Lor-Keth's Staff L1 (D2).
 */
export declare const LEGACY_CLEANUP_SPECIAL_REMAP: Readonly<Record<string, LegacyTargetRef>>;
export type LegacyPowerClass = {
    kind: 'remap';
    to: LegacyTargetRef;
    reason: string;
} | {
    kind: 'conflict';
    reason: string;
} | {
    kind: 'retire';
    reason: string;
} | {
    kind: 'v0996';
    reason: string;
};
/**
 * Classify one owned power (or Artifact pick) by template + Special. `null`
 * means the item is not part of this cleanup.
 */
export declare function classifyLegacyPower(templateId: string, special: string | null, artifactSourced: boolean): LegacyPowerClass | null;
/** True when an item came from an Artifact / Echo grant. */
export declare function isArtifactSourcedItem(item: any): boolean;
/** True when the legacy-cleanup migration already decided this item (flagged or migrated). */
export declare function isLegacyCleanupFlagged(item: any): boolean;
/**
 * Template resync hold: conflicted / retired items are never re-baked, and
 * cleanup candidates keep their stored values until the migration is applied.
 */
export declare function isLegacyCleanupResyncHeld(item: any, migrationApplied: boolean): boolean;
//# sourceMappingURL=legacy-cleanup-2026-mapping.d.ts.map