/**
 * GM menu: release / hide important NPCs on the player portrait bar.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class KnownNpcsGmDialog extends BaseDialog {
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
            release: (this: KnownNpcsGmDialog, event: Event) => void;
            hide: (this: KnownNpcsGmDialog, event: Event) => void;
            up: (this: KnownNpcsGmDialog, event: Event) => void;
            down: (this: KnownNpcsGmDialog, event: Event) => void;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static open(): Promise<void>;
    static refreshIfOpen(): void;
    _prepareContext(_options: any): Promise<any>;
    _onRender(_context: any, _options: any): Promise<void>;
}
export {};
//# sourceMappingURL=known-npcs-gm-dialog.d.ts.map