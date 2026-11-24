/**
 * Rules v0.9.9.6 world migration (GM, once per world, chat report).
 *
 * Runs on GM world load after the Actives v0.9.9.6 dry run and before the
 * gate-free template resync, so every value change is reported with its old
 * value. Every written document keeps a backup in
 * `flags.mastery-system.v0996WorldBackup`; `rollbackV0996WorldActor` restores it.
 *
 *   1. Power items whose template changed outside the Actives review
 *      (e.g. Reaction: Reposition, Mental Control, Protective Auras): re-baked
 *      from the current template; "Reaction: Reactive Cleanse" default names
 *      become "Reaction: Cleanse". Actives held for the Actives v0.9.9.6
 *      review are only counted.
 *   2. Artifact trees changed by v0.9.9.6 (Dragon Head, Elorian Stride,
 *      Ringchain of Kept Names, Hunter's Scourge, Frostbound Returning Axe,
 *      Lor-Keth's Titanstorm Staff): library refreshed and pushed to linked
 *      actor copies; unlinked copies are listed only.
 *   3. NPC Basic Evade / Guard Reaction rows (no longer a rule) are removed.
 *   4. Last Breath: when the flag is set and an Attribute Stone is Burned,
 *      convert 1 Burned → Sealed of that Attribute (identical Rest return).
 *   5. Unprinted catalogue Powers still owned: mark Retired (v0.9.9.6); they
 *      cannot be used; the GM chat report lists them for a free same-type swap.
 *
 * Nothing is merged, refunded or deleted except inert NPC Basic Evade/Guard rows.
 * Idempotent: the world state is set to `applied`; per-document markers skip
 * already migrated documents.
 */
export declare const V0996_WORLD_STATE_KEY = "v0996WorldMigrationState";
/** Second pass for worlds that already applied the first v0.9.9.6 migration. */
export declare const V0996_DELTA_B_STATE_KEY = "v0996DeltaBMigrationState";
export declare const V0996_WORLD_BACKUP_FLAG = "v0996WorldBackup";
export declare const V0996_WORLD_MIGRATED_FLAG = "v0996WorldMigrated";
export declare const V0996_LAST_BREATH_CONVERTED_FLAG = "v0996LastBreathConverted";
/** Artifact library keys whose generator output changed in v0.9.9.6. */
export declare const V0996_CHANGED_ARTIFACT_KEYS: readonly ["dragonHead", "elorianStride", "ringchainOfKeptNames", "huntersScourge", "frostboundReturningAxe", "lorKethsStaff"];
export interface V0996WorldPowerChange {
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    templateId: string;
    rank: number;
    rename: string | null;
    before: string;
    after: string;
}
export interface V0996WorldArtifactRow {
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    key: string;
    linked: boolean;
}
export interface V0996WorldNpcEvadeRow {
    actorName: string;
    actorUuid: string;
    removed: number;
}
export interface V0996WorldInfoRow {
    actorName: string;
    actorUuid: string;
    note: string;
}
export interface V0996WorldRetiredRow {
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    templateId: string;
    rank: number;
    category: string;
}
export interface V0996WorldLastBreathConvertRow {
    actorName: string;
    actorUuid: string;
    attribute: string | null;
    note: string;
}
export interface V0996WorldReport {
    generatedAt: string;
    powers: V0996WorldPowerChange[];
    heldForActivesReview: number;
    artifactTrees: string[];
    artifacts: V0996WorldArtifactRow[];
    npcEvade: V0996WorldNpcEvadeRow[];
    lastBreath: V0996WorldLastBreathConvertRow[];
    retired: V0996WorldRetiredRow[];
}
export declare function getV0996WorldMigrationState(g?: any): string;
export declare function getV0996DeltaBMigrationState(g?: any): string;
export declare function registerV0996WorldMigrationSetting(): void;
/** Owned template-backed Powers that are not printed in the v0.9.9.6 catalogues. */
export declare function isUnprintedV0996CatalogueTemplate(templateId: string, category: string): boolean;
/** Power items whose stored values or default name differ from v0.9.9.6. */
export declare function planV0996WorldPowers(actor: any): {
    changes: V0996WorldPowerChange[];
    held: number;
};
/** Actor-owned copies of the changed Artifact trees. */
export declare function planV0996WorldArtifacts(actor: any): V0996WorldArtifactRow[];
/** Stored NPC Basic Evade / Guard rows (top level + every phase). */
export declare function planV0996WorldNpcEvade(actor: any): V0996WorldNpcEvadeRow | null;
/** Actors with Last Breath used and a Burned Attribute Stone to convert → Sealed. */
export declare function planV0996WorldLastBreath(actor: any): V0996WorldLastBreathConvertRow | null;
/** Owned unprinted Reactions / Active Buffs / Passives still usable before retirement. */
export declare function planV0996WorldRetired(actor: any): V0996WorldRetiredRow[];
export declare function buildV0996WorldReport(g?: any): V0996WorldReport;
/** Delta B: Guard rows, Last Breath convert, unprinted retirement (no Power re-bake). */
export declare function buildV0996DeltaBReport(g?: any): V0996WorldReport;
export interface V0996WorldApplySummary {
    powers: number;
    artifactNodes: number;
    artifactCopies: number;
    npcEvadeRows: number;
    lastBreathConverted: number;
    retired: number;
    failed: number;
}
export declare function applyV0996WorldReport(report: V0996WorldReport, g?: any): Promise<V0996WorldApplySummary>;
export declare function applyV0996DeltaBReport(report: V0996WorldReport, g?: any): Promise<V0996WorldApplySummary>;
/**
 * Restore one actor from its v0.9.9.6 world backups (Power items, Artifact
 * copies, NPC Reaction rows) and clear the markers.
 */
export declare function rollbackV0996WorldActor(actor: any): Promise<number>;
export declare function formatV0996WorldReportHtml(report: V0996WorldReport, summary: V0996WorldApplySummary | null): string;
/** GM world load: plan, apply once, whisper the report to the GM(s). */
export declare function runV0996WorldMigrationOnReady(g?: any): Promise<V0996WorldReport | null>;
/** Second pass for worlds that already applied the first migration (Guard / Last Breath / C2). */
export declare function runV0996DeltaBOnReady(g?: any): Promise<V0996WorldReport | null>;
//# sourceMappingURL=v0996-world-migration.d.ts.map