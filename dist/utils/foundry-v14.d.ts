/**
 * Small helpers for Foundry VTT v14 API differences (status effects record,
 * forced field deletion, namespaced FilePicker).
 */
/** V14 document update operator for deleting nested fields. */
export declare function getForcedDeletion(): unknown;
/** Namespaced FilePicker implementation (v13+); undefined on very old cores. */
export declare function getFilePickerClass(): (new (...args: any[]) => any) | undefined;
//# sourceMappingURL=foundry-v14.d.ts.map