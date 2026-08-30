/**
 * Consumable Slots — Mastery Rank equipment slots for consumable gear
 * (including Minor Magic Items). Slot occupancy lives on the item's
 * existing `flags.mastery-system.equipment` object. Slot count is derived
 * from the actor's current Mastery Rank (no parallel inventory).
 */
import { type MinorMagicSnapshot } from './minor-magic-items.js';
export declare const CONSUMABLE_SLOT_FLAG = "consumableSlot";
export declare const CONSUMABLE_I18N_KEYS: readonly ["MASTERY.consumable.title", "MASTERY.consumable.slotLabel", "MASTERY.consumable.empty", "MASTERY.consumable.lockedInCombat", "MASTERY.consumable.notConsumable", "MASTERY.consumable.slotUnavailable", "MASTERY.consumable.slotOccupied", "MASTERY.consumable.missingItem", "MASTERY.consumable.notEquipped", "MASTERY.consumable.noAttackAction", "MASTERY.consumable.useFailed", "MASTERY.consumable.rankUnequipped", "MASTERY.consumable.attackActions", "MASTERY.consumable.use", "MASTERY.consumable.badge", "MASTERY.consumable.printFootnote", "MASTERY.consumable.powerLabel"];
export declare function localizeConsumable(key: string, fallback: string): string;
export declare function consumableSlotCount(masteryRank: number): number;
export declare function actorConsumableSlotCount(actor: {
    system?: {
        mastery?: {
            rank?: unknown;
        };
    };
}): number;
export declare function isConsumableItem(item: {
    type?: string;
    system?: {
        consumable?: unknown;
    };
    getFlag?: (scope: string, key: string) => unknown;
    flags?: Record<string, Record<string, unknown>>;
} | null | undefined): boolean;
export declare function readConsumableSlotIndex(item: {
    getFlag?: (scope: string, key: string) => unknown;
    flags?: Record<string, Record<string, unknown>>;
}): number | null;
export declare function equipmentFlagsWithConsumableSlot(current: Record<string, unknown> | null | undefined, index: number | null): Record<string, unknown>;
export declare function itemDataForConsumableTransfer(source: any): Record<string, unknown>;
export interface EquippedConsumableRow {
    index: number;
    itemId: string;
    name: string;
    img: string;
    powerName: string;
    summary: string;
    creatorId: string;
    snapshot: MinorMagicSnapshot | null;
}
export declare function listEquippedConsumableItems(actor: {
    items?: Iterable<any>;
}): Array<{
    index: number;
    item: any;
}>;
/** Unequipped inventory items that may occupy a Consumable Slot. */
export declare function listCarriedConsumableItems(items: Iterable<any> | null | undefined): any[];
export declare function itemOccupyingConsumableSlot(actor: {
    items?: Iterable<any>;
}, index: number): any | null;
export declare function isItemInAnyConsumableSlot(actor: {
    items?: Iterable<any>;
}, itemId: string): boolean;
export declare function actorParticipatesInActiveCombat(actor: {
    id?: string;
}): boolean;
export type ConsumableEquipError = 'not-consumable' | 'in-combat' | 'slot-oob' | 'occupied' | 'missing-item';
export declare function validateEquipConsumable(opts: {
    actor: {
        id?: string;
        items?: Iterable<any>;
        system?: {
            mastery?: {
                rank?: unknown;
            };
        };
    };
    item: any;
    index: number;
    inCombat?: boolean;
}): ConsumableEquipError | null;
export declare function validateUnequipConsumable(opts: {
    actor: {
        id?: string;
    };
    item: any;
    inCombat?: boolean;
}): ConsumableEquipError | null;
export declare function equipErrorMessage(error: ConsumableEquipError): string;
export declare function slotsToUnequipAfterRankChange(equippedIndexes: number[], newRank: number): number[];
export declare function buildConsumableSlotView(actor: any): {
    count: number;
    locked: boolean;
    slots: Array<{
        index: number;
        label: string;
        empty: boolean;
        item: any | null;
        itemId: string;
        name: string;
        img: string;
        powerName: string;
        summary: string;
    }>;
    inlineSlots: Array<{
        index: number;
        label: string;
        empty: boolean;
        item: any | null;
        itemId: string;
        name: string;
        img: string;
        powerName: string;
        summary: string;
    }>;
    extraSlots: Array<{
        index: number;
        label: string;
        empty: boolean;
        item: any | null;
        itemId: string;
        name: string;
        img: string;
        powerName: string;
        summary: string;
    }>;
};
export declare function equippedConsumableActionRows(actor: any): EquippedConsumableRow[];
export declare function attackActionConsumableIds(actor: any): string[];
export declare function parseStoredRangeMeters(range: string | undefined): number;
export declare function storedPowerIgnoresWeapon(_snapshot?: MinorMagicSnapshot | null): boolean;
export declare function storedPowerKeepsSpecials(snapshot: MinorMagicSnapshot | null | undefined): string;
export declare function consumableGrantsExtraAttack(): boolean;
export declare function consumableUseSpendsAttackAction(): boolean;
export type ConsumableUsePlan = 'spend-on-success' | 'blocked' | 'no-spend';
export declare function consumableUseActionPlan(inCombat: boolean, availableActions: number): ConsumableUsePlan;
export declare function shouldConsumeConsumableOnUse(result: 'success' | 'abort' | 'fail'): boolean;
export declare function isConsumableCombatOption(option: {
    tags?: string[];
    consumableItemId?: string;
} | null | undefined): boolean;
export declare function buildConsumableAttackOption(actor: any, item: any): any;
export declare function buildConsumableRadialOptions(actor: any, opts?: {
    attackActionsAvailable?: number;
}): any[];
export declare function buildConsumablePrintEntries(actor: any): Array<{
    name: string;
    powerName: string;
    effect: string;
    phase: 'Active';
    attackRoll: string;
    damageRoll: string;
    battleFootnote: string;
    hideRank: boolean;
    fromConsumable: boolean;
    battleCompact: boolean;
    img: string;
}>;
export declare function buildConsumablePrintSlots(actor: any): Array<{
    index: number;
    label: string;
    empty: boolean;
    name: string;
    img: string;
    powerName: string;
    summary: string;
}>;
export declare function equipConsumableToSlot(actor: any, item: any, index: number): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function unequipConsumable(actor: any, item: any): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function syncConsumableSlotsToMasteryRank(actor: any): Promise<string[]>;
export declare function rankChangeNotification(names: string[]): string;
export declare function transferConsumableToActor(targetActor: any, sourceItem: any): Promise<any | null>;
export declare function consumeEquippedConsumableAfterSuccess(actor: any, item: any): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function useEquippedConsumable(actor: any, item: any): Promise<{
    ok: true;
    deferred?: boolean;
} | {
    ok: false;
    error: string;
    failed?: boolean;
}>;
//# sourceMappingURL=consumable-slots.d.ts.map