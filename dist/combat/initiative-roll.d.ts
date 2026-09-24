/**
 * Initiative Rolling System
 * Rolled ONCE at combat start: Mastery Rank d8 (keep all, 8s explode) plus the flat
 * Initiative modifiers (equipment, Passives, Wits scaling, Stone Boost, manual).
 * The score persists until spent (Initiative Exchange → Colorless Stones) or
 * another rule changes it.
 */
/**
 * Initiative roll breakdown (pre–Initiative Exchange).
 */
export interface InitiativeRollBreakdown {
    /** Sum of Mastery Rank d8 (exploding 8s). */
    diceTotal: number;
    /** Dice + flat modifiers — the score Initiative Exchange converts from. */
    totalInitiative: number;
    /** Flat modifier from equipped armor, shield, and weapon (e.g. Heavy). */
    equipmentInitiativeModifier: number;
    masteryRank: number;
    /** Present after a local roll; omitted when the shop opens over the socket. */
    rollResult?: any;
}
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
export declare function formatInitiativeDiceRollLine(diceTotal: number): string;
export declare function formatInitiativeArmorPenaltyLine(equipmentModifier: number): string;
/** English toast / fallback after the player has rolled. */
export declare function formatInitiativeExchangeSummary(input: {
    diceTotal: number | null;
    initiative: number;
}): string;
/** Drop the stored roll so the Initiative button shows again. Does not roll. */
export declare function releasePcInitiativeRoll(actor: any, combatant: any): Promise<void>;
/**
 * Roll initiative for one combatant: Mastery Rank d8 plus the flat modifiers.
 * The roll stands as rolled; no Skill Points are spent on it.
 */
export declare function rollInitiativeForCombatant(combatant: Combatant): Promise<InitiativeRollBreakdown>;
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
/**
 * Sort compare: lower result acts first.
 * Higher initiative first. Ties: player (character) before NPC/summon.
 * Player vs player (or any remaining tie): Agility, then Wits, then Intellect, then Resolve.
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