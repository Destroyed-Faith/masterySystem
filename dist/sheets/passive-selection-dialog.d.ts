/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 */
export declare class PassiveSelectionDialog extends Application {
    private currentIndex;
    private pcs;
    private resolve?;
    private _preventAutoClose;
    static get defaultOptions(): any;
    /**
     * Show passive selection dialog for all player-controlled combatants
     * @param combat - The active combat
     * @returns Promise that resolves when all players finish selection
     */
    static showForCombat(combat: Combat): Promise<void>;
    constructor(pcs: Combatant[], resolve: () => void);
    get currentCombatant(): Combatant | null;
    get currentActor(): Actor | null;
    getData(): Promise<any>;
    _renderHTML(_data?: any): Promise<JQuery>;
    _replaceHTML(element: JQuery, html: JQuery): Promise<void>;
    activateListeners(html: JQuery): void;
    close(options?: any): Promise<void>;
}
//# sourceMappingURL=passive-selection-dialog.d.ts.map