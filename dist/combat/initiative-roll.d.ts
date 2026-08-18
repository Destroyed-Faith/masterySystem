/**
 * Initiative Rolling System
 * Rolled ONCE at combat start: Mastery Rank d8 (keep all, 8s explode) + optional Combat
 * Reflexes. The score persists until spent (Initiative Exchange → Colorless Stones)
 * or another rule changes it.
 */
export { getCombatReflexesInitiativeLimits } from './combat-reflexes.js';
export interface InitiativeRollOptions {
    /**
     * Kept for callers; Combat Reflexes are no longer asked for at roll time.
     * The points are added in the Initiative Exchange row of Stone Powers.
     */
    promptCombatReflexes?: boolean;
}
/**
 * Initiative roll breakdown (pre–Initiative Shop).
 */
export interface InitiativeRollBreakdown {
    /** Sum of Mastery Rank d8 (exploding 8s). */
    diceTotal: number;
    /** Combat Reflexes points added to this roll (also updates skillsSpent). */
    combatReflexesSpent: number;
    /** Dice + CR — pool for the shop; order uses points left after shopping. */
    totalInitiative: number;
    /** Flat modifier from equipped armor, shield, and weapon (e.g. Heavy). */
    equipmentInitiativeModifier: number;
    masteryRank: number;
    /** Present after a local roll; omitted when the shop opens over the socket. */
    rollResult?: any;
}
/**
 * Roll initiative for one combatant: Mastery Rank d8 plus the flat modifiers.
 * Combat Reflexes are added afterwards in the Initiative Exchange row, so the
 * roll no longer interrupts with a popup.
 */
export declare function rollInitiativeForCombatant(combatant: Combatant, _options?: InitiativeRollOptions): Promise<InitiativeRollBreakdown>;
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