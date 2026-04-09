/**
 * Artifact evolution tree: root discovery, depth, locked profile fields for descendants.
 * Used by Node Editor, Embedded Power Dialog, and Artifact Builder sync.
 */
import type { ArtifactKind, ArtifactWeaponProfile, ArtifactWeaponSpecialRef } from '../types/item.js';
/** Minimal item shape for lineage (Foundry Item satisfies this). */
export interface LineageItemLike {
    id: string;
    getFlag(scope: string, key: string): unknown;
    system: unknown;
}
export declare function buildArtifactNodeIdMap(items: LineageItemLike[]): Map<string, LineageItemLike>;
/** Ancestors from root down to immediate parent (excludes `item`). */
export declare function getAncestorChainRootFirst(item: LineageItemLike, nodeIdMap: Map<string, LineageItemLike>): LineageItemLike[];
export declare function findRootItem(item: LineageItemLike, nodeIdMap: Map<string, LineageItemLike>): LineageItemLike;
/** Tree depth: root = 1, child of root = 2, … */
export declare function getTreeDepth(item: LineageItemLike, nodeIdMap: Map<string, LineageItemLike>): number;
export declare function isLineageRootItem(item: LineageItemLike): boolean;
export declare function getLockedWeaponBasics(rootSystem: any): {
    artifactKind: ArtifactKind;
    gearSlot: string;
    weaponType: 'melee' | 'ranged';
    hands: number;
};
/** Ordered union of innates from root → parent along `ancestors`. */
export declare function mergeInnatesFromAncestors(ancestors: LineageItemLike[]): {
    ordered: string[];
    set: Set<string>;
};
export declare function specialRefKey(ref: ArtifactWeaponSpecialRef): string;
/** Ordered union of weapon specials from ancestors (root → parent). */
export declare function mergeSpecialRefsFromAncestors(ancestors: LineageItemLike[]): {
    ordered: ArtifactWeaponSpecialRef[];
    keySet: Set<string>;
};
/** All embedded power `id`s appearing on any ancestor item (root → parent). */
export declare function getMergedAncestorPowerIds(ancestors: LineageItemLike[]): Set<string>;
/** Non-root: ancestor power id union + tree depth (extra capacity per tier). Root: unlimited. */
export declare function getMaxTotalEmbeddedPowers(isRoot: boolean, depth: number, ancestorUniquePowerIdCount: number): number;
/**
 * Merge parent weapon into child: lock type/hands from parent; **damage/range from parent** (propagate down the tree);
 * innates/specials = locked (from full ancestor chain) then child-only extras.
 */
export declare function mergeArtifactWeaponForChildSync(parentWeapon: ArtifactWeaponProfile, childWeapon: ArtifactWeaponProfile, lockedInnateOrdered: string[], lockedInnateSet: Set<string>, lockedSpecialOrdered: ArtifactWeaponSpecialRef[], lockedSpecialKeySet: Set<string>): ArtifactWeaponProfile;
/** Merge armor: keep child's numeric fields; sync `type` from parent. */
export declare function mergeArtifactArmorForChildSync(parentArmor: any, childArmor: any): any;
export declare function mergeArtifactShieldForChildSync(parentShield: any, childShield: any): any;
/**
 * Child powers = parent's list (canonical order) plus child-only extras (ids not in parent).
 */
export declare function mergePowersParentToChild(parentPowers: unknown[], childPowers: unknown[]): unknown[];
//# sourceMappingURL=artifact-tree-lineage.d.ts.map