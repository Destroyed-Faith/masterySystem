/**
 * Action Economy System
 *
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */
export type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';
/**
 * Nutzungszähler für General-Stonepowers (generic.*): ein Wert pro Macht/Zug — unabhängig davon,
 * welcher Pool bezahlt hat. Sonst startet jede Farbe wieder bei Kosten 1 und die UI bleibt leer.
 */
export declare function getGenericStonePowerUsageCount(actor: Actor, abilityKey: string, combat: Combat | null): number;
export declare function incrementGenericStonePowerUsage(actor: Actor, abilityKey: string, combat: Combat | null): Promise<void>;
/**
 * Round state stored on actor flags
 * Tracks action budgets, bonuses, and stone usage per round
 */
export interface RoundState {
    /** Foundry combat document id — stale state from a previous encounter is never reused. */
    combatId?: string;
    round: number;
    turn: number;
    isPC: boolean;
    movementActions: {
        total: number;
        used: number;
    };
    attackActions: {
        total: number;
        used: number;
    };
    reactionActions: {
        total: number;
        used: number;
    };
    moveBonusMeters: number;
    initiativeShop?: {
        round: number;
        extraMovement: number;
        initiativeSwap: boolean;
        extraReaction: boolean;
        removeStress: boolean;
        extraAttack: boolean;
    };
    /** Power item IDs already used this combat round (max one use per power per round). */
    usedPowerIdsThisRound?: string[];
    stoneBonuses?: {
        extraAttacks: number;
        extraReactions: number;
        extraMoveMeters: number;
        /** Generic per-hit damage-die bonus (legacy field — still consumed by damage-dialog). */
        damageBonus?: number;
        /** New: Might.MeleeDamage tier value — bonus damage dice on next MELEE damage roll only, then cleared. */
        meleeDamageBonusDice?: number;
        /** Generic armor-penetration on attacks (legacy field — kept for compatibility). */
        armorPenetration?: number;
        /** Might.IgnoreArmor — ignore this much armor on melee attacks this turn. */
        meleeIgnoreArmor?: number;
        evadeBonus?: number;
        /** Legacy: number of attacks-this-round that may have Crit(1). Consumed by attack-roll-handler. */
        critRaises?: number;
        /** Might.Armor — flat temp armor until start of next turn. */
        tempArmor?: number;
        /** Legacy: +keep raises on next spell/skill roll (saves/skills). */
        freeRaises?: number;
        saveKeepBonus?: number;
        spellPoolDice?: number;
        spellKeepDice?: number;
        /**
         * Players Guide ~5746 (legacy `influence.extraPassive`): when > 0, the
         * actor may trigger one of their owned Passive abilities a second time
         * this round. Kept for backward compatibility with downstream code.
         */
        extraPassives?: number;
        /** Vitality.TempHP — total temp HP granted this turn (audit/UI only). */
        tempHpGrantedThisTurn?: number;
        /** Vitality.EndureInjury — number of wound/injury penalties to ignore until next turn. `-1` = ignore all. */
        ignoreWoundPenalties?: number;
        /** Vitality.SecondChance — free boxes left in Wounded when downing-blow is converted (1..4). */
        secondChanceFreeBoxes?: number;
        /** Intellect.SpellRaises — automatic raises added to every spell this turn. */
        spellAutoRaises?: number;
        /** Intellect.SpellDefense — bonus to Saves vs. Spells until next turn. */
        spellSaveBonus?: number;
        /** Intellect.SpellAction — extra attack actions this round, restricted to Spells. */
        extraSpellActions?: number;
        /** Intellect.SpecialBoost — +X to one eligible Special on each spell this turn. */
        spellSpecialBoost?: number;
        /** Resolve.DamageReductionBoost — additional %DR until next turn (0.10/0.20/0.30). */
        damageReductionBoostPct?: number;
        /** Resolve.SaveBoost — flat bonus to all Saves this round. */
        saveAllBonus?: number;
        /** Resolve.SpecialReduction — minus to incoming Special values against you this round (floored at 0). */
        incomingSpecialReduction?: number;
        /** Wits.Phasing — phasing charges granted by stone power (consumed by phasing system). */
        phasingChargesFromStones?: number;
        /** Wits.InitiativeBoost — flat bonus to Initiative this round. */
        initiativeBonus?: number;
        /** Wits.ReactionRange — extra meters added to all of your Reaction ranges this round. */
        reactionRangeBonus?: number;
    };
}
/**
 * Stone usage tracking key format: `${attribute}:${abilityKey}:${round}:${turn}`
 */
export type StoneUsageKey = string;
/**
 * Check if an actor is a PC
 */
export declare function isPC(actor: Actor | null | undefined): boolean;
/**
 * Actor document that owns `mastery-system` roundState / stoneUsage flags for action economy.
 *
 * Unlinked PC tokens use a synthetic `token.actor` on the canvas; stone powers and `game.actors.get`
 * often refer to the **prototype** actor. Only `actorLink === true` is treated as linked; any other
 * value (false / undefined) uses the prototype so tracker, radial, and chat agree.
 * NPCs stay per-actor (no redirect) so multiple unlinked copies remain independent.
 */
export declare function getActionEconomyActor(actor: Actor | null | undefined): Actor | null;
/**
 * Get round state from actor flags
 */
export declare function getRoundState(actor: Actor, combat: Combat | null): RoundState;
/** Extra movement distance (m) this round from initiative shop, stones, etc. — for range previews, not action counts. */
export declare function getMovementRangeBonusMeters(actor: Actor, combat: Combat | null): number;
/**
 * Set round state on actor
 */
export declare function setRoundState(actor: Actor, state: RoundState): Promise<void>;
/**
 * Whether this power item has already been used this round (combat powers only).
 */
export declare function hasPowerBeenUsedThisRound(actor: Actor, combat: Combat | null, powerItemId: string): boolean;
/**
 * Record a power as used this round. No-op if already recorded.
 */
export declare function markPowerUsedThisRound(actor: Actor, combat: Combat | null, powerItemId: string): Promise<void>;
/**
 * Undo mark (e.g. attack roll failed after spending an action).
 */
export declare function unmarkPowerUsedThisRound(actor: Actor, combat: Combat | null, powerItemId: string): Promise<void>;
/**
 * Apply initiative shop bonuses to round state
 * Called when shop purchases are made or at start of round
 */
export declare function applyInitiativeShopBonuses(actor: Actor, combatant: Combatant, combat: Combat): Promise<void>;
export interface StonePowersConfigLockState {
    combatId: string;
    round: number;
}
/**
 * True after this PC has spent movement, attack, or reaction in the current combat round
 * (Stone Powers attribute defaults / activations are then read-only until the next round).
 */
export declare function isStonePowersConfigurationLocked(actor: Actor, combat: Combat | null): boolean;
export declare function lockStonePowersConfigurationForRound(actor: Actor, combat: Combat | null): Promise<void>;
export declare function clearStonePowersConfigurationLock(actor: Actor): Promise<void>;
export declare function clearStonePowersConfigurationLocksInCombat(combat: Combat): Promise<void>;
export declare function spendAttackAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Spend a movement action
 */
export declare function spendMovementAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Spend a reaction action
 */
export declare function spendReactionAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Get available attack actions (remaining count).
 * Stunned(X) locks X attack actions for the current round — the total is
 * clamped before subtracting `used`, never going below 0.
 */
export declare function getAvailableAttackActions(actor: Actor, combat: Combat | null): number;
/**
 * Get available movement actions (remaining count)
 */
export declare function getAvailableMovementActions(actor: Actor, combat: Combat | null): number;
/**
 * Remaining reaction actions this combat round (initiative shop / stones increase `total`).
 */
export declare function getAvailableReactionActions(actor: Actor, combat: Combat | null): number;
/** Read-only `{ used, total, remaining }` for UI / chat. */
export declare function getReactionActionsSummary(actor: Actor, combat: Combat | null): {
    used: number;
    total: number;
    remaining: number;
};
/**
 * Consume an attack action (alias for spendAttackAction)
 */
export declare function consumeAttackAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Refund one attack action if any were spent this round (e.g. attack flow failed after spend).
 */
export declare function refundAttackAction(actor: Actor, combat: Combat | null): Promise<void>;
/**
 * Consume a movement action (alias for spendMovementAction)
 */
export declare function consumeMovementAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Get stone usage count for an ability this turn
 */
export declare function getStoneUsageCount(actor: Actor, attribute: AttributeKey, abilityKey: string, combat: Combat | null): number;
/**
 * Increment stone usage count for an ability this turn
 */
export declare function incrementStoneUsage(actor: Actor, attribute: AttributeKey, abilityKey: string, combat: Combat | null): Promise<void>;
/**
 * Calculate exponential stone cost: 2^(usesThisTurn)
 */
export declare function calculateStoneCost(usesThisTurn: number): number;
/**
 * Get stone pool for an attribute
 */
export declare function getStonePool(actor: Actor, attribute: AttributeKey): {
    current: number;
    max: number;
};
/**
 * Attributes with per-pool combat stones (must match `MasteryActor.prepareBaseData`).
 */
export declare const STONE_POOL_ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
/**
 * Persist max/current from floor(attribute/8) minus sustained — full pool for round-1 stone assignment.
 * Pass the **combatant's** actor (token document for unlinked PCs) so data matches Stone Powers UI.
 */
export declare function refillStonePoolsFromAttributes(actor: Actor): Promise<void>;
/**
 * Fix stale max (e.g. 0 in DB) and clamp current without forcing a full refill (round 2+).
 */
export declare function syncStonePoolCapsFromAttributes(actor: Actor): Promise<void>;
/**
 * Set stone pool current value
 */
export declare function setStonePool(actor: Actor, attribute: AttributeKey, current: number): Promise<void>;
/**
 * Spend stones for an ability and apply its effect
 *
 * @param actor The actor using the ability
 * @param combatant The combatant in combat
 * @param attribute Which attribute pool to use
 * @param abilityKey Unique key for this ability (e.g., 'generic.extraAttack')
 * @param applyEffect Function to apply the ability effect (adds actions/bonuses to roundState)
 * @returns true if successful, false if failed
 */
export declare function spendStoneAbility(actor: Actor, _combatant: Combatant, attribute: AttributeKey, abilityKey: string, applyEffect: (roundState: RoundState) => Promise<void>, expectedCost?: number): Promise<boolean>;
/**
 * General-Stonepower mit Aufteilung auf mehrere Pool-Farben (wie im Dialog pro Lane).
 * Summe pro Attribut muss exakt `calculateStoneCost(uses)` ergeben.
 */
export declare function spendGenericStoneAbilityWithPerAttributeDeductions(actor: Actor, _combatant: Combatant, abilityKey: string, perAttributeCounts: Partial<Record<AttributeKey, number>>, applyEffect: (roundState: RoundState) => Promise<void>, expectedCost?: number): Promise<boolean>;
/**
 * End-of-round stone regen: Mastery Rank stones, automatic.
 * Each stone goes to the next pool that can accept it, in order of attribute value (highest first);
 * ties between equal attributes are shuffled randomly.
 */
export declare function applyAutomaticStoneRegen(actor: Actor): Promise<void>;
/**
 * Regenerate stones at end of round (automatic; no player allocation dialog).
 */
export declare function regenStonesEndOfRound(combat: Combat): Promise<void>;
/**
 * Restore all stone pools to max after combat
 */
export declare function restoreStonesAfterCombat(combat: Combat): Promise<void>;
/**
 * Initialize round state for all combatants at combat start
 */
export declare function initializeCombatRoundState(combat: Combat): Promise<void>;
/**
 * Reset turn state (called on turn change)
 * Resets used counts but keeps totals and bonuses
 */
export declare function resetTurnState(actor: Actor, combat: Combat | null): Promise<void>;
/**
 * Clear per-turn stone power bonuses on an actor when their spotlight in the
 * initiative tracker ends (e.g. +8 Evade, +damage dice, armor pen — "this turn").
 * Does not remove round-long initiative-shop totals on `stoneBonuses.extraAttacks` etc.
 */
export declare function clearCombatStoneTurnBonusesForActor(actor: Actor, combat: Combat | null): Promise<void>;
/**
 * Reset round state (called on round change)
 * Clears bonuses and re-applies initiative shop for new round
 */
export declare function resetRoundState(actor: Actor, combatant: Combatant, combat: Combat): Promise<void>;
//# sourceMappingURL=action-economy.d.ts.map