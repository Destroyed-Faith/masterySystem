/**
 * Small helpers for Foundry VTT v14 API differences (status effects record,
 * forced field deletion, namespaced FilePicker).
 */
/** V14 document update operator for deleting nested fields. */
export function getForcedDeletion() {
    return foundry?.data?.operators?.ForcedDeletion ?? null;
}
/** Namespaced FilePicker implementation (v13+); undefined on very old cores. */
export function getFilePickerClass() {
    return foundry?.applications?.apps?.FilePicker?.implementation;
}
//# sourceMappingURL=foundry-v14.js.map