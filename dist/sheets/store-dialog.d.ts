/**
 * Store Dialog (GM Only)
 * A modular window where the GM can manage items in the store
 * Players can drag items from the store to their inventory
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class StoreDialog extends BaseDialog {
    private _actor;
    private static _instance;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        width: number;
        height: number;
        resizable: boolean;
        title: string;
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    constructor(actor: any, options?: any);
    get actor(): any;
    _prepareContext(_options: any): Promise<any>;
    _onRender(element: HTMLElement, _options: any): Promise<void>;
    /**
     * Show the dialog for an actor (GM only)
     */
    static showForActor(actor: any): Promise<void>;
}
export {};
//# sourceMappingURL=store-dialog.d.ts.map