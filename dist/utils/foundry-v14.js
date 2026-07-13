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
/** V14 document update operator for deleting nested fields. */
export function getForcedDeletion() {
    return foundry?.data?.operators?.ForcedDeletion ?? null;
}
/** Namespaced FilePicker implementation (v13+); undefined on very old cores. */
export function getFilePickerClass() {
    return foundry?.applications?.apps?.FilePicker?.implementation;
}
//# sourceMappingURL=foundry-v14.js.map