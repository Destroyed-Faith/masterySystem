/**
 * Critical(X) resolution — Active Buff Critical, stone/special Crit, and
 * Passive: Critical charges.
 *
 * Critical(X) = up to X designated Martial Attack / damaging Spell Casting
 * Pools may receive Critical (Active Buff = per Combat while maintained;
 * Agility Stone Crit = per Round; Passive Critical = per Combat). Sources do
 * not stack on one roll. X is never an explode-threshold strength; the
 * threshold is always 7–8 on Attack Dice only. Damage Dice never explode
 * from Critical.
 */
export type CriticalSource = 'active-buff' | 'stone-crit' | 'special-crit' | 'passive-crit';
/** Fixed explode faces for every Critical application. */
export declare const CRITICAL_ATTACK_EXPLODE_FACES: readonly [7, 8];
/** Damage Dice are never exploded by Critical(X). */
export declare const CRITICAL_DAMAGE_DICE_EXPLODE: false;
/**
 * Crit is declared before the roll. It applies to damaging Martial attacks
 * and damaging Spells. Non-damaging Spells do not consume a charge.
 */
export declare function critAppliesToAttackRoll(args: {
    spell: boolean;
    damageDice: number;
}): boolean;
export type CriticalRoundQuota = {
    /** Combat id — Active Buff quota is combat-wide (field name kept for save compat). */
    roundKey: string;
    /** Critical(X) granted this combat from Active Buff. */
    granted: number;
    /** Remaining Critical designations this combat. */
    remaining: number;
};
export type CriticalAttackModifier = {
    /**
     * Active Buff Critical(X) value — number of Critical designations per Combat.
     * Not an explode-strength tier.
     */
    criticalX: number;
    /** Buff quota remaining before this attack is resolved. */
    buffQuotaRemaining: number;
    stoneCritCharges: number;
    specialCritCharges: number;
    /** Passive: Critical charges remaining this Combat. */
    passiveCritCharges: number;
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
 * Sync Active Buff Critical quota for the current combat.
 * New combat → remaining = Critical(X). Same combat → keep spent charges
 * (reactivation / new Rounds do not refill the allowance).
 */
export declare function syncCriticalRoundQuota(existing: CriticalRoundQuota | null | undefined, roundKey: string, buffCriticalX: number): CriticalRoundQuota;
/** Spend the declared Crit charge. No-op when the roll did not select Crit. */
export declare function applyDeclaredCritSpend(state: {
    stoneBonuses?: {
        critRaises?: number;
    };
    criticalQuota?: CriticalRoundQuota | null;
    /** Set true by caller when Passive Crit is consumed via async flag write. */
    passiveCritPending?: boolean;
}, mod: CriticalAttackModifier): boolean;
export declare function consumeCriticalQuota(quota: CriticalRoundQuota): CriticalRoundQuota;
/**
 * Active Buff Critical combat key (combat-wide). Round is ignored so the
 * allowance does not refresh at Round boundaries.
 */
export declare function combatRoundKey(combat: {
    id?: string;
    round?: number;
} | null | undefined): string;
/** @deprecated Alias — Active Buff Critical is combat-wide; prefer combatRoundKey. */
export declare function combatCriticalKey(combat: {
    id?: string;
} | null | undefined): string;
/**
 * Resolve whether this attack receives Critical.
 * Multiple sources never improve the explode threshold — always 7–8 on Attack Dice.
 * Prefer Active Buff quota, then stone Crit, then Passive Crit, then special Crit —
 * unless the player picks a preferred source that still has charges.
 */
export declare function resolveCriticalAttackModifier(opts: {
    activeBuffCriticalX?: number;
    buffQuotaRemaining?: number;
    stoneCritCharges?: number;
    specialCritCharges?: number;
    passiveCritCharges?: number;
    /** Player checked Crit on this roll. Without it, no charge is spent. */
    declared?: boolean;
    /** When multiple sources exist, prefer this one if it still has charges. */
    preferredSource?: CriticalSource | null;
}): CriticalAttackModifier;
/** Available Crit charge pools for UI (Roll vs Roll with Crit). */
export declare function listAvailableCriticalSources(opts: {
    buffQuotaRemaining?: number;
    stoneCritCharges?: number;
    specialCritCharges?: number;
    passiveCritCharges?: number;
}): Array<{
    source: CriticalSource;
    remaining: number;
    label: string;
}>;
/** Format for UI / chat — always Critical(X). */
export declare function formatCriticalLabel(criticalX: number): string;
//# sourceMappingURL=critical-resolution.d.ts.map