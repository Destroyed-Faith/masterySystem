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
/** Build the full item data object for `actor.createEmbeddedDocuments`. */
export declare function buildPowerItemFromCatalogEntry(entry: CatalogEntry, rank: number, spell?: PowerSpellOptions): Record<string, unknown> | null;
export declare function resolveGrantSpecEntry(spec: PowerGrantSpec): CatalogEntry | null;
/** Batch-create power items from grant specs. Skips duplicates already on actor. */
export declare function grantPowerSpecs(actor: Actor, specs: PowerGrantSpec[]): Promise<number>;
//# sourceMappingURL=power-item-builder.d.ts.map