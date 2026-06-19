/**
 * One-shot GM migration: re-sync embedded, template-backed power items to their
 * current templates.
 *
 * Background: the big Actives.md / Active Buffs.md audit (explicit md-derived
 * damage anchors, special curves, healing, ranges, radii, etc.) only changed
 * the *templates*. Power items bake their `levels` table at creation time, so
 * characters that owned these powers before the audit shipped still carry the
 * old solver-derived values (e.g. Active Buff: Damage showing +1d8/+2d8/+3d8…
 * instead of +3d8/+5d8/…/+33d8). This migration refreshes those baked tables
 * from the canonical templates while preserving each item's rank, chosen
 * Special and Spell flags. Templates are matched by `templateId` with a stable
 * `templateName` fallback so legacy items without a stored id are still caught.
 */
export declare function registerPowerTemplateResyncMigrationSetting(): void;
/** Resync every template-backed power item from its current template. */
export declare function runPowerTemplateResyncMigration(): Promise<void>;
//# sourceMappingURL=power-template-resync-migration.d.ts.map