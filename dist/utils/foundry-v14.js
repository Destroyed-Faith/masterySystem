/**
 * Small helpers for Foundry VTT v14 API differences (status effects record,
 * forced field deletion, namespaced FilePicker).
 */
/** True on Foundry v14+ (`CONFIG.statusEffects` is a record, not an array). */
export function isFoundryV14OrNewer() {
    if (typeof game === 'undefined') {
        // v14-only system — never assign CONFIG.statusEffects as an array when unsure.
        return true;
    }
    const generation = game.release?.generation;
    if (typeof generation === 'number')
        return generation >= 14;
    const major = Number(String(game.version ?? '').split('.')[0]);
    if (Number.isFinite(major) && major > 0)
        return major >= 14;
    return true;
}
/** V14 document update operator class for deleting nested fields (or null). */
export function getForcedDeletion() {
    if (typeof foundry === 'undefined')
        return null;
    return foundry?.data?.operators?.ForcedDeletion ?? null;
}
/**
 * Value to assign in an `actor.update` patch to delete a nested field.
 * Foundry v14 wants `new ForcedDeletion()`; older cores use `path.-=key: null`.
 */
export function forcedDeletionValue() {
    const Ctor = getForcedDeletion();
    if (typeof Ctor === 'function') {
        try {
            return new Ctor();
        }
        catch {
            return Ctor;
        }
    }
    return null;
}
/**
 * Mark `dottedPath` for deletion on `patch` (e.g. `system.passives.slot0`).
 * Prefers ForcedDeletion; falls back to legacy `parent.-=key: null`.
 */
export function patchForcedDelete(patch, dottedPath) {
    const value = forcedDeletionValue();
    if (value != null) {
        patch[dottedPath] = value;
        return;
    }
    const parts = dottedPath.split('.');
    const key = parts.pop();
    if (!key || !parts.length)
        return;
    patch[`${parts.join('.')}.-=${key}`] = null;
}
/** Namespaced FilePicker implementation (v13+); undefined on very old cores. */
export function getFilePickerClass() {
    if (typeof foundry === 'undefined')
        return undefined;
    return foundry?.applications?.apps?.FilePicker?.implementation;
}
//# sourceMappingURL=foundry-v14.js.map