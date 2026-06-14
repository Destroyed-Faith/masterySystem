/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Single, read-only summary card: meta (slot / profile / level), the current
 * Base Values, and the up-to-3 active Level Progression abilities. No tabs, no
 * editable fields. GMs get an "Edit in Node Editor" link; all authoring still
 * happens in the Artifact Builder / Node Editor, never on this sheet.
 */
export declare class ArtifactSheetV2 extends foundry.appv1.sheets.ItemSheet {
    /** @override */
    static get defaultOptions(): any;
    /** @override */
    get template(): string;
    /** @override */
    getData(options?: any): any;
    /** @override */
    activateListeners(html: any): void;
}
//# sourceMappingURL=artifact-sheet-v2.d.ts.map