/**
 * Small helpers for Foundry VTT v14 API differences (status effects record,
 * forced field deletion, namespaced FilePicker).
 */
/** True on Foundry v14+ (`CONFIG.statusEffects` is a record, not an array). */
export function isFoundryV14OrNewer() {
    if (typeof game === 'undefined')
        return false;
    const generation = game.release?.generation;
    if (typeof generation === 'number')
        return generation >= 14;
    const major = Number(String(game.version ?? '0').split('.')[0]);
    return Number.isFinite(major) && major >= 14;
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