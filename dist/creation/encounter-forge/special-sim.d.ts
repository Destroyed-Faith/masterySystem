/**
 * Deterministic expected-value engine for diminishing Special stacks.
 *
 * Models the canonical turn-start order from status-tick.ts:
 *   Tick (Ruin damage / Regeneration heal / ...) ->
 *   Natural Special Recovery (reduce negative stacks by victim MR total) ->
 *   Decay 1 on every remaining diminishing stack.
 *
 * The simulator tracks EXPECTED stack values (fractional), which is a
 * documented approximation of the stochastic process: applying "hit chance ×
 * special value" per round instead of rolling. Errors stay small because
 * specials cap at the application limit (4 × MR new points per round) and
 * decay linearly.
 *
 * Mechanical effects implemented per canonical special-effects.ts:
 *   ruin/exorcism/requiem — tick damage (ignores Armor), corrode — Armor −X,
 *   expose — Evade −X, disoriented — attack dice −X, challenge — attack dice
 *   −X when ignoring the challenger, sundered — +1d8 per 2 on non-Spell hits,
 *   hex — +1d8 per 2 on Spell hits, lacerate — movement-triggered damage,
 *   slow — Speed −X + damage when standing still, weaken/soulburn — attribute
 *   pool dice −X, blight — Stress tick (NPCs have no stress track; noted).
 */
export type SpecialStacks = Map<string, number>;
export declare function isKnownSpecial(id: string): boolean;
/** Add expected special points, honoring the 4×MR-per-round application cap. */
export declare function applyExpectedSpecial(stacks: SpecialStacks, appliedThisRound: SpecialStacks, id: string, expectedValue: number, victimMr: number, wardValue?: number): void;
export interface TurnStartResult {
    /** HP damage from ticking specials (ignores Armor). */
    tickDamage: number;
    /** Stress from Blight ticks (only meaningful for PCs). */
    tickStress: number;
}
/**
 * Process the victim's turn start: Tick -> Natural Recovery (MR total,
 * greedy on the highest stacks — mirrors the default HUD/greedy plan) ->
 * Decay 1 per stack.
 */
export declare function processTurnStart(stacks: SpecialStacks, victimMr: number): TurnStartResult;
export declare function armorDelta(stacks: SpecialStacks): number;
export declare function evadeDelta(stacks: SpecialStacks): number;
export declare function attackDiceDelta(stacks: SpecialStacks): number;
/** Pool reduction for physical (might/agility) attackers. */
export declare function physicalPoolDelta(stacks: SpecialStacks): number;
/** Pool reduction for casting attackers. */
export declare function castingPoolDelta(stacks: SpecialStacks): number;
/** Bonus damage dice against this victim: Sundered (non-spell) / Hex (spell). */
export declare function bonusDiceVsVictim(stacks: SpecialStacks, isSpellHit: boolean): number;
/**
 * Expected movement-triggered damage this round (Lacerate: first voluntary
 * move; Slow: damage when NOT moving). `expectedMovesPerRound` ~1 for mobile
 * combatants, 0 for stationary ones.
 */
export declare function expectedMovementDamage(stacks: SpecialStacks, expectedMovesPerRound: number): number;
/** Sum of all negative stack values (diagnostics / accumulation warnings). */
export declare function totalNegativeStacks(stacks: SpecialStacks): number;
//# sourceMappingURL=special-sim.d.ts.map