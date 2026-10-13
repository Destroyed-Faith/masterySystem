/**
 * GM Stone audit dialog — Lifetime track vs pools vs Summon holds.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class StoneAuditDialog extends BaseDialog {
    private actor;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: any;
        };
        window: {
            title: string;
            resizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static show(actor: any): Promise<void>;
    constructor(actor: any);
    _prepareContext(_options: any): Promise<any>;
    _onRender(context: any, options: any): Promise<void>;
}
export declare function openStoneAuditDialog(actor: any): Promise<void>;
export {};
//# sourceMappingURL=stone-audit-dialog.d.ts.map