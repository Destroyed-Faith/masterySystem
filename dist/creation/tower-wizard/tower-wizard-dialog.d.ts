/**
 * Tower Wizard — guided beginner combat package dialog.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class TowerWizardDialog extends BaseDialog {
    #private;
    private actor;
    private step;
    private selection;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            title: "Combat Package Wizard";
            resizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    constructor(actor: Actor, options?: Record<string, unknown>);
    protected _prepareContext(_options: unknown): Promise<Record<string, unknown>>;
    protected _onRender(context: Record<string, unknown>, options: Record<string, unknown>): Promise<void>;
}
export declare function showTowerWizardDialog(actor: Actor): Promise<void>;
export {};
//# sourceMappingURL=tower-wizard-dialog.d.ts.map