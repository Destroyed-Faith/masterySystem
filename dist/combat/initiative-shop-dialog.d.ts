/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */
import { InitiativeRollBreakdown } from './initiative-roll.js';
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export interface InitiativeShopPurchase {
    extraMovement: number;
    initiativeSwap: boolean;
    extraAttack: boolean;
}
export interface InitiativeShopContext extends InitiativeRollBreakdown {
}
export declare class InitiativeShopDialog extends BaseDialog {
    private combatant;
    private combat;
    private context;
    private resolve?;
    private purchases;
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
     * Show initiative shop dialog for a combatant
     */
    static showForCombatant(combatant: Combatant, context: InitiativeShopContext, combat: Combat): Promise<InitiativeShopPurchase | null>;
    constructor(combatant: Combatant, context: InitiativeShopContext, combat: Combat, resolve: (purchases: InitiativeShopPurchase | null) => void);
    protected _prepareContext(_options: any): Promise<any>;
    protected _onRender(_context: any, _options: any): Promise<void>;
    private calculateTotalCost;
    private confirmPurchases;
    close(options?: any): Promise<this>;
}
export {};
//# sourceMappingURL=initiative-shop-dialog.d.ts.map