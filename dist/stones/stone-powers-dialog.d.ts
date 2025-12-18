/**
 * Stone Powers Activation Dialog
 *
 * Allows players to activate stone powers during combat
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class StonePowersDialog extends BaseDialog {
    private actor;
    private combatant;
    private resolve?;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
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
    /**
     * Show stone powers dialog for an actor
     */
    static showForActor(actor: Actor, combatant?: Combatant | null): Promise<boolean>;
    constructor(actor: Actor, combatant: Combatant | null, resolve: (success: boolean) => void);
    _prepareContext(_options: any): Promise<any>;
    _onRender(_context: any, _options: any): Promise<void>;
    _onClose(_options: any): Promise<void>;
}
export {};
//# sourceMappingURL=stone-powers-dialog.d.ts.map