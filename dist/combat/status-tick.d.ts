/**
 * Diminishing Special-Effect runtime: start-of-turn Tick + Decay.
 *
 * At the start of the affected creature's turn, each diminishing Special
 * resolves its Tick (if any) and then decays by 1 (removed at 0), per the
 * Special Effects Reference:
 *   - Ruin(X)         : take X damage (ignores Armor)
 *   - Exorcism(X)     : take X damage (ignores Armor)
 *   - Requiem(X)      : take X damage (ignores Armor)
 *   - Blight(X)       : take X Stress (ignores Stress Armor)
 *   - Regeneration(X) : heal X HP
 *
 * Movement-based ticks (Lacerate, Slow end-of-turn damage) are resolved from
 * movement tracking, not here. Value-based maluses (Corrode, Expose, Slow speed,
 * Soulburn, Weaken, Disoriented, Challenge) are applied in `prepareDerivedData`
 * / roll builders and only decay here. Cleanse Maintenance (Ward / Active Buff)
 * reduces exactly one eligible Special after Tick + Decay.
 *
 * Runs GM-side only so a single client mutates the actor.
 */
/**
 * Resolve start-of-turn Tick + Decay for one actor's diminishing Specials.
 * Returns a short human summary of what happened (for chat), or ''.
 */
export declare function processTurnStartStatusTick(actor: any): Promise<string>;
/**
 * Post a compact chat summary of a turn-start Tick, if anything happened.
 */
export declare function announceStatusTick(actor: any, summary: string): Promise<void>;
//# sourceMappingURL=status-tick.d.ts.map