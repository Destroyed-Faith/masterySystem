/**
 * Shared ApplicationV2 compatibility helpers for the migrated document sheets.
 *
 * The system's sheet templates still use the classic V1 markup
 * (`nav.sheet-tabs` + `.tab[data-tab]` sections, `[data-edit="img"]`
 * portraits). ApplicationV2 no longer wires those automatically, so these
 * helpers replicate the V1 behavior on top of the V2 lifecycle.
 */
/**
 * Wire classic `nav.sheet-tabs` navigation inside a V2-rendered sheet.
 *
 * Keeps the active tab in `holder.activeTab` so it survives re-renders
 * (V2 replaces the part's DOM on every render). Falls back to the first
 * nav entry when the remembered tab no longer exists (e.g. NPC phase
 * deleted).
 */
export declare function bindManualSheetTabs(root: HTMLElement, holder: {
    activeTab?: string;
}, initialTab: string): void;
/**
 * Replicate the V1 `[data-edit="img"]` portrait editing: click opens a
 * FilePicker and stores the chosen path on the document.
 */
export declare function bindEditImage(root: HTMLElement, document: any): void;
//# sourceMappingURL=sheet-v2-compat.d.ts.map