/**
 * One-shot GM migration: remove duplicate Echo-bound artifact copies on actors.
 *
 * Keeps the best wired/slotted copy per echoArtifactKey and re-equips orphans.
 */
export declare function registerEchoArtifactDedupeMigrationSetting(): void;
export declare function runEchoArtifactDedupeMigration(): Promise<void>;
//# sourceMappingURL=echo-artifact-dedupe-migration.d.ts.map