/**
 * Thorns — Passive: Thorns / Active Buff: Thorns.
 * On qualifying final HP damage, retaliate Nd8 (capped by the loss) at the source.
 */
/** Combined Thorns dice from Passive + Active Buff (sources stack by taking the max of each, then sum). */
export declare function resolveThornsDice(defender: any): number;
/**
 * After final HP bar damage lands on `defender`, reflect Thorns at `source`.
 * Cap reflected damage at the final HP loss. Skips self-damage / missing source.
 */
export declare function maybeApplyThornsRetaliation(defender: any, source: any | null | undefined, finalHpLoss: number): Promise<{
    applied: number;
    dice: number;
} | null>;
//# sourceMappingURL=thorns.d.ts.map