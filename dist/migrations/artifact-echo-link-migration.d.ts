/**
 * One-shot GM migration: MR1 characters with auto-linked Echo artifacts → inactive.
 *
 * Before v0.9.22, `grantEchoArtifactTreeToActor` wrote `linked: true` on grant.
 * Echo artifacts should stay equipped but inactive until the player spends
 * 1 Stone at MR2+. Characters already at MR2+ are left unchanged.
 */
export declare function registerArtifactEchoLinkMigrationSetting(): void;
/** Reset `linked: true` → `false` on world roots for MR1 actors only. */
export declare function runArtifactEchoLinkMigration(): Promise<void>;
//# sourceMappingURL=artifact-echo-link-migration.d.ts.map