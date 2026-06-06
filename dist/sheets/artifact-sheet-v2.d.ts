/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Provides a read-friendly summary (slot / profile / level, Base Values, and
 * the per-level abilities from `system.levelProgression`) plus GM power editing.
 */
export declare class ArtifactSheetV2 extends foundry.appv1.sheets.ItemSheet {
    /** @override */
    static get defaultOptions(): any;
    /** @override */
    get template(): string;
    /** @override */
    getData(options?: any): any;
    /** @override */
    activateListeners(html: JQuery): void;
    /**
     * Rebuild the powers array (and other array-shaped fields) from the flattened
     * form data. The classic ItemSheet would otherwise expand `system.powers.0.x`
     * into an index-keyed object and clobber the array.
     * @override
     */
    _updateObject(_event: Event, formData: Record<string, unknown>): Promise<unknown>;
    private _onPowerAction;
    private _createEmptyLevel;
    private _onSpecialAction;
    private _promptForSpecialKey;
}
//# sourceMappingURL=artifact-sheet-v2.d.ts.map