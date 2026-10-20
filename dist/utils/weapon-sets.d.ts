/**
 * Prepared weapon sets for the hand slots, plus the shared Weapon Swap.
 *
 * Default: two slots (I / II). GM may add more (III…). Switching is always free
 * (sheet + combat) so forgotten loadouts can be fixed mid-fight.
 *
 * Only the active set is mechanically equipped (`system.equipped` + slot flag).
 * Sets store item-id references — never duplicated items.
 */
export declare const WEAPON_SWAP_ID = "weapon-swap";
export declare const WEAPON_SETS_FLAG = "weaponSets";
export declare const WEAPON_SETS_SCHEMA = 1;
/** Always at least two prepared Weaponslots. */
export declare const DEFAULT_WEAPON_SET_COUNT = 2;
/** Soft cap so the paperdoll row stays usable. */
export declare const MAX_WEAPON_SET_COUNT = 8;
/** 1-based slot index (I = 1, II = 2, …). */
export type WeaponSetIndex = number;
export interface WeaponSetHands {
    mainhand: string | null;
    offhand: string | null;
}
export interface WeaponSetsState {
    schemaVersion: number;
    active: WeaponSetIndex;
    /** Weapons put away. All sets stay stored; Basic Attack is Unarmed. */
    stowed?: boolean;
    /** Number of prepared slots (≥ 2). Extra slots are GM-added. */
    count?: number;
    sets: Record<number, WeaponSetHands>;
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
    reason: 'busy' | 'permission' | 'apply-failed';
};
export declare function emptyWeaponSetsState(): WeaponSetsState;
export declare function weaponSetRoman(index: number): string;
export declare function weaponSetCount(state: WeaponSetsState | null | undefined): number;
export declare function listWeaponSetIndexes(state: WeaponSetsState): WeaponSetIndex[];
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
/** Normalize count/active and ensure every slot 1..count exists. */
export declare function normalizeWeaponSetsState(state: WeaponSetsState): WeaponSetsState;
export declare function pruneWeaponSetRefs(state: WeaponSetsState, validIds: Set<string>): WeaponSetsState;
export declare function buildInitialWeaponSets(currentHands: WeaponSetHands): WeaponSetsState;
export declare function resolveSwapTarget(active: WeaponSetIndex, requested?: WeaponSetIndex, count?: number): WeaponSetIndex | null;
export declare function peekWeaponSets(actor: any): WeaponSetsState;
export declare function persistWeaponSets(actor: any, state: WeaponSetsState): Promise<void>;
export declare function ensureWeaponSets(actor: any): Promise<WeaponSetsState>;
export declare function pruneDeletedWeaponSetRefs(actor: any): Promise<WeaponSetsState | null>;
/** GM: append one empty Weaponslot (III, IV, …). */
export declare function addWeaponSetSlot(actor: any): Promise<WeaponSetsState | null>;
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
 * Radial / chat: every prepared Weaponslot (even empty), then Fists.
 * Empty slots stay visible so you can switch onto them and equip mid-fight.
 */
export declare function listWeaponSwapChoices(actor: any): WeaponSwapChoice[];
/**
 * Sheet / paperdoll: every prepared Weaponslot (I, II, …), including empty ones.
 * Unarmed is not a paperdoll slot — it stays on the radial menu.
 */
export declare function listEquipmentWeaponSetChoices(actor: any): WeaponSwapChoice[];
export declare function parseWeaponSwapTarget(raw: string | number | null | undefined): WeaponSwapTarget | null;
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
 * set index (1..N) or `unarmed` (stow all sets and fight with fists).
 * `target` omitted = cycle to the next prepared slot.
 * Always free (in or out of combat) so loadouts can be fixed anytime.
 */
export declare function swapWeaponSet(actor: any, target?: WeaponSwapTarget, options?: {
    quiet?: boolean;
}): Promise<SwapWeaponSetResult>;
/** Test helper — do not use from production UI. */
export declare function resetWeaponSetLocks(): void;
//# sourceMappingURL=weapon-sets.d.ts.map