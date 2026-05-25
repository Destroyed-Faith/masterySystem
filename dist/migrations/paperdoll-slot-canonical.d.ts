/**
 * Paperdoll Slot Canonicalization — one-shot migration that maps
 * legacy paperdoll equipment slot keys onto the canonical 7-slot
 * vocabulary defined by the Artefacts.md spec.
 *
 * Canonical 7 slots: `mainhand`, `offhand`, `body`, `head`, `feet`,
 * `amulet`, `ring`.
 *
 * Legacy → canonical:
 *   helmet   → head
 *   chest    → body
 *   boot     → feet
 *   necklace → amulet
 *   ring1    → ring
 *   ring2    → ring
 *
 * Removed slots (`cloak`, `glove`, `belt`, `leggings`):
 *   - Items currently equipped in a removed slot are moved back to
 *     inventory (slot flag cleared, `system.equipped` set to false).
 *   - Items whose `system.equipSlots` array contained a removed slot
 *     have that entry stripped; if the resulting array is empty the
 *     item becomes non-equippable.
 *
 * Updates touch:
 *   - Every world-level Item document.
 *   - Every embedded item on every Actor.
 *
 * GM-only, idempotent, gated by a world setting.
 */
export declare function registerPaperdollSlotCanonicalSetting(): void;
/** Execute the one-shot paperdoll slot canonicalization. Idempotent per world. */
export declare function runPaperdollSlotCanonical(): Promise<void>;
//# sourceMappingURL=paperdoll-slot-canonical.d.ts.map