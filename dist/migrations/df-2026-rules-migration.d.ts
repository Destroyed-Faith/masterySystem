/**
 * DF 2026-10-23 actor schema migration.
 *
 * - Idempotent via `system.progression.rulesSchemaVersion === 2026.10.23`
 * - Backs up legacy Skills / Minor Expressions / Echo Cards / Social Combat /
 *   Death flags into `flags.mastery-system.legacySnapshot` before clearing
 *   active hooks.
 * - Does NOT invent Specialization Ranks or Imprint selections for advanced PCs.
 */
export declare const DF_2026_LEGACY_SNAPSHOT_FLAG = "legacySnapshot";
export interface Df2026MigrationSummary {
    actorId: string;
    actorName: string;
    changed: boolean;
    alreadyMigrated: boolean;
    archived: string[];
    warnings: string[];
}
/** Exact Minor Expression → Echo Imprint ID mappings when semantics align. */
export declare const MINOR_EXPRESSION_TO_IMPRINT: Record<string, string>;
export declare function planDf2026ActorMigration(actor: any): {
    update: Record<string, unknown> | null;
    summary: Df2026MigrationSummary;
};
export declare function runDf2026RulesMigration(actors: any[], opts?: {
    dryRun?: boolean;
}): Promise<Df2026MigrationSummary[]>;
//# sourceMappingURL=df-2026-rules-migration.d.ts.map