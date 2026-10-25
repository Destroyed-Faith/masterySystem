/**
 * Artifact alignment migration (Artefacts catalogue 2026-10-25 + post-alignment fixes).
 *
 * Strategy:
 *   1. World Item library trees whose `seedVersion` ≠ `ECHO_ARTIFACT_SEED_VERSION`
 *      are rebuilt from the catalog generator (preserves node `_id` / folders /
 *      actorLevels) and pushed to embedded Actor copies (world + unlinked tokens).
 *   2. Actor / unlinked-token Artifact embeds with stale seed **or** broken Dragon
 *      Head Breath progression are listed (and, on apply, content-synced then
 *      stamped to the current seed).
 *
 * Why seed alone is not enough: seed 57 stamped embeds whose Breath rows still
 * said `type: "Artifact Active"`. The combat radial classified that label as
 * passive and hid Damage/Ruin Breath even though dry-run reported wouldUpdate: [].
 *
 * Idempotent: healthy embeds already at the current seed are skipped. Dry-run default.
 * Does not wipe Actor XP, custom names, equipment, or Item IDs.
 *
 * Live worlds: GM must export Actors (Lor-Keth, Alaris, Scurry, Oda) before apply.
 */
export declare const ARTIFACT_ALIGNMENT_MIGRATION_ID = "artifact-alignment-2026-10-25";
export interface ArtifactAlignmentReport {
    migrationId: string;
    dryRun: boolean;
    seedVersion: number;
    scannedActors: number;
    scannedItems: number;
    wouldUpdate: Array<{
        actorId: string;
        itemId: string;
        key: string;
        level: number;
        previousSeed: number;
        reason?: 'seed' | 'breath-content';
    }>;
    libraryRefreshTouched: number;
    notes: string[];
}
/**
 * Scan (and optionally refresh) Artifact embeds so catalogue progression reaches
 * Actors already stamped at an older seed (including seedVersion 56/57) and
 * Dragon Head embeds whose Breath row is still combat-broken.
 */
export declare function runArtifactAlignmentMigration(opts?: {
    dryRun?: boolean;
}): Promise<ArtifactAlignmentReport>;
//# sourceMappingURL=artifact-alignment-2026-10-25.d.ts.map