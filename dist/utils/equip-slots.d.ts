/**
 * Paperdoll slot keys — canonical 7-slot vocabulary (Artefacts.md).
 *
 * No other equipment slots exist on a character. Legacy keys
 * (`helmet`, `necklace`, `chest`, `cloak`, `glove`, `ring1`, `ring2`,
 * `belt`, `leggings`, `boot`) are normalized to the canonical keys
 * (or unset for slots that no longer exist) by the
 * `paperdoll-slot-canonical` migration and by `normalizeSlotKey()`.
 */
export declare const PAPERDOLL_SLOT_KEYS: readonly ["mainhand", "offhand", "body", "head", "feet", "amulet", "ring"];
export type PaperdollSlotKey = (typeof PAPERDOLL_SLOT_KEYS)[number];
/**
 * Legacy → canonical paperdoll slot key map. Used by the migration
 * AND by runtime sanitizers so old items with `equipSlots: ['chest']`
 * still resolve to the new canonical `body` slot.
 *
 * Slots that no longer exist (`cloak`, `glove`, `belt`, `leggings`)
 * resolve to `null` — items previously equipped there are unequipped
 * by the migration.
 */
export declare const LEGACY_PAPERDOLL_SLOT_MAP: Record<string, PaperdollSlotKey | null>;
/**
 * Normalize a slot key (canonical or legacy) to the canonical 7-slot
 * vocabulary. Returns `null` when the input was a removed legacy slot
 * or an unknown value.
 */
export declare function normalizeSlotKey(key: unknown): PaperdollSlotKey | null;
/**
 * Valid, non-empty equip slot list from item.system.equipSlots, or null if the item cannot be equipped.
 * Legacy slot keys on existing items are silently normalized to the canonical 7-slot vocabulary.
 */
export declare function getNormalizedEquipSlots(item: {
    system?: {
        equipSlots?: unknown;
    };
} | null | undefined): string[] | null;
/**
 * Default slots for weapon / armor / shield when backfilling legacy items (GM migration).
 * Gear is not inferred — leave equipSlots unset or empty for non-equippable gear.
 */
export declare function inferDefaultEquipSlotsForType(item: {
    type?: string;
    system?: {
        hands?: number;
    };
}): string[] | null;
/**
 * Paperdoll slots for artifact items.
 *
 * Priority order:
 *   1. New canonical `system.slot` + `system.baseProfile` (Artefacts.md spec).
 *      A two-handed weapon profile occupies both `mainhand` and `offhand`.
 *   2. Legacy `artifactKind` + `gearSlot` (kept for compatibility with
 *      existing items that have not been migrated yet).
 */
export declare function inferArtifactEquipSlots(system: {
    artifactKind?: string;
    gearSlot?: string;
    artifactWeapon?: {
        hands?: number;
    };
    slot?: string;
    baseProfile?: string;
} | null | undefined): string[] | null;
/** Unequipped inventory / stash items that may occupy this paperdoll slot. */
export declare function listCarriedItemsForPaperdollSlot(items: Iterable<any> | null | undefined, slotKey: string, opts?: {
    allowOffhandWeapon?: (item: any) => boolean;
}): any[];
//# sourceMappingURL=equip-slots.d.ts.map