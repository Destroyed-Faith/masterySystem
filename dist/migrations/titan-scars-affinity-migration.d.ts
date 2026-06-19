/**
 * One-shot GM migration: legacy single-key `titanScars` embedded items → one of
 * the seven Attribute-affinity Titan Scars variants (Might / Agility / Vitality /
 * Intellect / Resolve / Influence / Wits).
 *
 * The Titan Scars body artifact now lets the player bind its Stone Pool to any of
 * the 7 Attributes at creation (chosen via the Titanborn `subChoices`). Legacy
 * characters carry the old fixed-Might artifact under the `titanScars` key. This
 * migration:
 *   1. Resolves the affinity from the actor's `system.echo.subChoiceKey` (an
 *      Attribute key), else defaults to `might` (the old fixed pool).
 *   2. Remaps the embedded item to the matching variant tree, preserving the
 *      current evolution node (`titanScars-lN` → `titanScars{Attr}-lN`).
 *   3. Backfills an empty `system.echo.subChoiceKey` to the resolved Attribute so
 *      the creation picker / validation stay consistent.
 */
/** Migrate legacy `titanScars` actor copies to an Attribute-affinity tree. */
export declare function runTitanScarsAffinityMigration(actors: any[]): Promise<void>;
//# sourceMappingURL=titan-scars-affinity-migration.d.ts.map