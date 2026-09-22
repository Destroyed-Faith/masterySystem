/**
 * Weapon Swap picker.
 *
 * The Move radial keeps a single button. Clicking it posts this card, and
 * the player clicks the set they want. Movement is spent only on that click.
 */
/** Chat card: one button per set that is not already worn. */
export declare function buildWeaponSwapCardHtml(actor: any): string;
export declare function buildWeaponSwapDoneHtml(actor: any, spentMovement: boolean): string;
export declare function postWeaponSwapCard(actor: any, token?: any): Promise<void>;
export declare function registerWeaponSwapChatHandler(): void;
//# sourceMappingURL=weapon-swap-card.d.ts.map