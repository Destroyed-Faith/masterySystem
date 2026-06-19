/**
 * Self-healing GM migration: re-sync embedded, template-backed power items to
 * their current catalog templates.
 *
 * Background: the Actives.md / Active Buffs.md audit (explicit md-derived damage
 * anchors, special curves, healing, ranges, radii, etc.) only changed the
 * *templates*. Power items bake their `levels` table at creation time, so any
 * character that owned a power before a template change still carries the old
 * baked values (e.g. Active Buff: Damage showing +1d8/+2d8/+3d8… instead of
 * +3d8/+5d8/…/+33d8).
 *
 * This migration refreshes those baked tables from the canonical templates while
 * preserving each item's rank, chosen Special and Spell flags. It is:
 *   - gate-free: it runs on every world load (GM only) so a later template tweak
 *     always reaches existing characters — no one-shot setting to get stuck on;
 *   - idempotent: an item is only written when its rebuilt `levels` differ from
 *     what is already stored, so steady-state loads do no writes;
 *   - resilient: templates are matched by `templateId`, then by `templateName`,
 *     then by the catalog display `name` (e.g. "Active Buff: Damage"), so legacy
 *     items created before id/name stamping are still caught.
 *
 * A manual trigger is exposed as `game.masterySystem.resyncPowers()`.
 */
export declare function registerPowerTemplateResyncMigrationSetting(): void;
/**
 * Resync every template-backed power item from its current template.
 * @param options.force ignore the diff check and rewrite every matched item.
 * @returns number of power items updated.
 */
export declare function runPowerTemplateResyncMigration(options?: {
    force?: boolean;
    notify?: boolean;
}): Promise<number>;
//# sourceMappingURL=power-template-resync-migration.d.ts.map