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
    sets: Record<WeaponSetIndex, WeaponSetHands>;
}
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
/**
 * Shared Weapon Swap. Used by the [1]/[2] sheet switches and the movement action.
 * `target` omitted = toggle to the inactive set.
 */
export declare function swapWeaponSet(actor: any, target?: WeaponSetIndex): Promise<SwapWeaponSetResult>;
/** Test helper — do not use from production UI. */
export declare function resetWeaponSetLocks(): void;
//# sourceMappingURL=weapon-sets.d.ts.map