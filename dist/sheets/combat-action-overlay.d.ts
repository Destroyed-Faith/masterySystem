/**
 * Combat Action Overlay
 *
 * Shows an overlay during a character's turn displaying:
 * - Available actions (Attack/Movement/Reaction)
 * - Combat powers
 * - Resource status (Stones, Vitality, Stress)
 * - Quick action buttons
 */
declare const ApplicationV2: any;
export declare class CombatActionOverlay extends ApplicationV2 {
    private actor;
    static get defaultOptions(): any;
    /**
     * Show combat overlay for the current turn
     * @param combat - Active combat
     */
    static showForCurrentTurn(combat: Combat): Promise<void>;
    constructor(actor: Actor, options?: any);
    /**
     * Prepare active powers for the actor (combat-usable powers)
     */
    private prepareActivePowers;
    getData(): Promise<any>;
    _renderHTML(_data?: any): Promise<JQuery>;
    _replaceHTML(element: JQuery, html: JQuery): Promise<void>;
    activateListeners(html: JQuery): void;
}
export {};
//# sourceMappingURL=combat-action-overlay.d.ts.map