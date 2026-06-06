/**
 * One-shot GM migration: legacy single-key `elvenStride` embedded items → one of the
 * four lineage-specific echo artifacts (Fire / Earth / Water / Air).
 *
 * Lineage is resolved from the item's stamped `system.elementalLineage`, else the
 * actor's `system.echo.subChoiceKey` from the old racial sub-choice, else Fire.
 * Evolution progress (current node) is preserved by remapping `elvenStride-lN` →
 * `elvenStride{Lineage}-lN` on the already-seeded world library.
 */
/** Migrate legacy `elvenStride` actor copies to a lineage-specific tree. */
export declare function runElvenStrideLineageMigration(actors: any[]): Promise<void>;
//# sourceMappingURL=elven-stride-lineage-migration.d.ts.map