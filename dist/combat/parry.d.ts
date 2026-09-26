/**
 * Passive Parry — one pool, two deliveries.
 * Martial: strip Attack Dice (Might or Agility). 0 dice = Fully Parried.
 * Spell: strip Casting Dice (Intellect, Resolve, or Influence) from a direct
 * Spell whose origin is within 22 m. 0 dice = Fully Countered.
 * Entering Parry spends only the base Attack Action. Extra Attacks remain.
 */
export declare const SPELL_PARRY_ORIGIN_M = 22;
export type ParryDelivery = 'martial' | 'spell';
export type ParryAttribute = 'might' | 'agility' | 'intellect' | 'resolve' | 'influence';
export interface ParryState {
    entered: boolean;
    pool: number;
    max: number;
    attribute: ParryAttribute;
    delivery: ParryDelivery;
}
export interface ParryStripResult {
    spent: number;
    remainingDice: number;
    remainingPool: number;
    fullyParried: boolean;
    /** Spell delivery reduced the Casting Pool to 0. */
    countered: boolean;
    note: string;
}
/** Find the Passive Parry power item on an actor (templateId preferred). */
export declare function findPassiveParryItem(actor: any): any | null;
export declare function actorHasPassiveParry(actor: any): boolean;
/** Max pool from Passive Parry level (printed ceil(5 × Level / 2) table). */
export declare function parryPoolCapForLevel(level: number): number;
export declare function resolveParryAttribute(actor: any, delivery?: ParryDelivery): {
    attribute: ParryAttribute;
    value: number;
};
export declare function computeParryPoolMax(actor: any, delivery?: ParryDelivery): {
    max: number;
    attribute: ParryAttribute;
    level: number;
    attrValue: number;
    delivery: ParryDelivery;
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
 * Enter Passive Parry for the round. Spends only the base Attack Action
 * (`baseAttackLocked`). Extra Attack actions stay available.
 */
export declare function enterParry(actor: Actor, combat: Combat | null, opts?: {
    delivery?: ParryDelivery;
}): Promise<{
    ok: boolean;
    reason?: string;
    pool?: number;
    max?: number;
    attribute?: string;
}>;
/**
 * Apply Parry strip against an incoming attack dice pool. Persists remaining pool.
 */
export declare function applyParryDiceStrip(defender: Actor, combat: Combat | null, attackDice: number, opts?: {
    spell?: boolean;
    attacker?: any;
}): Promise<ParryStripResult>;
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