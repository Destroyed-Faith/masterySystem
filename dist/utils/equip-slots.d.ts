/**
 * Paperdoll slot keys (must match character sheet slot defs + CSS grid areas).
 */
export declare const PAPERDOLL_SLOT_KEYS: readonly ["helmet", "necklace", "chest", "cloak", "glove", "ring1", "belt", "mainhand", "leggings", "offhand", "boot"];
export type PaperdollSlotKey = (typeof PAPERDOLL_SLOT_KEYS)[number];
/**
 * Valid, non-empty equip slot list from item.system.equipSlots, or null if the item cannot be equipped.
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
 * Paperdoll slots for artifact items from artifactKind + profiles (matches weapon/shield/armor rules).
 */
export declare function inferArtifactEquipSlots(system: {
    artifactKind?: string;
    gearSlot?: string;
    artifactWeapon?: {
        hands?: number;
    };
} | null | undefined): string[] | null;
//# sourceMappingURL=equip-slots.d.ts.map