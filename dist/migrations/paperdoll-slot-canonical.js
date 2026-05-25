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
import { LEGACY_PAPERDOLL_SLOT_MAP, PAPERDOLL_SLOT_KEYS } from '../utils/equip-slots.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'paperdollSlotCanonicalRun';
const CANONICAL_SET = new Set(PAPERDOLL_SLOT_KEYS);
export function registerPaperdollSlotCanonicalSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Paperdoll Slot Canonicalization Ran',
            hint: 'Internal flag: true after the one-time paperdoll-slot canonicalization migration ran for this world.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | paperdoll-slot-canonical: settings.register failed', err);
    }
}
function hasAlreadyRun() {
    try {
        return game.settings.get(SETTING_NAMESPACE, SETTING_KEY) === true;
    }
    catch {
        return false;
    }
}
async function markRun() {
    try {
        await game.settings.set(SETTING_NAMESPACE, SETTING_KEY, true);
    }
    catch (err) {
        console.warn('Mastery System | paperdoll-slot-canonical: settings.set failed', err);
    }
}
function normalizeFlagSlot(raw) {
    if (typeof raw !== 'string')
        return { changed: false, next: null };
    const k = raw.trim();
    if (!k)
        return { changed: false, next: null };
    if (CANONICAL_SET.has(k))
        return { changed: false, next: k };
    if (k in LEGACY_PAPERDOLL_SLOT_MAP) {
        return { changed: true, next: LEGACY_PAPERDOLL_SLOT_MAP[k] };
    }
    return { changed: true, next: null };
}
function normalizeEquipSlotsArray(raw) {
    if (!Array.isArray(raw))
        return { changed: false, next: null };
    const out = [];
    const seen = new Set();
    let changed = false;
    for (const v of raw) {
        if (typeof v !== 'string') {
            changed = true;
            continue;
        }
        const k = v.trim();
        if (!k) {
            changed = true;
            continue;
        }
        if (CANONICAL_SET.has(k)) {
            if (!seen.has(k)) {
                seen.add(k);
                out.push(k);
            }
            else {
                changed = true;
            }
            continue;
        }
        if (k in LEGACY_PAPERDOLL_SLOT_MAP) {
            const mapped = LEGACY_PAPERDOLL_SLOT_MAP[k];
            changed = true;
            if (mapped && !seen.has(mapped)) {
                seen.add(mapped);
                out.push(mapped);
            }
            continue;
        }
        // Unknown legacy key — drop.
        changed = true;
    }
    return { changed, next: out };
}
async function migrateItem(item) {
    if (!item)
        return false;
    const updates = {};
    // 1. Normalize the equipment slot flag.
    try {
        const flags = item.getFlag?.(SETTING_NAMESPACE, 'equipment') || null;
        if (flags && typeof flags === 'object') {
            const { changed, next } = normalizeFlagSlot(flags.slot);
            if (changed) {
                const nextFlags = { ...flags, slot: next };
                updates['flags.mastery-system.equipment'] = nextFlags;
                // If the slot was removed (legacy slot mapped to null),
                // also clear the legacy `system.equipped` flag.
                if (next == null) {
                    updates['system.equipped'] = false;
                }
            }
        }
    }
    catch {
        // ignore — getFlag may not be available on every item document type
    }
    // 2. Normalize the equipSlots array on the item's system data.
    const equipSlotsRaw = item.system?.equipSlots;
    if (Array.isArray(equipSlotsRaw)) {
        const { changed, next } = normalizeEquipSlotsArray(equipSlotsRaw);
        if (changed) {
            updates['system.equipSlots'] = next;
        }
    }
    // 3. Normalize artifact-only fields: `system.gearSlot` and `system.slot`.
    if (item.type === 'artifact') {
        const gearSlot = item.system?.gearSlot;
        if (typeof gearSlot === 'string') {
            const { changed, next } = normalizeFlagSlot(gearSlot);
            if (changed) {
                updates['system.gearSlot'] = next ?? '';
            }
        }
    }
    if (Object.keys(updates).length === 0)
        return false;
    try {
        await item.update(updates);
        return true;
    }
    catch (err) {
        console.warn(`Mastery System | paperdoll-slot-canonical: failed to update item "${item?.name}"`, err);
        return false;
    }
}
/** Execute the one-shot paperdoll slot canonicalization. Idempotent per world. */
export async function runPaperdollSlotCanonical() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
    let touchedWorld = 0;
    let touchedEmbedded = 0;
    const worldItems = game.items?.contents ?? [];
    for (const item of worldItems) {
        if (await migrateItem(item))
            touchedWorld++;
    }
    const actors = game.actors?.contents ?? [];
    for (const actor of actors) {
        const embedded = Array.from(actor?.items ?? []);
        for (const it of embedded) {
            if (await migrateItem(it))
                touchedEmbedded++;
        }
    }
    await markRun();
    const msg = `Mastery System | Paperdoll slot canonicalization: normalized ${touchedWorld} world item(s) and ${touchedEmbedded} embedded item(s) to the new 7-slot vocabulary.`;
    console.log(msg);
    try {
        ui.notifications?.info(msg);
    }
    catch {
        // UI may not be ready in every context; console log is enough.
    }
}
//# sourceMappingURL=paperdoll-slot-canonical.js.map