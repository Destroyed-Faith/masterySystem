/**
 * Paperdoll slot keys — canonical 7-slot vocabulary (Artefacts.md).
 *
 * No other equipment slots exist on a character. Legacy keys
 * (`helmet`, `necklace`, `chest`, `cloak`, `glove`, `ring1`, `ring2`,
 * `belt`, `leggings`, `boot`) are normalized to the canonical keys
 * (or unset for slots that no longer exist) by the
 * `paperdoll-slot-canonical` migration and by `normalizeSlotKey()`.
 */
export const PAPERDOLL_SLOT_KEYS = [
    'mainhand',
    'offhand',
    'body',
    'head',
    'feet',
    'amulet',
    'ring',
];
const SLOT_SET = new Set(PAPERDOLL_SLOT_KEYS);
/**
 * Legacy → canonical paperdoll slot key map. Used by the migration
 * AND by runtime sanitizers so old items with `equipSlots: ['chest']`
 * still resolve to the new canonical `body` slot.
 *
 * Slots that no longer exist (`cloak`, `glove`, `belt`, `leggings`)
 * resolve to `null` — items previously equipped there are unequipped
 * by the migration.
 */
export const LEGACY_PAPERDOLL_SLOT_MAP = {
    helmet: 'head',
    chest: 'body',
    boot: 'feet',
    necklace: 'amulet',
    ring1: 'ring',
    ring2: 'ring',
    cloak: null,
    glove: null,
    belt: null,
    leggings: null,
};
/**
 * Normalize a slot key (canonical or legacy) to the canonical 7-slot
 * vocabulary. Returns `null` when the input was a removed legacy slot
 * or an unknown value.
 */
export function normalizeSlotKey(key) {
    if (typeof key !== 'string')
        return null;
    const k = key.trim();
    if (!k)
        return null;
    if (SLOT_SET.has(k))
        return k;
    if (k in LEGACY_PAPERDOLL_SLOT_MAP)
        return LEGACY_PAPERDOLL_SLOT_MAP[k];
    return null;
}
/**
 * Valid, non-empty equip slot list from item.system.equipSlots, or null if the item cannot be equipped.
 * Legacy slot keys on existing items are silently normalized to the canonical 7-slot vocabulary.
 */
export function getNormalizedEquipSlots(item) {
    if (!item?.system)
        return null;
    const raw = item.system.equipSlots;
    if (!Array.isArray(raw) || raw.length === 0)
        return null;
    const out = [];
    const seen = new Set();
    for (const v of raw) {
        const norm = normalizeSlotKey(v);
        if (norm && !seen.has(norm)) {
            seen.add(norm);
            out.push(norm);
        }
    }
    return out.length > 0 ? out : null;
}
/**
 * Default slots for weapon / armor / shield when backfilling legacy items (GM migration).
 * Gear is not inferred — leave equipSlots unset or empty for non-equippable gear.
 */
export function inferDefaultEquipSlotsForType(item) {
    const t = item?.type;
    if (t === 'weapon') {
        // One weapon slot only (main hand); off-hand is for shields, not a second weapon.
        return ['mainhand'];
    }
    if (t === 'armor')
        return ['body'];
    if (t === 'shield')
        return ['offhand'];
    return null;
}
/**
 * Paperdoll slots for artifact items.
 *
 * Priority order:
 *   1. New canonical `system.slot` + `system.baseProfile` (Artefacts.md spec).
 *      A two-handed weapon profile occupies both `mainhand` and `offhand`.
 *   2. Legacy `artifactKind` + `gearSlot` (kept for compatibility with
 *      existing items that have not been migrated yet).
 */
export function inferArtifactEquipSlots(system) {
    if (!system)
        return null;
    const newSlot = String(system.slot || '').trim();
    const baseProfile = String(system.baseProfile || '').trim();
    if (newSlot) {
        if (baseProfile === 'twoHandedWeapon' || newSlot === 'bothHands')
            return ['mainhand', 'offhand'];
        const map = {
            mainHand: ['mainhand'],
            offHand: ['offhand'],
            bothHands: ['mainhand', 'offhand'],
            body: ['body'],
            head: ['head'],
            feet: ['feet'],
            amulet: ['amulet'],
            ring: ['ring'],
        };
        const mapped = map[newSlot];
        if (mapped && mapped.every((s) => SLOT_SET.has(s)))
            return mapped;
    }
    const kind = system.artifactKind || 'weapon';
    if (kind === 'weapon') {
        const hands = Number(system.artifactWeapon?.hands || 1);
        if (hands >= 2)
            return ['mainhand', 'offhand'];
        return ['mainhand'];
    }
    if (kind === 'armor')
        return ['body'];
    if (kind === 'shield')
        return ['offhand'];
    if (kind === 'gear') {
        const gs = normalizeSlotKey(system.gearSlot);
        if (gs)
            return [gs];
        return null;
    }
    return null;
}
//# sourceMappingURL=equip-slots.js.map