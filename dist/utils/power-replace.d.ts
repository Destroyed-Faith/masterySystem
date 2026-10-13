/**
 * GM power replace — swap one embedded Power for another of the same
 * category and level, preserving XP provenance (starting / GM / purchased).
 */
import type { CastingAttribute, PowerCategory, SpellResolution } from '../types/item.js';
import { type CatalogEntry } from './power-catalog.js';
import { type PowerSpellOptions } from './power-item-builder.js';
export type PowerProvenanceFlags = {
    startingPower?: boolean;
    gmGranted?: boolean;
    xpPurchased?: boolean;
};
export type PowerReplacePlan = {
    category: PowerCategory;
    level: number;
    minLevel: number;
    provenance: PowerProvenanceFlags;
    showInRadialMenu?: boolean;
    itemData: Record<string, unknown>;
};
type PowerItemLike = {
    id?: string;
    name?: string;
    type?: string;
    system?: {
        category?: PowerCategory;
        powerType?: string;
        level?: number;
        minLevel?: number;
        rank?: number;
        showInRadialMenu?: boolean;
        isSpell?: boolean;
        castingAttribute?: CastingAttribute;
        spellResolution?: SpellResolution;
        fromArtifact?: boolean;
        artifactGranted?: boolean;
        echoBound?: boolean;
    };
    flags?: {
        'mastery-system'?: PowerProvenanceFlags & {
            fromArtifact?: boolean;
            artifactGranted?: boolean;
            echoBound?: boolean;
        };
    };
    getFlag?: (scope: string, key: string) => unknown;
};
/** Artifact / Echo-bound powers are not catalog-replaceable. */
export declare function isNonReplaceableGrantedPower(item: PowerItemLike): boolean;
export declare function readPowerProvenanceFlags(item: PowerItemLike): PowerProvenanceFlags;
export declare function powerReplaceLevel(item: PowerItemLike): number;
export declare function powerReplaceMinLevel(item: PowerItemLike, level: number): number;
export declare function describePowerReplaceConstraints(item: PowerItemLike): {
    category: PowerCategory;
    categoryLabel: string;
    level: number;
} | null;
/**
 * Build replacement item data at the same level, copying provenance and
 * sheet toggles. Does not touch XP.
 */
export declare function planPowerReplace(oldItem: PowerItemLike, entry: CatalogEntry, spell?: PowerSpellOptions): PowerReplacePlan | {
    error: string;
};
export type ApplyPowerReplaceResult = {
    ok: true;
    newItemId: string;
    oldName: string;
    newName: string;
    level: number;
    categoryLabel: string;
} | {
    ok: false;
    error: string;
};
/**
 * Delete the old power and create the replacement. Remaps combat-carousel
 * favorites. Never adjusts XP pools.
 */
export declare function applyPowerReplace(actor: Actor, oldItem: PowerItemLike & {
    id: string;
    delete?: () => Promise<unknown>;
}, entry: CatalogEntry, spell: PowerSpellOptions): Promise<ApplyPowerReplaceResult>;
export {};
//# sourceMappingURL=power-replace.d.ts.map