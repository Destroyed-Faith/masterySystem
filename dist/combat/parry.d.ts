/**
 * Passive Parry — enter a pool stance, strip Attack Dice 1:1 before the roll.
 * 0 remaining dice = Fully Parried → Riposte / Reflection may fire.
 */
export interface ParryState {
    entered: boolean;
    pool: number;
    max: number;
    attribute: 'might' | 'agility';
}
export interface ParryStripResult {
    spent: number;
    remainingDice: number;
    remainingPool: number;
    fullyParried: boolean;
    note: string;
}
/** Find the Passive Parry power item on an actor (templateId preferred). */
export declare function findPassiveParryItem(actor: any): any | null;
export declare function actorHasPassiveParry(actor: any): boolean;
/** Max pool from Passive Parry level (= 5 × Level). */
export declare function parryPoolCapForLevel(level: number): number;
export declare function resolveParryAttribute(actor: any): {
    attribute: 'might' | 'agility';
    value: number;
};
export declare function computeParryPoolMax(actor: any): {
    max: number;
    attribute: 'might' | 'agility';
    level: number;
    attrValue: number;
} | null;
export declare function getParryState(actor: Actor, combat: Combat | null): ParryState | null;
export declare function isInParry(actor: Actor, combat: Combat | null): boolean;
/** Pure: spend min(pool, attackDice) → remaining dice / Fully Parried. */
export declare function computeParryStrip(attackDice: number, pool: number): {
    spent: number;
    remainingDice: number;
    remainingPool: number;
    fullyParried: boolean;
};
/**
 * Enter Passive Parry for the round: set pool, give up remaining Attack Actions.
 * Requires Passive Parry. Used by Parry Stance radial.
 */
export declare function enterParry(actor: Actor, combat: Combat | null): Promise<{
    ok: boolean;
    reason?: string;
    pool?: number;
    max?: number;
    attribute?: string;
}>;
/**
 * Apply Parry strip against an incoming attack dice pool. Persists remaining pool.
 */
export declare function applyParryDiceStrip(defender: Actor, combat: Combat | null, attackDice: number): Promise<ParryStripResult>;
/** Equipped weapon / artifact weapon damage dice string (fallback 1d8). */
export declare function resolveEquippedWeaponDamageFormula(actor: any): string;
/** Combine weapon base + rider flat (e.g. "2d8" + "+3d8" → "2d8+3d8"). */
export declare function buildDamageFormula(base: string, riderFlat: string): string;
export declare function buildRiposteFormula(actor: any, riderFlat: string): string;
/**
 * Reflection: triggering damage (or attacker weapon proxy when Fully Parried / raw 0)
 * plus the reaction rider.
 */
export declare function buildReflectionFormula(triggerDamage: number, attacker: any, riderFlat: string): string;
export declare function isRiposteReaction(item: any): boolean;
export declare function isReflectionReaction(item: any): boolean;
//# sourceMappingURL=parry.d.ts.map