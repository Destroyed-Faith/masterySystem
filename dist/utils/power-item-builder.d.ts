/**
 * Shared utilities for building embedded power Items from catalog entries.
 */
import type { CastingAttribute, SpellResolution } from '../types/item.js';
import { type CatalogEntry } from './power-catalog.js';
export type { CatalogEntry };
export interface PowerGrantSpec {
    templateId: string;
    special?: string | null;
    rank: number;
    isSpell?: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}
export interface PowerSpellOptions {
    isSpell: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}
/**
 * Short sheet name for a newly created power Item.
 * Catalog / rules identity stays on `entry.name` and `templateId`; only the
 * player-editable Item.name uses this (existing items are not renamed).
 *
 * Examples:
 *   Passive: Restoration → Restoration
 *   Melee Single Target Special — Ruin → Melee Single Target Special: Ruin
 *   Ranged AoE Special — Slow → Ranged AoE Special: Slow
 *   Ranged Damage — Tier 6 — Hex (legacy) → Ranged Hex
 *   Melee Single Attack → Melee Attack
 */
export declare function defaultPowerItemDisplayName(entry: CatalogEntry): string;
/**
 * Level rows of a catalog entry bound to its chosen Special (rank, radius and
 * effect text as printed for that Special). Used by item creation and by the
 * picker preview so both show the same values.
 */
export declare function catalogEntryBoundLevels(entry: CatalogEntry): Record<string, unknown>;
/** Build the full item data object for `actor.createEmbeddedDocuments`. */
export declare function buildPowerItemFromCatalogEntry(entry: CatalogEntry, rank: number, spell?: PowerSpellOptions): Record<string, unknown> | null;
export declare function resolveGrantSpecEntry(spec: PowerGrantSpec): CatalogEntry | null;
/** Batch-create power items from grant specs. Skips duplicates already on actor. */
export declare function grantPowerSpecs(actor: Actor, specs: PowerGrantSpec[]): Promise<number>;
//# sourceMappingURL=power-item-builder.d.ts.map