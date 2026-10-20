/**
 * Absorption — closed premium Passive subsystem (Rules v0.9.9.5).
 *
 * No extra HP. Each Health Bar Scarred by eligible hostile damage is one
 * trigger (max 4 per combat) and grants Temporary Colorless Stones equal to
 * the Passive's stone rate. Stones arrive Ready and expire at combat end.
 */
/** Find the Absorption Passive power item on an actor. */
export declare function findAbsorptionItem(actor: any): any | null;
/** v0.9.9.5: Absorption grants no extra HP. */
export declare function absorptionHpPerBar(_actor: any): number;
/** Active Buff: Absorption Stone Increase — printed extra Stones on first trigger/Round. */
export declare function getAbsorptionStoneIncreaseFromActiveBuff(actor: any): number;
export declare function getAbsorbedDamage(actor: any, combat: any): number;
/**
 * PG attack sequence step 18: after the damage instance has fully resolved,
 * accumulate eligible actual HP loss and harvest Temporary Colorless Stones.
 * Call with the HP actually removed from Health Bars (not Temp HP).
 */
/**
 * Grant Absorption stones for Health Bars that just became Scarred.
 * Returns stones granted (0 when the Passive is absent or the 4-trigger cap is full).
 */
export declare function grantAbsorptionForScarredBars(actor: any, newlyScarred: number): Promise<number>;
export declare function accumulateAbsorbedDamage(target: any, hpLost: number, attacker?: any): Promise<number>;
/**
 * Turn end for the actor: Absorption-granted Temporary Colorless Stones that
 * were gained before this turn expire ("until the end of your next Turn").
 */
export declare function expireAbsorptionStonesAtTurnEnd(actor: any, combat: any): Promise<void>;
/** Combat end: remaining Absorbed Damage disappears. Pending Absorption stones expire with the fight. */
export declare function clearAbsorptionForCombat(combat: any, actors?: any[]): Promise<void>;
//# sourceMappingURL=absorption.d.ts.map