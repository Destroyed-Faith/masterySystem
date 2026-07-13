/**
 * Small helpers for Foundry VTT v14 API differences (status effects record,
 * forced field deletion, namespaced FilePicker).
 */
/** True on Foundry v14+ (`CONFIG.statusEffects` is a record, not an array). */
export declare function isFoundryV14OrNewer(): boolean;
/** V14 document update operator for deleting nested fields. */
export declare function getForcedDeletion(): unknown;
/** Namespaced FilePicker implementation (v13+); undefined on very old cores. */
export declare function getFilePickerClass(): (new (...args: any[]) => any) | undefined;
//# sourceMappingURL=foundry-v14.d.ts.map