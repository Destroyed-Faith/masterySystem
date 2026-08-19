/**
 * Ammunition and quivers for bows / crossbows.
 *
 * Loose stacks live in the inventory grid. Loaded shots live as a count on
 * the quiver — not as nested container items. Only the quiver in the active
 * weapon set can feed an attack.
 */
export declare const DEFAULT_AMMO_STACK = 24;
export declare const DEFAULT_QUIVER_CAPACITY = 24;
export type AmmunitionType = string;
export type AmmunitionAttackReason = 'compatible-quiver-required' | 'empty-quiver' | 'not-enough-ammunition';
export type HandEquipReason = 'invalid-hand-combination' | 'incompatible-ammunition' | 'slot-occupied';
export declare function normalizeAmmunitionType(value: unknown): AmmunitionType;
export declare function catalogAmmunitionType(item: any): AmmunitionType;
/** Runtime: structured fields only. Catalog names are used solely during migration. */
export declare function requiresAmmunition(item: any): boolean;
export declare function isAmmunitionItem(item: any): boolean;
export declare function isAmmoContainer(item: any): boolean;
export declare function getAmmunitionType(item: any): AmmunitionType;
export declare function ammunitionTypesMatch(a: any, b: any): boolean;
export declare function getAmmoMaxStack(item: any): number;
export declare function getAmmoQuantity(item: any): number;
export declare function getQuiverCapacity(item: any): number;
export declare function getQuiverCurrent(item: any): number;
export declare function getQuiverFreeSpace(item: any): number;
export declare function formatAmmunitionDisplay(current: number, capacity: number): string;
export declare function quiverAmmunitionLabel(item: any): string;
export declare function keepsInventoryGridWhenEquipped(item: any): boolean;
export declare function occupiesInventoryGridWhileEquipped(flags: {
    slot?: unknown;
    keepInventoryGrid?: unknown;
} | null | undefined): boolean;
export declare function isAmmoContainerEffectActive(actor: any, item: any): boolean;
export declare function getItemInHandSlotLocal(actor: any, slotKey: 'mainhand' | 'offhand'): any | null;
export declare function getActiveAmmoPair(actor: any): {
    weapon: any;
    quiver: any;
} | null;
export declare function findEquippedAmmunitionWeapon(actor: any): any | null;
export declare function planAmmunitionStackSplit(quantity: number, maxStack: number): number[];
export declare function planQuiverLoad(current: number, capacity: number, available: number): {
    moved: number;
    remaining: number;
    nextCurrent: number;
};
export declare function countAmmunitionShotsForOption(option: any): number;
export declare function attackUsesAmmunitionWeapon(actor: any, option: any): boolean;
export declare function evaluateAmmunitionAttack(actor: any, shots?: number): {
    ok: true;
    weapon: any;
    quiver: any;
} | {
    ok: false;
    reason: AmmunitionAttackReason;
};
export declare function ammunitionAttackMessage(reason: AmmunitionAttackReason): string;
export declare function warnAmmunitionAttack(reason: AmmunitionAttackReason): void;
export declare function gateAmmunitionAttack(actor: any, option: any): boolean;
export declare function consumeAmmunitionForAttack(actor: any, shots?: number): Promise<{
    ok: true;
    remaining: number;
} | {
    ok: false;
    reason: AmmunitionAttackReason;
}>;
export declare function refundAmmunitionForAttack(actor: any, shots?: number): Promise<void>;
export declare function validateHandEquip(actor: any, item: any, slot: 'mainhand' | 'offhand'): {
    ok: true;
} | {
    ok: false;
    reason: HandEquipReason;
    message: string;
};
export declare function loadAmmunitionIntoContainer(actor: any, ammo: any, quiver: any): Promise<{
    ok: boolean;
    moved: number;
    remaining: number;
    reason?: string;
}>;
export declare function findAmmoContainerFromDropPath(actor: any, path: Iterable<any>): any | null;
export declare function migrateItemAmmunitionFields(item: any): Record<string, unknown> | null;
export declare function normalizeAmmoWeaponSetHands(actor: any, hands: {
    mainhand: string | null;
    offhand: string | null;
}): {
    mainhand: string | null;
    offhand: string | null;
};
export declare function migrateActorAmmunition(actor: any): Promise<void>;
/** Test helper — do not use from production UI. */
export declare function resetAmmunitionLocks(): void;
//# sourceMappingURL=ammunition.d.ts.map