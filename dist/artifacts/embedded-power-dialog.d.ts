/**
 * Structured editor for artifact Item embedded powers (EmbeddedPowerData).
 */
declare const BaseDialog: any;
export interface EmbeddedPowerLineageOptions {
    isLineageRoot?: boolean;
    /** Power ids inherited from ancestors; non-root cannot delete or edit these. */
    lockedPowerIds?: Set<string> | string[];
    maxTotalPowers?: number;
    /** Current node tree depth (1 = root); stamped on newly added powers. */
    treeDepth?: number;
}
export declare class EmbeddedPowerDialog extends BaseDialog {
    private item;
    private _workingPowers;
    private _baselinePowers;
    private _selectedIndex;
    private _onSaved?;
    private _lineage;
    private _treeDepth?;
    constructor(item: Item, options?: {
        onSaved?: () => void;
        lineage?: EmbeddedPowerLineageOptions;
    });
    static get defaultOptions(): any;
    private prepareDetail;
    getData(options?: any): any;
    private finalizePowersForSave;
    private syncFromDom;
    private readCurrentPowerFromForm;
    private collectTagsFromDom;
    private static syncTagRowCustomField;
    activateListeners(html: JQuery): void;
    private runImport;
}
export {};
//# sourceMappingURL=embedded-power-dialog.d.ts.map