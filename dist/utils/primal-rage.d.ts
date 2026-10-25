/**
 * Primal Rage Disadvantage — auto-granted with Primal Vestment.
 */
export declare const PRIMAL_RAGE_DISADVANTAGE_ID = "primal-rage";
export declare function actorHasPrimalVestment(actor: any): boolean;
export declare function actorHasPrimalRageDisadvantage(actor: any): boolean;
/**
 * Ensure Primal Rage (2 Points) is present while Primal Vestment is equipped.
 * Does not remove legal customizations; only adds the missing Disadvantage.
 */
export declare function ensurePrimalRageDisadvantage(actor: any): Promise<boolean>;
//# sourceMappingURL=primal-rage.d.ts.map