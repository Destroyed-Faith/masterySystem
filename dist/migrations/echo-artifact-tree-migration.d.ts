/**
 * Echo Artifact → Builder-Tree migration (one-shot, GM-only, guarded).
 *
 * Earlier worlds granted Echo Artifacts as a single embedded `artifact` item
 * (flagged `echoBound` / `echoArtifactKey`, no evolution wiring). The new model
 * hands out the *root* of a seeded 10-level Builder-Tree instead, wired through
 * `evolutionRootItemId` / `evolutionNodeId` so the artifact can be evolved.
 *
 * This migration upgrades every legacy single-item Echo Artifact on every actor
 * to a tree-linked grant, then removes the legacy item. It is:
 *   • GM-only and idempotent (gated by a world setting),
 *   • dependent on the Echo Artifact library already being seeded (seeding runs
 *     earlier in the same `ready` hook), and
 *   • non-destructive on failure — the legacy item is only deleted after a
 *     successful tree grant.
 */
export declare function registerEchoArtifactTreeMigrationSetting(): void;
/** Execute the one-shot Echo Artifact tree migration. Idempotent per world. */
export declare function runEchoArtifactTreeMigration(): Promise<void>;
//# sourceMappingURL=echo-artifact-tree-migration.d.ts.map