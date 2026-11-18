/**
 * Ruin immediate damage (Actives v0.9.9.6, adopted 2026-11-18).
 *
 * Whenever Ruin stacks are newly applied, the creature immediately loses
 * 4 HP per newly applied stack. Only stacks actually added after Ward /
 * Special Negation count. The damage ignores Armor and is not Attack Damage;
 * Damage Reduction and Temporary HP apply. Damage Negation removes Damage
 * Dice before a roll, so it has nothing to remove from this fixed amount.
 * Balance Review: open — printed Ruin values are unchanged.
 */
export declare const RUIN_IMMEDIATE_DAMAGE_PER_STACK = 4;
/** Raw immediate damage for `stacks` newly applied Ruin stacks. */
export declare function ruinImmediateDamage(stacks: number): number;
export interface RuinImmediateResult {
    stacks: number;
    rawDamage: number;
    drPercent: number;
    tempHPAbsorbed: number;
    barDamage: number;
    /** Actor update patch (health bars + Temp HP); empty when nothing changes. */
    patch: Record<string, unknown>;
    note: string;
}
/**
 * Compute the immediate Ruin damage for a target without writing it. The
 * patch is meant to be merged into the same update that stores the new
 * Ruin stacks so stacks and HP change atomically.
 */
export declare function buildRuinImmediateDamage(target: any, stacks: number): Promise<RuinImmediateResult>;
/** Chat line for applied immediate Ruin damage. */
export declare function announceRuinImmediateDamage(target: any, result: RuinImmediateResult): Promise<void>;
/** Post-HP-change hooks shared with the Ruin Tick (boss phase, defeated token). */
export declare function afterRuinImmediateDamage(target: any, result: RuinImmediateResult): Promise<void>;
//# sourceMappingURL=ruin-immediate.d.ts.map