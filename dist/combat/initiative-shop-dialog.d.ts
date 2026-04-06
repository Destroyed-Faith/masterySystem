/**
 * Initiative Shop Dialog — schlank: Mastery Roll + CR-Dropdown + Shop-Zeilen, kein CR-Popup.
 */
import { InitiativeRollBreakdown } from './initiative-roll.js';
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export interface InitiativeShopPurchase {
    extraMovement: number;
    initiativeSwap: boolean;
    extraReaction: boolean;
    removeStress: boolean;
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
    /** CR-Punkte, die der Spieler im Dropdown wählt (Shop-Pool = Wurf + das). */
    private crSpent;
    /** Bereits vor diesem Dialog auf skillsSpent gebucht (Legacy / seltener Pfad). */
    private crCommittedAtOpen;
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
    static showForCombatant(combatant: Combatant, context: InitiativeShopContext, combat: Combat): Promise<InitiativeShopPurchase | null>;
    constructor(combatant: Combatant, context: InitiativeShopContext, combat: Combat, resolve: (purchases: InitiativeShopPurchase | null) => void);
    private getShopPool;
    protected _prepareContext(_options: any): Promise<any>;
    protected _onRender(_context: any, _options: any): Promise<void>;
    private calculateTotalCost;
    private confirmPurchases;
    close(options?: any): Promise<this>;
}
export {};
//# sourceMappingURL=initiative-shop-dialog.d.ts.map