/**
 * Small helpers for Foundry VTT v14 API differences (status effects record,
 * forced field deletion, namespaced FilePicker).
 */

/** V14 document update operator for deleting nested fields. */
export function getForcedDeletion(): unknown {
  return (foundry as any)?.data?.operators?.ForcedDeletion ?? null;
}

/** Namespaced FilePicker implementation (v13+); undefined on very old cores. */
export function getFilePickerClass(): (new (...args: any[]) => any) | undefined {
  return (foundry as any)?.applications?.apps?.FilePicker?.implementation;
}
