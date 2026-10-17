/**
 * Small helpers for Foundry VTT v14 API differences (status effects record,
 * forced field deletion, namespaced FilePicker).
 */
/** True on Foundry v14+ (`CONFIG.statusEffects` is a record, not an array). */
export declare function isFoundryV14OrNewer(): boolean;
/** V14 document update operator class for deleting nested fields (or null). */
export declare function getForcedDeletion(): unknown;
/**
 * Value to assign in an `actor.update` patch to delete a nested field.
 * Foundry v14 wants `new ForcedDeletion()`; older cores use `path.-=key: null`.
 */
export declare function forcedDeletionValue(): unknown;
/**
 * Mark `dottedPath` for deletion on `patch` (e.g. `system.passives.slot0`).
 * Prefers ForcedDeletion; falls back to legacy `parent.-=key: null`.
 */
export declare function patchForcedDelete(patch: Record<string, unknown>, dottedPath: string): void;
/** Namespaced FilePicker implementation (v13+); undefined on very old cores. */
export declare function getFilePickerClass(): (new (...args: any[]) => any) | undefined;
//# sourceMappingURL=foundry-v14.d.ts.map