/**
 * General Items Storage Dialog
 * A modular window where players can drag items from storage to their inventory
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class GeneralItemsStorageDialog extends BaseDialog {
    #private;
    private _actor;
    private static _instance;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        width: number;
        height: number;
        resizable: boolean;
        title: string;
        window: {
            title: string;
        };
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
     * Show the dialog for an actor
     */
    static showForActor(actor: any): Promise<void>;
}
export {};
//# sourceMappingURL=general-items-storage-dialog.d.ts.map