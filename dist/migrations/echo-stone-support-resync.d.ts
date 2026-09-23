/**
 * Gate-free GM resync: embedded Echo-Artifact Stone Power Support data.
 *
 * Echo artifact items bake `extraStoneFunctions` (support stages) and their
 * Level Progression rows at creation time. The v0.9.9 four-Rank Stone model
 * changed the Kept from Sight / Elorian Focus support rows, so existing
 * copies keep stale stages and "pay Tier …" text until re-seeded.
 *
 * This resync refreshes, for every embedded artifact whose `echoArtifactKey`
 * matches the catalog:
 *   - `system.extraStoneFunctions` (verbatim from the catalog definition);
 *   - Level Progression rows (and nested `progressionPicks` authored stages)
 *     whose `name` matches a catalog row: type / effect / special only.
 *
 * Custom names and rows without a catalog match are never touched. The pass
 * is idempotent: items are only written when the rebuilt data differs.
 */
/** Resync one actor's embedded echo artifacts. Returns updated item count. */
export declare function resyncActorEchoStoneSupport(actor: any): Promise<number>;
/** World-load GM pass over every actor. Idempotent (diff-checked). */
export declare function runEchoStoneSupportResyncMigration(): Promise<number>;
//# sourceMappingURL=echo-stone-support-resync.d.ts.map