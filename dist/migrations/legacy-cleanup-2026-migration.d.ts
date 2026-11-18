/**
 * Legacy cleanup 2026 migration (GM review required).
 *
 * Only the dry run runs automatically: it reads every PC, NPC, unlinked token
 * actor and world item and builds a report. Nothing is written until the GM
 * confirms Apply in the review dialog, and Apply is only offered once the
 * Actives v0.9.9.6 migration is applied. Apply then:
 *   1. downloads a JSON backup of every affected document,
 *   2. stores a per-document backup in `flags.mastery-system.legacyCleanupBackup`,
 *   3. Skills (D6): XP-bought ranks return as Free XP (snapshot → history →
 *      Skill band table); creation ranks are only archived. Leftover unspent
 *      Skill Points become Free XP (the existing retirement rule). Everything
 *      lands in `flags.mastery-system.legacySkillsArchive`, then `system.skills`,
 *      `skillsSpent`, `skillPoints` and the redistribution fields are removed,
 *   4. NPC `system.skills` (D7) and retired Summon Skill fields are archived and removed,
 *   5. remaps / flags owned powers of removed templates and realigns Artifact
 *      picks to their definitions (`legacy-cleanup-2026-mapping.ts`); Artifacts
 *      without an `echoArtifactKey` get it once from an exact, unique name match,
 *   6. sets `legacyCleanup2026MigrationState = applied`, which lifts the resync hold.
 *
 * Ambiguous characters and removed Powers without a canonical counterpart are
 * flagged (`legacyCleanupConflict`) and stay unchanged for a GM decision; nothing
 * is deleted. Idempotent: migrated / flagged documents are skipped. Rollback is
 * per actor from the backups.
 */
import { type LegacyTargetRef } from './legacy-cleanup-2026-mapping.js';
export interface LcSkillKeyPlan {
    key: string;
    rating: number;
    creationRanks: number;
    xpRanks: number;
}
export interface LcSkillPlan {
    status: 'none' | 'apply' | 'conflict';
    reasons: string[];
    byKey: LcSkillKeyPlan[];
    /** Free XP returned for XP-bought ranks. Never added to Lifetime XP or `freeEarned`. */
    xpRefund: number;
    xpSource: 'none' | 'history' | 'canonical-band' | 'gm-decision';
    /** Leftover unspent Skill Points converted 1:1 to Free XP. */
    skillPointsToFreeXp: number;
    creationOpen: boolean;
    quarantineEntries: number;
    historyRowsMarked: number;
}
export interface LcActorPlan {
    actorUuid: string;
    actorName: string;
    actorType: string;
    skills: LcSkillPlan | null;
    npcSkillKeys: number;
    summonBonds: number;
    summonActorFields: number;
    /** Retired Echo Card picks archived from `system.echo`. */
    echoCardIds: number;
    /** Unambiguous writes (skills only when not in conflict). */
    updates: Record<string, unknown> | null;
    conflictReasons: string[];
}
export type LcItemKind = 'remap' | 'conflict' | 'retire';
export interface LcItemChange {
    kind: LcItemKind;
    ownerName: string;
    ownerUuid: string | null;
    itemId: string;
    itemName: string;
    rank: number;
    special: string | null;
    fromTemplateId: string;
    to: LegacyTargetRef | null;
    rename: string | null;
    note: string;
}
export interface LcArtifactPickChange {
    level: number;
    kind: 'realign' | 'remap' | 'conflict';
    fromTemplateId: string;
    special: string | null;
    to: string;
    note: string;
}
export interface LcArtifactChange {
    ownerName: string;
    ownerUuid: string | null;
    itemId: string;
    itemName: string;
    artifactKey: string;
    /** Definition key written to `flags.mastery-system.echoArtifactKey` (exact, unique name match). */
    keyBackfill: string | null;
    picks: LcArtifactPickChange[];
}
export interface LcInfoRow {
    ownerName: string;
    ownerUuid: string | null;
    itemName?: string;
    note: string;
}
export interface LegacyCleanupReport {
    generatedAt: string;
    state: string;
    v0996State: string;
    actors: LcActorPlan[];
    items: LcItemChange[];
    artifacts: LcArtifactChange[];
    exorcismRequiem: LcInfoRow[];
    minorMagic: LcInfoRow[];
    legacyProfessions: LcInfoRow[];
}
export interface LcBackupEntry {
    path: string;
    present: boolean;
    value?: unknown;
}
export interface LcBackup {
    at: string;
    entries: LcBackupEntry[];
}
/** Snapshot every path an update batch touches (`-=` keys resolve to the deleted field). */
export declare function backupForUpdates(doc: any, updates: Record<string, unknown>, at: string): LcBackup;
/** Update batch that restores a backup and clears the cleanup markers. */
export declare function restoreFromBackup(backup: LcBackup | null | undefined): Record<string, unknown>;
/**
 * Plan the D6 Skill migration for one character. Pure. A plan with reasons is
 * a conflict: nothing about its Skills or XP is changed until the GM decides.
 */
export declare function planCharacterSkills(actor: any): LcSkillPlan | null;
/**
 * Skill part of an actor update: archive, XP refund, removal. `xpRefund` and
 * `xpSource` come from the plan, or from a GM decision for a conflict.
 */
export declare function buildCharacterSkillUpdates(actor: any, plan: LcSkillPlan, at: string, archiveExtra?: Record<string, unknown>): Record<string, unknown>;
/** Plan everything on the actor document itself (not its items). Pure. */
export declare function planActorLegacyCleanup(actor: any, at?: string): LcActorPlan | null;
/** Plan power-item changes for one owner (actor) or for world items (`owner = null`). */
export declare function planPowerItemsLegacyCleanup(items: any[], owner: any | null): LcItemChange[];
/** Definition keys whose display name equals the item name (ignoring a trailing "(L3)"). */
export declare function artifactKeysForName(name: unknown): string[];
/** Plan pick changes for one Artifact item. Pure. */
export declare function planArtifactLegacyCleanup(item: any, owner: any | null): LcArtifactChange | null;
/** Update batch for an Artifact plan (realign / remap only; conflicts are flagged). */
export declare function buildArtifactUpdates(item: any, change: LcArtifactChange, at: string): Record<string, unknown>;
/** Build the full dry-run report. Reads only. */
export declare function buildLegacyCleanupReport(g?: any): LegacyCleanupReport;
export declare function legacyCleanupReportHasChanges(report: LegacyCleanupReport): boolean;
export declare function legacyCleanupConflictCount(report: LegacyCleanupReport): number;
export declare function formatLegacyCleanupReportMarkdown(report: LegacyCleanupReport): string;
/** Download a JSON backup of every affected actor / world item before Apply. */
export declare function downloadLegacyCleanupBackup(report: LegacyCleanupReport, g?: any): number;
export interface LegacyCleanupApplySummary {
    actors: number;
    items: number;
    artifacts: number;
    conflicts: number;
    skipped: number;
    failed: number;
}
/**
 * Apply a reviewed report. GM only, and only after Actives v0.9.9.6. Actor
 * plans are rebuilt from the live documents and skipped when they changed
 * since the report was generated.
 */
export declare function applyLegacyCleanupReport(report: LegacyCleanupReport, g?: any): Promise<LegacyCleanupApplySummary>;
/**
 * GM decision for a Skill conflict: archive and remove the legacy Skills with
 * the given Free XP refund (0 = archive only). Returns false when nothing was
 * in conflict.
 */
export declare function resolveLegacySkillConflict(actor: any, decision: {
    xpRefund: number;
    note?: string;
}): Promise<boolean>;
/**
 * Restore one actor (and its items) from the legacy-cleanup backups and clear
 * the markers. Resets the world state to `pending` (unless disabled) so the
 * resync does not re-bake restored items before the GM reviews again.
 */
export declare function rollbackActorLegacyCleanup(actor: any, options?: {
    resetState?: boolean;
}): Promise<number>;
/**
 * GM world load: build the dry-run report (reads only). A clean world is
 * marked `applied`; otherwise a persistent banner is shown and the review
 * dialog opens. Must run after the v0.9.9.6 dry run and before the resync.
 */
export declare function runLegacyCleanupDryRunOnReady(g?: any): Promise<LegacyCleanupReport | null>;
//# sourceMappingURL=legacy-cleanup-2026-migration.d.ts.map