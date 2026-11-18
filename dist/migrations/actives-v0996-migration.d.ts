/**
 * Actives v0.9.9.6 consolidation migration (GM review required).
 *
 * Only the dry-run runs automatically: it reads every PC, NPC, unlinked token
 * actor and Artifact item and builds a report. Nothing is written until the GM
 * confirms Apply in the review dialog. Apply then:
 *   1. downloads a JSON backup of every affected actor / Artifact,
 *   2. stores a per-item backup in `flags.mastery-system.v0996Backup`,
 *   3. remaps legacy `active-{m|r}-damage-tN::X` to
 *      `active-{m|r}-instant-special-tN::X` (same PL, Special, custom name,
 *      favourites and flags; only old default names are renamed),
 *   4. re-bakes owned items of templates whose v0.9.9.6 values changed,
 *   5. remaps legacy `damage-t*` Artifact picks (provenance holds are listed only),
 *   6. flags conflicts (`v0996Conflict`) and Mental Attack (`v0996Retired`)
 *      without changing them — no merge, no deletion, no XP refund,
 *   7. sets `activesV0996MigrationState = applied`, which lifts the resync hold.
 *
 * Idempotent: migrated / flagged items are skipped on later runs. Rollback is
 * per actor from the item backups.
 */
export declare const V0996_MIGRATED_FLAG = "v0996Migrated";
export declare const V0996_BACKUP_FLAG = "v0996Backup";
export declare const V0996_CONFLICT_FLAG = "v0996Conflict";
export declare const V0996_RETIRED_FLAG = "v0996Retired";
export declare const V0996_NOTE_FLAG = "v0996Note";
export type V0996ItemKind = 'remap' | 'resync' | 'conflict' | 'retire-mental' | 'unmappable';
export interface V0996ItemChange {
    kind: V0996ItemKind;
    actorId: string;
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    rank: number;
    special: string | null;
    fromTemplateId: string;
    toTemplateId: string | null;
    /** New name when the item still carries an old default name; null = name kept. */
    rename: string | null;
    /** Human-readable value changes at the owned Power Level. */
    valueChanges: string[];
    note: string;
}
export interface V0996ArtifactPickChange {
    kind: 'remap';
    ownerName: string;
    ownerUuid: string | null;
    itemId: string;
    itemName: string;
    pickLevel: number;
    special: string | null;
    fromTemplateId: string;
    toTemplateId: string | null;
    note: string;
}
export interface V0996InfoRow {
    actorName: string;
    actorUuid: string;
    itemName?: string;
    note: string;
}
export interface V0996Report {
    generatedAt: string;
    state: string;
    items: V0996ItemChange[];
    artifactPicks: V0996ArtifactPickChange[];
    zoneRoot: V0996InfoRow[];
    actorsWithoutAttackPower: V0996InfoRow[];
}
/**
 * Default names an item could carry from older catalog versions (before the
 * v0.9.9.6 titles). Only items still named like this are renamed.
 */
export declare function legacyDefaultNames(templateId: string, specialKey: string | null): Set<string>;
/** World actors plus unlinked token actors on every scene. */
export declare function collectV0996Actors(g?: any): any[];
/** Plan all power-item changes for one actor. */
export declare function planActorV0996(actor: any): V0996ItemChange[];
/** Plan Artifact pick remaps for one Artifact item. */
export declare function planArtifactV0996(item: any, owner: any | null): V0996ArtifactPickChange[];
/** Build the full dry-run report. Reads only. */
export declare function buildActivesV0996Report(g?: any): V0996Report;
/** True when the report contains anything that Apply would write or the GM must see. */
export declare function reportHasChanges(report: V0996Report): boolean;
export declare function formatActivesV0996ReportMarkdown(report: V0996Report): string;
/** Download a JSON backup of every affected actor / world Artifact before Apply. */
export declare function downloadActivesV0996Backup(report: V0996Report, g?: any): number;
export interface V0996ApplySummary {
    applied: number;
    skipped: number;
    artifacts: number;
    failed: number;
}
/**
 * Apply a reviewed report. GM only. Writes per-item backups first; sets the
 * world state to `applied` and runs the (now unblocked) template resync.
 */
export declare function applyActivesV0996Report(report: V0996Report, g?: any): Promise<V0996ApplySummary>;
/**
 * Restore every item on one actor from its v0.9.9.6 backup flag and clear the
 * markers. Resets the world state to `pending` (unless disabled) so the resync
 * does not re-bake the restored values before the GM reviews again.
 */
export declare function rollbackActorV0996(actor: any, options?: {
    resetState?: boolean;
}): Promise<number>;
/**
 * GM world load: build the dry-run report (reads only). A clean world with
 * nothing to migrate is marked `applied`; otherwise a persistent banner is
 * shown and the review dialog opens. Must run before the template resync.
 */
export declare function runActivesV0996DryRunOnReady(g?: any): Promise<V0996Report | null>;
//# sourceMappingURL=actives-v0996-migration.d.ts.map