/**
 * Critical(X) resolution — Active Buff Critical and stone/special Crit charges.
 *
 * Critical(X) = up to X attacks per Round may receive Critical.
 * X is never an explode-threshold strength; the threshold is always 7–8 on
 * Attack Dice only. Damage Dice never explode from Critical.
 *
 * Critical attacks: Attack Dice explode on 7–8; Damage Dice never explode.
 */
export type CriticalSource = 'active-buff' | 'stone-crit' | 'special-crit';
/** Fixed explode faces for every Critical application. */
export declare const CRITICAL_ATTACK_EXPLODE_FACES: readonly [7, 8];
/** Damage Dice are never exploded by Critical(X). */
export declare const CRITICAL_DAMAGE_DICE_EXPLODE: false;
export type CriticalRoundQuota = {
    /** `${combatId}:${round}` — quota refreshes when this changes. */
    roundKey: string;
    /** Critical(X) granted this round from Active Buff. */
    granted: number;
    /** Remaining Critical-capable attacks this round. */
    remaining: number;
};
export type CriticalAttackModifier = {
    /**
     * Active Buff Critical(X) value — number of Critical attacks per Round.
     * Not an explode-strength tier.
     */
    criticalX: number;
    /** Buff quota remaining before this attack is resolved. */
    buffQuotaRemaining: number;
    stoneCritCharges: number;
    specialCritCharges: number;
    /** This attack receives Critical (Attack Dice explode on 7–8). */
    applyCritical: boolean;
    /** Always true iff applyCritical — threshold never changes with X. */
    explodeOn78: boolean;
    explodeFaces: readonly [7, 8];
    damageDiceExplode: false;
    /** Which charge pool to decrement when Critical is applied. */
    consumeFrom: CriticalSource | null;
    sources: CriticalSource[];
};
/**
 * Sync Active Buff Critical quota for the current combat round.
 * New round → remaining = Critical(X). Same round → keep spent charges.
 */
export declare function syncCriticalRoundQuota(existing: CriticalRoundQuota | null | undefined, roundKey: string, buffCriticalX: number): CriticalRoundQuota;
export declare function consumeCriticalQuota(quota: CriticalRoundQuota): CriticalRoundQuota;
export declare function combatRoundKey(combat: {
    id?: string;
    round?: number;
} | null | undefined): string;
/**
 * Resolve whether this attack receives Critical.
 * Multiple sources never improve the explode threshold — always 7–8 on Attack Dice.
 * Prefer consuming Active Buff quota, then stone Crit charges, then special Crit.
 */
export declare function resolveCriticalAttackModifier(opts: {
    activeBuffCriticalX?: number;
    buffQuotaRemaining?: number;
    stoneCritCharges?: number;
    specialCritCharges?: number;
}): CriticalAttackModifier;
/** Format for UI / chat — always Critical(X). */
export declare function formatCriticalLabel(criticalX: number): string;
//# sourceMappingURL=critical-resolution.d.ts.map