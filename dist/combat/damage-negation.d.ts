/**
 * Damage Negation — closed premium defensive subsystem (Rules/passives.md).
 *
 * While the Damage Negation Passive is slotted, the actor gains a per-combat
 * Reserve of `4 × Passive Level` Damage Dice. Before an eligible Damage Pool
 * is rolled, the defender may spend points 1:1 to remove Damage Dice from the
 * pool assigned to them. All Damage Negation combined can never remove more
 * than half of the original Damage Dice (rounded down). The Reserve does not
 * refresh mid-combat and is lost when the combat ends.
 */
/** Find the Damage Negation Passive power item on an actor. */
export declare function findDamageNegationItem(actor: any): any | null;
/** Reserve size for a Passive level (4 Damage Dice per level). */
export declare function damageNegationReserveForLevel(level: number): number;
/** Maximum removable dice for one Damage Pool: floor(original dice / 2). */
export declare function damageNegationHalfPoolCap(originalDice: number): number;
/**
 * Remaining passive Reserve for the current combat. Lazily initialized to the
 * full listed value the first time it is read during a combat.
 */
export declare function getDamageNegationRemaining(actor: any, combat: any): number;
export declare function spendDamageNegation(actor: any, combat: any, amount: number): Promise<boolean>;
/** Stone-granted temporary Damage Negation available this turn (round state). */
export declare function getTempDamageNegation(actor: any, combat: any): number;
export interface DamageNegationSpend {
    /** Damage Dice removed from the pool assigned to this defender. */
    diceRemoved: number;
    note: string;
}
/**
 * Active combat block for an NPC/summon (active boss phase, else root combat).
 */
export declare function resolveNpcActiveCombatBlock(actor: any): Record<string, unknown>;
/**
 * NPC/summon sheet Damage Negation (dice removed automatically per incoming
 * Damage Pool). Characters use the Passive reserve + spend dialog instead.
 */
export declare function getNpcDamageNegationDice(actor: any): number;
/**
 * PG attack sequence step 11: before the Damage Pool is rolled, apply Damage
 * Negation. NPCs/summons with sheet DN auto-remove that many dice (no dialog,
 * no depleting reserve — every eligible hit). Characters keep the spend prompt
 * against Passive Reserve + temporary stone DN. Never exceeds the Half-Pool Limit.
 */
export declare function promptDamageNegationSpend(target: any, opts: {
    attacker?: any;
    totalDice: number;
}): Promise<DamageNegationSpend>;
/** Combat end: the Reserve is lost; a fresh one is gained next combat. */
export declare function clearDamageNegationForCombat(combat: any): Promise<void>;
//# sourceMappingURL=damage-negation.d.ts.map