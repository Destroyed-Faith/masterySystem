/**
 * Damage Negation — closed premium defensive subsystem.
 *
 * While the Damage Negation Passive is slotted, the actor gains a per-combat
 * Reserve of `4 × Passive Level` Damage Dice. Before an eligible Damage Pool
 * is rolled, the defender may spend points 1:1 to remove Damage Dice from the
 * pool assigned to them.
 *
 * Pending rule R-01 (2026-10-17): there is no half-pool cap. Caps are only
 * available negation points and the number of incoming damage dice.
 */
/** Find the Damage Negation Passive power item on an actor. */
export declare function findDamageNegationItem(actor: any): any | null;
/** Reserve size for a Passive level (4 Damage Dice per level). */
export declare function damageNegationReserveForLevel(level: number): number;
/**
 * @deprecated R-01 removed the half-pool limit. Kept as alias returning the
 * full original dice count so older callers keep a sensible upper bound.
 */
export declare function damageNegationHalfPoolCap(originalDice: number): number;
/** Max dice removable for one pool: min(original dice, available points). */
export declare function damageNegationSpendCap(originalDice: number, available: number): number;
/**
 * Remaining passive Reserve for the current combat. Lazily initialized to the
 * full listed value the first time it is read during a combat.
 */
export declare function getDamageNegationRemaining(actor: any, combat: any): number;
export declare function spendDamageNegation(actor: any, combat: any, amount: number): Promise<boolean>;
/** Stone-granted temporary Damage Negation available this turn (round state). */
export declare function getTempDamageNegation(actor: any, combat: any): number;
/** Active Buff temporary Damage Negation (spend before Passive reserve). */
export declare function getBuffDamageNegation(actor: any): number;
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
export declare function formatDamageNegationDialogContent(input: {
    defenderName: string;
    attackerName: string;
    totalDice: number;
    available: number;
    reserve: number;
    tempDn: number;
    buffDn?: number;
}): string;
/**
 * Before the Damage Pool is rolled, apply Damage Negation. NPCs/summons with
 * sheet DN auto-remove that many dice. Characters get a spend prompt.
 * R-01: no half-pool limit — full negation of all damage dice is legal.
 */
export declare function promptDamageNegationSpend(target: any, opts: {
    attacker?: any;
    totalDice: number;
}): Promise<DamageNegationSpend>;
/** Combat end: the Reserve is lost; a fresh one is gained next combat. */
export declare function clearDamageNegationForCombat(combat: any): Promise<void>;
//# sourceMappingURL=damage-negation.d.ts.map