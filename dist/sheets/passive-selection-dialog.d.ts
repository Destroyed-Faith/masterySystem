/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class PassiveSelectionDialog extends BaseDialog {
    private currentIndex;
    private pcs;
    private resolve?;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
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
     * Show passive selection dialog for a single combatant
     */
    static showForCombatant(combatant: Combatant): Promise<void>;
    /**
     * Show passive selection dialog for all player-controlled combatants
     */
    static showForCombat(combat: Combat): Promise<void>;
    constructor(pcs: Combatant[], resolve: () => void);
    get currentCombatant(): Combatant | null;
    get currentActor(): Actor | null;
    protected _prepareContext(_options: any): Promise<any>;
    protected _onRender(_context: any, _options: any): Promise<void>;
    private _closeExplicit;
    close(options?: any): Promise<this>;
}
export {};
//# sourceMappingURL=passive-selection-dialog.d.ts.map