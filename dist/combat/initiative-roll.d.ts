/**
 * Initiative Rolling System
 * Determined ONCE at combat start:
 * - Risky (default): Mastery Rank d8 (keep all, 8s explode)
 * - Controlled: fixed max(Agility Pool, Wits Pool), no MR multiplier
 * Then apply flat Initiative modifiers once (equipment, Passives, Wits scaling,
 * Stone Boost, manual). Score persists until spent (Initiative Exchange →
 * Colorless Stones) or another rule changes it.
 */
export type InitiativeMethod = 'risky' | 'controlled';
/**
 * Initiative roll breakdown (pre–Initiative Exchange).
 */
export interface InitiativeRollBreakdown {
    /** Risky: sum of Mastery Rank d8. Controlled: fixed Agility/Wits max (before mods). */
    diceTotal: number;
    /** Base + flat modifiers — the score Initiative Exchange converts from. */
    totalInitiative: number;
    /** Flat modifier from equipped armor, shield, and weapon (e.g. Heavy). */
    equipmentInitiativeModifier: number;
    masteryRank: number;
    /** Method used for this determination. */
    method: InitiativeMethod;
    /** Present after a local roll; omitted when the shop opens over the socket. */
    rollResult?: any;
}
/** Controlled base: higher of Agility Pool and Wits Pool (no MR multiplier). */
export declare function controlledInitiativeBase(actor: any): number;
export declare function normalizeInitiativeMethod(raw: unknown): InitiativeMethod;
export declare const INITIATIVE_ROLLED_FLAG = "initiativeRolledFor";
/** True when this combatant already kept an initiative total for this combat round. */
export declare function initiativeRollAlreadyRecorded(flag: {
    combatId?: string;
    round?: number;
    total?: number;
} | null | undefined, combatId: string | null | undefined, round: number): boolean;
/**
 * Player characters roll from the Initiative line in Stone Powers, not when
 * the dialog opens. A stored total for this combat counts as already rolled,
 * even on a later round. Foundry's seeded 0 does not.
 */
export declare function pcNeedsManualInitiativeRoll(input: {
    actorType?: string;
    surprised?: boolean;
    combatId?: string | null;
    recordedCombatId?: string | null;
    recordedTotal?: number | null;
    initiative?: number | null;
    combatantHasRecordedValue?: boolean;
}): boolean;
export declare function formatSignedInitiativeModifier(n: number): string;
export declare function formatInitiativeDiceRollLine(diceTotal: number, method?: InitiativeMethod): string;
export declare function formatInitiativeArmorPenaltyLine(equipmentModifier: number): string;
/** English toast / fallback after the player has rolled. */
export declare function formatInitiativeExchangeSummary(input: {
    diceTotal: number | null;
    initiative: number;
}): string;
/** Drop the stored roll so the Initiative button shows again. Does not roll. */
export declare function releasePcInitiativeRoll(actor: any, combatant: any): Promise<void>;
/**
 * Determine initiative for one combatant (Risky roll or Controlled fixed base)
 * plus flat modifiers. No Skill Points are spent.
 */
export declare function rollInitiativeForCombatant(combatant: Combatant, opts?: {
    method?: InitiativeMethod;
}): Promise<InitiativeRollBreakdown>;
/** True when an NPC still needs a real initiative roll (Foundry often seeds 0). */
export declare function needsNpcInitiativeRoll(combatant: Combatant, force?: boolean): boolean;
/** Roll initiative for NPCs / summons / divine only. PCs roll on their own client. */
export declare function rollNpcInitiativeOnly(combat: Combat, opts?: {
    force?: boolean;
}): Promise<number>;
/**
 * After Stone Powers / Initiative Exchange: leftover NPCs roll, then sort.
 * PCs roll inside the Stone Powers dialog.
 */
export declare function executeInitiativePhase(combat: Combat): Promise<void>;
/** Stable d8 from the first sort. Missing flags sort as 0 until `ensureInitiativeTieBreak` stores one. */
export declare function tieBreakD8(combatant: any): number;
export declare function ensureInitiativeTieBreak(combatant: any): Promise<number>;
/**
 * Sort compare: lower result acts first.
 * Higher initiative first. Ties: Mastery Rank, then Agility pool, then a stored d8.
 */
export declare function compareInitiativeCombatants(a: any, b: any): number;
/** Remaining shop score after purchases. May be negative — do not clamp to 0. */
export declare function remainingInitiativeAfterShop(pool: number, cost: number): number;
/**
 * Index of the combatant who should act first (same rules as combat sort).
 */
export declare function findTurnIndexHighestInitiativeFirst(combat: Combat): number;
/** Foundry turn order uses the same Mastery tie-break as the first-actor sync. */
export declare function initializeInitiativeOrder(): void;
/** After `setupTurns()`, ensure `combat.turn` points at highest-initiative combatant (Mastery first-actor rule). */
export declare function syncCombatTurnToHighestInitiativeFirst(combat: Combat): Promise<void>;
/** @deprecated Prefer executeInitiativePhase; kept for compatibility. */
export declare function rollInitiativeForAllCombatants(combat: Combat): Promise<void>;
/**
 * Tracker / sheet rescue: open Stone Powers (Initiative Exchange lives there now).
 */
export declare function openInitiativeShopForTrackerRescue(combatant: Combatant, combat: Combat): Promise<boolean>;
//# sourceMappingURL=initiative-roll.d.ts.map