/**
 * General Items Storage Dialog — homebrew "Stash" extension.
 *
 * The Players Guide (~7544–7805) only describes the **24 × 9** Inventory
 * Grid the character carries on their person. There is **no** canonical
 * stash / extra storage. The 10 × 6 stash exposed by this dialog is a
 * Foundry-side convenience that lets players park items they don't want
 * cluttering their carry inventory (downtime gear, party loot, etc.).
 *
 * It deliberately doesn't apply Encumbrance penalties (see
 * `src/utils/encumbrance.ts`) — only items in the carry grid contribute
 * to load zones. If a campaign wants Players-Guide-strict rules, simply
 * keep this dialog empty.
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