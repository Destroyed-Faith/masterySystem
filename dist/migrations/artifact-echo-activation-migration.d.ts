/**
 * One-shot GM migration (v0.9.23): Echo artifact activation flags + stale embed sync.
 *
 * • Sets `artifactActivated` on embedded echo items (false unless already true).
 * • Clears legacy auto-`linked: true` on world roots for echo artifacts.
 * • Syncs embedded copies missing baseValues / levelProgression from world tree.
 */
export declare function registerArtifactEchoActivationMigrationSetting(): void;
export declare function runArtifactEchoActivationMigration(): Promise<void>;
//# sourceMappingURL=artifact-echo-activation-migration.d.ts.map