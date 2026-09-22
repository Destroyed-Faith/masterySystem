/**
 * Prepared weapon sets for the two hand slots, plus the shared Weapon Swap.
 *
 * Only the active set is mechanically equipped (`system.equipped` + slot flag).
 * Sets store item-id references — never duplicated items.
 */
export declare const WEAPON_SWAP_ID = "weapon-swap";
export declare const WEAPON_SETS_FLAG = "weaponSets";
export declare const WEAPON_SETS_SCHEMA = 1;
export type WeaponSetIndex = 1 | 2;
export interface WeaponSetHands {
    mainhand: string | null;
    offhand: string | null;
}
export interface WeaponSetsState {
    schemaVersion: number;
    active: WeaponSetIndex;
    /** Weapons put away. Both sets stay stored; Basic Attack is Unarmed. */
    stowed?: boolean;
    sets: Record<WeaponSetIndex, WeaponSetHands>;
}
export type WeaponSwapTarget = WeaponSetIndex | 'unarmed';
export type SwapWeaponSetResult = {
    ok: true;
    swapped: false;
    active: WeaponSetIndex;
} | {
    ok: true;
    swapped: true;
    active: WeaponSetIndex;
    spentMovement: boolean;
} | {
    ok: false;
    reason: 'busy' | 'permission' | 'no-movement' | 'spend-failed' | 'apply-failed';
};
export declare function emptyWeaponSetsState(): WeaponSetsState;
export declare function isTwoHandedSet(set: WeaponSetHands): boolean;
export declare function weaponSetAssignedIds(state: WeaponSetsState): Set<string>;
export declare function isItemAssignedToWeaponSet(actor: any, itemId: string | null | undefined): boolean;
/** Inactive-set items stay prepared on the character — hidden, not in the carry grid. */
export declare function isWeaponSetPreparedFlags(flags: {
    weaponSetPrepared?: unknown;
} | null | undefined): boolean;
export declare function isWeaponSetPreparedItem(item: any): boolean;
/** True when an item belongs to a weapon set and must not appear in inventory. */
export declare function isHiddenInInactiveWeaponSet(actor: any, item: any): boolean;
export declare function isNaturallyTwoHandedItem(item: any): boolean;
export declare function isVersatileItem(item: any): boolean;
export declare function canMarkTwoHandedGrip(item: any): boolean;
export declare function getItemEquipmentFlags(item: any): Record<string, any>;
export declare function getItemInHandSlot(actor: any, slotKey: 'mainhand' | 'offhand'): any | null;
export declare function readHandsFromEquippedItems(actor: any): WeaponSetHands;
export declare function isInitializedWeaponSets(raw: unknown): raw is WeaponSetsState;
export declare function pruneWeaponSetRefs(state: WeaponSetsState, validIds: Set<string>): WeaponSetsState;
export declare function buildInitialWeaponSets(currentHands: WeaponSetHands): WeaponSetsState;
export declare function resolveSwapTarget(active: WeaponSetIndex, requested?: WeaponSetIndex): WeaponSetIndex | null;
export declare function peekWeaponSets(actor: any): WeaponSetsState;
export declare function persistWeaponSets(actor: any, state: WeaponSetsState): Promise<void>;
export declare function ensureWeaponSets(actor: any): Promise<WeaponSetsState>;
export declare function pruneDeletedWeaponSetRefs(actor: any): Promise<WeaponSetsState | null>;
export declare function syncActiveWeaponSetFromHands(actor: any): Promise<WeaponSetsState>;
export declare function applyWeaponSetHands(actor: any, set: WeaponSetHands): Promise<void>;
/** Short label for one prepared set: weapon names, or empty hands. */
export declare function describeWeaponSetHands(actor: any, hands: WeaponSetHands | null | undefined): string;
export interface WeaponSwapPreview {
    active: WeaponSetIndex;
    next: WeaponSetIndex;
    from: string;
    to: string;
    /** One line for the radial and the sheet tooltip. */
    line: string;
}
/** What Weapon Swap will do with the sets as they are stored right now. */
export declare function describeWeaponSwap(actor: any): WeaponSwapPreview;
export interface WeaponSwapChoice {
    target: WeaponSwapTarget;
    /** Roman numeral or Fists, for the sheet button. */
    shortLabel: string;
    summary: string;
    /** Full radial title. */
    name: string;
    description: string;
    active: boolean;
}
/**
 * Filled sets, then Fists. An empty set is not a button — if Set II is empty
 * the card offers the worn set and Fists, not an empty Set II as well.
 * Fists stays on the card whenever another set still has a weapon.
 */
export declare function listWeaponSwapChoices(actor: any): WeaponSwapChoice[];
/**
 * Sheet / paperdoll: only real Weapon Sets. Unarmed is not a slot you can
 * fill — it stays on the radial menu (and as empty-hand labeling).
 */
export declare function listEquipmentWeaponSetChoices(actor: any): WeaponSwapChoice[];
export interface ActiveWeaponProfile {
    unarmed: boolean;
    name: string;
    damage: string;
    attackType: 'melee' | 'ranged';
    /** Radial range. Ranged must be > 4 so the targeting flow treats it as ranged. */
    rangeM: number;
    summary: string;
}
/**
 * What Basic Attack rolls right now: the active set's main-hand weapon, or
 * Unarmed 1d8 when that set is empty.
 */
export declare function describeActiveWeaponProfile(actor: any): ActiveWeaponProfile;
/**
 * Shared Weapon Swap. Sheet buttons and the radial pass a target:
 * set 1, set 2, or `unarmed` (stow both sets and fight with fists).
 * `target` omitted = toggle to the other set.
 */
export declare function swapWeaponSet(actor: any, target?: WeaponSwapTarget, options?: {
    quiet?: boolean;
}): Promise<SwapWeaponSetResult>;
/** Test helper — do not use from production UI. */
export declare function resetWeaponSetLocks(): void;
//# sourceMappingURL=weapon-sets.d.ts.map