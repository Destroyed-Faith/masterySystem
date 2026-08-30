/**
 * GM menu for Unluck / Misfortune Tokens.
 * Rolls are automatic; the GM starts the session, spends tokens, and adjusts the pool.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class UnluckGmDialog extends BaseDialog {
    #private;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: string;
        };
        window: {
            title: string;
            icon: string;
            resizable: boolean;
        };
        actions: {
            'start-session': (this: UnluckGmDialog, event: Event) => void;
            'reroll-session': (this: UnluckGmDialog, event: Event) => void;
            'clear-session': (this: UnluckGmDialog, event: Event) => void;
            'token-add': (this: UnluckGmDialog, event: Event) => void;
            'token-remove': (this: UnluckGmDialog, event: Event) => void;
            spend: (this: UnluckGmDialog, event: Event) => void;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static open(): Promise<void>;
    _prepareContext(_options: any): Promise<any>;
}
/** First GM ready of a session: roll Unluck automatically and open the menu. */
export declare function maybeAutoRollUnluckOnReady(): Promise<void>;
export {};
//# sourceMappingURL=unluck-gm-dialog.d.ts.map