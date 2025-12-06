/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points to buy tactical advantages
 *
 * Shop Options:
 * - 4 points: +2m Movement
 * - 8 points: Initiative Swap (requires 2 raises, 1x/round)
 * - 20 points: +1 Extra Attack (max 1x/round)
 */
import { type InitiativeShopResult } from '../utils/initiative';
export declare class InitiativeShopDialog extends Dialog {
    /**
     * Show the Initiative Shop dialog
     * @param actor - The actor shopping
     * @param rawInitiative - Total initiative before spending
     * @returns Promise resolving to shop result or null if cancelled
     */
    static show(actor: any, rawInitiative: number): Promise<InitiativeShopResult | null>;
    /**
     * Generate the HTML content for the dialog
     */
    private static _getDialogContent;
    /**
     * Activate event listeners on the dialog
     */
    private static _activateListeners;
    /**
     * Parse form data and return the result
     */
    private static _parseFormData;
}
//# sourceMappingURL=initiative-shop-dialog.d.ts.map