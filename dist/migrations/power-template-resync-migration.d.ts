/**
 * One-shot GM migration: re-sync embedded Active / Active-Buff power items to
 * their current templates.
 *
 * Background: the big Actives.md / Active Buffs.md audit (explicit md-derived
 * damage anchors, special curves, healing, ranges, radii, etc.) only changed
 * the *templates*. Power items bake their `levels` table at creation time, so
 * characters that owned these powers before the audit shipped still carry the
 * old solver-derived values (e.g. Damage Single showing the wrong damage dice
 * per level). This migration refreshes those baked tables from the canonical
 * templates while preserving each item's rank, chosen Special and Spell flags.
 */
export declare function registerPowerTemplateResyncMigrationSetting(): void;
/** Resync every template-backed Active / Active-Buff power from its template. */
export declare function runPowerTemplateResyncMigration(): Promise<void>;
//# sourceMappingURL=power-template-resync-migration.d.ts.map