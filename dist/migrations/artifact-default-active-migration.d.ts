/**
 * One-shot GM migration: artifacts start active at Level 1; leftover
 * Link-Stone reservation flags are cleared.
 *
 * Older grants / echo-activation migrations stamped `artifactActivated: false`
 * and sometimes `artifactActivationStoneAttr`. Attunement no longer reserves a
 * Stone, and Level 1 is free — so existing worlds should wake those items up.
 * Players can still deactivate an artifact afterwards as an exception.
 */
export declare function registerArtifactDefaultActiveMigrationSetting(): void;
export declare function runArtifactDefaultActiveMigration(): Promise<void>;
//# sourceMappingURL=artifact-default-active-migration.d.ts.map