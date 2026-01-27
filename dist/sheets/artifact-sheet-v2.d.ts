/**
 * Artifact Item Sheet V2 (Foundry v13 ApplicationV2)
 * Supports editing artifact powers with the new schema
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseSheet: typeof ApplicationV2;
export declare class ArtifactSheetV2 extends BaseSheet {
    private _item;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        width: number;
        height: number;
        resizable: boolean;
        tabs: {
            navSelector: string;
            contentSelector: string;
            initial: string;
        }[];
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    constructor(item: Item, options?: any);
    get item(): Item;
    get document(): Item;
    _prepareContext(_options: any): Promise<any>;
    _onRender(_element: HTMLElement, _options: any): Promise<void>;
    private _onPowerAction;
    private _onFormChange;
    private _updateLevelField;
    private _createEmptyLevel;
    private _onSpecialAction;
    private _promptForSpecialKey;
}
export {};
//# sourceMappingURL=artifact-sheet-v2.d.ts.map