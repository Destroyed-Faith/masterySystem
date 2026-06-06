/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Read-friendly summary (slot / profile / level, Base Values) plus a read-only
 * Progression tab. Abilities are generated from the Level 1/2/3 picks in the
 * Artifact Builder node editor — this sheet never edits embedded powers.
 */
export declare class ArtifactSheetV2 extends foundry.appv1.sheets.ItemSheet {
    /** @override */
    static get defaultOptions(): any;
    /** @override */
    get template(): string;
    /** @override */
    getData(options?: any): any;
}
//# sourceMappingURL=artifact-sheet-v2.d.ts.map