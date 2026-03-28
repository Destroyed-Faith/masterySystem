/**
 * Paperdoll slot keys (must match character sheet slot defs + CSS grid areas).
 */
export const PAPERDOLL_SLOT_KEYS = [
    'helmet',
    'necklace',
    'chest',
    'cloak',
    'glove',
    'ring1',
    'belt',
    'mainhand',
    'leggings',
    'offhand',
    'boot'
];
const SLOT_SET = new Set(PAPERDOLL_SLOT_KEYS);
/**
 * Valid, non-empty equip slot list from item.system.equipSlots, or null if the item cannot be equipped.
 */
export function getNormalizedEquipSlots(item) {
    if (!item?.system)
        return null;
    const raw = item.system.equipSlots;
    if (!Array.isArray(raw) || raw.length === 0)
        return null;
    const out = raw.filter((s) => typeof s === 'string' && SLOT_SET.has(s));
    return out.length > 0 ? out : null;
}
/**
 * Default slots for weapon / armor / shield when backfilling legacy items (GM migration).
 * Gear is not inferred — leave equipSlots unset or empty for non-equippable gear.
 */
export function inferDefaultEquipSlotsForType(item) {
    const t = item?.type;
    if (t === 'weapon') {
        const h = Number(item.system?.hands ?? 1);
        return h === 2 ? ['mainhand'] : ['mainhand', 'offhand'];
    }
    if (t === 'armor')
        return ['chest'];
    if (t === 'shield')
        return ['offhand'];
    return null;
}
//# sourceMappingURL=equip-slots.js.map