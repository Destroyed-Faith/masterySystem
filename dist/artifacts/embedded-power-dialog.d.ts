/**
 * Structured editor for artifact Item embedded powers (EmbeddedPowerData).
 */
declare const BaseDialog: any;
export declare class EmbeddedPowerDialog extends BaseDialog {
    private item;
    private _workingPowers;
    private _selectedIndex;
    constructor(item: Item);
    static get defaultOptions(): any;
    private prepareDetail;
    getData(options?: any): any;
    private syncFromDom;
    private readCurrentPowerFromForm;
    activateListeners(html: JQuery): void;
    private runImport;
}
export {};
//# sourceMappingURL=embedded-power-dialog.d.ts.map