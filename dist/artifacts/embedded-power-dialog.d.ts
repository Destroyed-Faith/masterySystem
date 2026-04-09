/**
 * Structured editor for artifact Item embedded powers (EmbeddedPowerData).
 */
declare const BaseDialog: any;
export declare class EmbeddedPowerDialog extends BaseDialog {
    private item;
    private _workingPowers;
    private _selectedIndex;
    private _onSaved?;
    constructor(item: Item, options?: {
        onSaved?: () => void;
    });
    static get defaultOptions(): any;
    private prepareDetail;
    getData(options?: any): any;
    private syncFromDom;
    private readCurrentPowerFromForm;
    private collectTagsFromDom;
    private static syncTagRowCustomField;
    activateListeners(html: JQuery): void;
    private runImport;
}
export {};
//# sourceMappingURL=embedded-power-dialog.d.ts.map