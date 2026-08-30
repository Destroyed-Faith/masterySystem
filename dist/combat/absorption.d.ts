/**
 * Absorption — closed premium Passive subsystem (Rules/passives.md).
 *
 * While the Absorption Passive is slotted:
 *  • every normal Health Bar gains +4 Max HP per Passive Level, and
 *  • eligible hostile actual HP loss accumulates as Absorbed Damage. Whenever
 *    the accumulator reaches the character's Vitality, it is reduced by
 *    Vitality and the character gains 1 Temporary Colorless Stone (Ready,
 *    gone at the end of their next turn). Excess carries over; the
 *    accumulator is cleared when combat ends.
 */
/** Find the Absorption Passive power item on an actor. */
export declare function findAbsorptionItem(actor: any): any | null;
/** Additional Max HP per normal Health Bar (4 per Passive Level). */
export declare function absorptionHpPerBar(actor: any): number;
export declare function getAbsorbedDamage(actor: any, combat: any): number;
/**
 * PG attack sequence step 18: after the damage instance has fully resolved,
 * accumulate eligible actual HP loss and harvest Temporary Colorless Stones.
 * Call with the HP actually removed from Health Bars (not Temp HP).
 */
export declare function accumulateAbsorbedDamage(target: any, hpLost: number, attacker?: any): Promise<number>;
/**
 * Turn end for the actor: Absorption-granted Temporary Colorless Stones that
 * were gained before this turn expire ("until the end of your next Turn").
 */
export declare function expireAbsorptionStonesAtTurnEnd(actor: any, combat: any): Promise<void>;
/** Combat end: remaining Absorbed Damage disappears. */
export declare function clearAbsorptionForCombat(combat: any): Promise<void>;
//# sourceMappingURL=absorption.d.ts.map