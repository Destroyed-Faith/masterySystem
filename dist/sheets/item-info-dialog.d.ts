/**
 * Read-only item summary dialog (weapons, armor, shields, gear, artifacts).
 * Unified layout for equipment clicks and future callers.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class ItemInfoDialog extends BaseDialog {
    #private;
    private _item;
    /** Preserve <details open> across re-renders after Save. */
    private _quickEditOpen;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        tag: string;
        position: {
            width: number;
            height: "auto";
        };
        window: {
            title: string;
            resizable: boolean;
            icon: string;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    constructor(item: any, options?: Record<string, unknown>);
    get item(): any;
    static show(item: any): Promise<void>;
    _prepareContext(_options: Record<string, unknown>): Promise<Record<string, unknown>>;
    _onRender(context: unknown, options: Record<string, unknown>): Promise<void>;
}
export {};
//# sourceMappingURL=item-info-dialog.d.ts.map