/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 */
import { InitiativeRollBreakdown } from './initiative-roll.js';
export interface InitiativeShopPurchase {
    extraMovement: number;
    initiativeSwap: boolean;
    extraAttack: boolean;
}
export interface InitiativeShopContext extends InitiativeRollBreakdown {
}
export declare class InitiativeShopDialog extends Application {
    private combatant;
    private combat;
    private context;
    private resolve?;
    private purchases;
    static get defaultOptions(): any;
    /**
     * Show initiative shop dialog for a combatant
     */
    static showForCombatant(combatant: Combatant, context: InitiativeShopContext, combat: Combat): Promise<InitiativeShopPurchase | null>;
    constructor(combatant: Combatant, context: InitiativeShopContext, combat: Combat, resolve: (purchases: InitiativeShopPurchase | null) => void);
    getData(): Promise<any>;
    _renderHTML(_data?: any): Promise<JQuery>;
    _replaceHTML(element: JQuery, html: JQuery): Promise<void>;
    activateListeners(html: JQuery): void;
    private calculateTotalCost;
    private confirmPurchases;
    close(options?: any): Promise<void>;
}
//# sourceMappingURL=initiative-shop-dialog.d.ts.map