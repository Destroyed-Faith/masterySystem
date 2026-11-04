/**
 * Diminishing Special-Effect runtime: start-of-turn Tick + Decay.
 *
 * At the start of the affected creature's turn, each diminishing Special
 * resolves its Tick (if any) and then decays by 1 (removed at 0), per the
 * Special Effects Reference:
 *   - Ruin(X)         : take 4 × X damage (ignores Armor; eligible DR still applies)
 *   - Exorcism(X)     : take X damage (ignores Armor)
 *   - Requiem(X)      : take X damage (ignores Armor)
 *   - Blight(X)       : take X Stress (ignores Stress Armor)
 *   - Regeneration(X) : heal X HP
 *
 * Movement-based ticks (Lacerate, Slow end-of-turn damage) are resolved from
 * movement tracking, not here. Value-based maluses (Corrode, Expose, Slow speed,
 * Soulburn, Weaken, Disoriented, Challenge) are applied in `prepareDerivedData`
 * / roll builders and only decay here. After Ticks, a stored Natural Special
 * Recovery plan (Stone Powers) reduces one or more negative Diminishing
 * Specials. Without a plan the HUD applies one Special by full Mastery Rank.
 * Cleanse Maintenance (Ward / Active Buff) then reduces one eligible Special
 * after Decay.
 *
 * Runs GM-side only so a single client mutates the actor.
 */
/** Printed Ruin Tick damage: 4 × current stack value. Does not alter the stored stack. */
export declare function ruinTickDamage(stackValue: number): number;
/**
 * Ongoing Special Tick damage ignores Armor. Eligible percentage Damage Reduction
 * still reduces the remaining pool (same DR step as attack mitigation, armor = 0).
 */
export declare function mitigateArmorIgnoringTickDamage(rawDamage: number, damageReductionPct: number): {
    damage: number;
    drPercent: number;
};
/**
 * Resolve start-of-turn Tick + Decay for one actor's diminishing Specials.
 * Returns a short human summary of what happened (for chat), or ''.
 */
export declare function processTurnStartStatusTick(actor: any): Promise<string>;
/**
 * End-of-turn Special resolution for the creature whose turn just ended.
 * Currently: Brace(X) — "at the end of each of your turns, reduce Brace by 1;
 * if Brace reaches 0, it ends."
 */
export declare function processTurnEndSpecials(actor: any): Promise<string>;
/**
 * Post a structured chat summary of Tick / Recovery / Decay / Cleanse.
 */
export declare function announceStatusTick(actor: any, summary: string): Promise<void>;
//# sourceMappingURL=status-tick.d.ts.map