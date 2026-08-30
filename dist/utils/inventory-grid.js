export function readEquipmentFlags(item) {
    if (typeof item?.getFlag === 'function') {
        return (item.getFlag('mastery-system', 'equipment') || {});
    }
    return (item?.flags?.['mastery-system']?.equipment || {});
}
/** Carried item that is not on the paperdoll, in a consumable slot, or a prepared weapon-set piece. */
export function isCarriedUnequippedItem(item) {
    const flags = readEquipmentFlags(item);
    if (String(flags.slot || '').trim())
        return false;
    if (flags.consumableSlot != null && Number.isFinite(Number(flags.consumableSlot)))
        return false;
    if (flags.weaponSetPrepared === true)
        return false;
    return true;
}
/** True when the item currently occupies carry-grid cells (not equipped, stash, or a consumable slot). */
export function occupiesInventoryGrid(flags, band) {
    if (!flags)
        return false;
    if (flags.weaponSetPrepared === true)
        return false;
    if (flags.container !== 'inventory')
        return false;
    if (flags.slot)
        return false;
    if (flags.consumableSlot != null && Number.isFinite(Number(flags.consumableSlot)))
        return false;
    const x = Number(flags.grid?.x || 0);
    const y = Number(flags.grid?.y || 0);
    if (x < 1 || y < 1)
        return false;
    if (band != null && (flags.band ?? 'not') !== band)
        return false;
    return true;
}
export function collectInventoryBandRects(items, band, opts = {}) {
    const cols = opts.cols ?? 8;
    const rows = opts.rows ?? 9;
    const rects = [];
    for (const item of items) {
        if (opts.excludeItemId && item?.id === opts.excludeItemId)
            continue;
        const flags = item?.getFlag?.('mastery-system', 'equipment') ||
            item?.flags?.['mastery-system']?.equipment ||
            {};
        if (!occupiesInventoryGrid(flags, band))
            continue;
        const size = parseInventorySize(item?.system?.inventorySize);
        rects.push({
            x: Number(flags.grid.x),
            y: Number(flags.grid.y),
            w: Math.min(cols, size.w),
            h: Math.min(rows, size.h),
        });
    }
    return rects;
}
export function parseInventorySize(size) {
    if (!size) {
        return { w: 1, h: 1 };
    }
    const match = size.toLowerCase().match(/(\d+)\s*x\s*(\d+)/);
    if (!match) {
        return { w: 1, h: 1 };
    }
    const w = Math.max(1, parseInt(match[1], 10) || 1);
    const h = Math.max(1, parseInt(match[2], 10) || 1);
    return { w, h };
}
export function rectsOverlap(a, b) {
    return !(a.x + a.w - 1 < b.x ||
        b.x + b.w - 1 < a.x ||
        a.y + a.h - 1 < b.y ||
        b.y + b.h - 1 < a.y);
}
export function fitsInGrid(x, y, w, h, cols, rows) {
    return x >= 1 && y >= 1 && x + w - 1 <= cols && y + h - 1 <= rows;
}
export function findFirstFit(existingRects, w, h, cols, rows) {
    for (let y = 1; y <= rows; y++) {
        for (let x = 1; x <= cols; x++) {
            if (!fitsInGrid(x, y, w, h, cols, rows))
                continue;
            const candidate = { x, y, w, h };
            const overlaps = existingRects.some(rect => rectsOverlap(rect, candidate));
            if (!overlaps) {
                return { x, y };
            }
        }
    }
    return null;
}
//# sourceMappingURL=inventory-grid.js.map