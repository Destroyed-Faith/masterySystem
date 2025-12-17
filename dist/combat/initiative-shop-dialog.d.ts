/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 */
export interface InitiativeShopPurchase {
    extraMovement: number;
    initiativeSwap: boolean;
    extraAttack: boolean;
}
export declare class InitiativeShopDialog extends Application {
    private combatant;
    private baseInitiative;
    private resolve?;
    private purchases;
    static get defaultOptions(): any;
    /**
     * Show initiative shop dialog for a combatant
     */
    static showForCombatant(combatant: Combatant, baseInitiative: number): Promise<InitiativeShopPurchase>;
    constructor(combatant: Combatant, rolledInitiative: number, resolve: (purchases: InitiativeShopPurchase) => void);
    getData(): Promise<any>;
    _renderHTML(_data?: any): Promise<JQuery>;
    _replaceHTML(element: JQuery, html: JQuery): Promise<void>;
    activateListeners(html: JQuery): void;
    private calculateTotalCost;
    private confirmPurchases;
    close(options?: any): Promise<void>;
}
//# sourceMappingURL=initiative-shop-dialog.d.ts.map