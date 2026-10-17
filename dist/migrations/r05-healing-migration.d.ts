/**
 * R-05 actor migration: ordinary HP-heal powers → Scarred-Bar Restoration / Passive Regeneration.
 *
 *   active-melee-single-heal  → active-melee-health-level-heal   (same PL when legal)
 *   active-ranged-single-heal → active-ranged-health-level-heal
 *   active-melee-aoe-heal     → active-melee-aoe-restoration
 *   active-ranged-aoe-heal    → active-ranged-aoe-restoration
 *   passive-healing / "Passive: Healing" → passive-regeneration (same PL)
 *   ab-healing / ab-healing-aura / ab-temp-hp-healing → flagged retired (cannot activate)
 *   healing-themed retired passives (Blood Feast, Battle Trance, …) → flagged retired
 *
 * "Legal" = the Restoration template has a Scarred-bar pool at that PL (PL1 melee/ranged ST and
 * some low AoE levels have none). Illegal conversions are NOT forced: the item keeps its data and
 * is flagged `r05Retired` with `r05MigrationNote` so a GM/player can re-buy at a legal level.
 *
 * Idempotent: converted items carry the new template id, flagged items carry the flag, so a
 * second run writes nothing. Pure planning (`planR05HealingItem`) is separated from the
 * Foundry writes so it can be unit-tested.
 */
export declare const R05_RETIRED_FLAG = "r05Retired";
export declare const R05_MIGRATION_NOTE_FLAG = "r05MigrationNote";
/** Healing-themed passive templates retired by R-05 (ordinary HP / heal riders). */
export declare const R05_RETIRED_HEALING_PASSIVE_IDS: Set<string>;
export type R05ItemPlan = {
    kind: 'none';
} | {
    kind: 'restoration';
    fromTemplateId: string;
    templateId: string;
    templateName: string;
    rank: number;
    /** Set when the item still carries the old catalog name and should take the new one. */
    rename: string | null;
} | {
    kind: 'regeneration';
    fromTemplateId: string;
    rank: number;
    rename: string | null;
} | {
    kind: 'retire';
    reason: string;
};
/** True when a prior migration (or the GM) retired this item under R-05. */
export declare function isR05RetiredHealingPower(item: any): boolean;
/** Restoration pool at this rank (0 = no legal version). */
export declare function restorationPoolAtRank(templateId: string, rank: number): number;
/** Decide what (if anything) to do to one owned power/passive item. Pure. */
export declare function planR05HealingItem(item: any): R05ItemPlan;
export interface R05HealingMigrationSummary {
    restoration: number;
    regeneration: number;
    retired: number;
}
/** Migrate every power / passive item on the given actors. GM only. */
export declare function runR05HealingMigration(actors: any[]): Promise<R05HealingMigrationSummary>;
//# sourceMappingURL=r05-healing-migration.d.ts.map