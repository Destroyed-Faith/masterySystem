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
    /**
     * NPC attack uses this round (keyed by usage key, e.g. `npc-attack-root-0`).
     * Each use removes one radial copy; max copies = `npcAttacksPerRound` (1–5).
     */
    npcAttackUsesThisRound?: Record<string, number>;
    /**
     * When true, a Movement Power already replaced normal Movement this round —
     * base Move/Dash maneuvers are unavailable (Rules v0.9.8).
     */
    movementPowerUsedThisRound?: boolean;
    /**
     * One Active Buff activation per round. The radial Buff slice shows 1 or 0
     * regardless of how many Attack Actions remain.
     */
    activeBuffUsedThisRound?: boolean;
    /**
     * Dash / Disengage: base Attack Action locked this Turn (stone extras still ok).
     */
    baseAttackLocked?: boolean;
    /**
     * Disengage: movement does not provoke movement-triggered Reactions.
     */
    safeMovementThisTurn?: boolean;
    /**
     * Flee: until start of next Turn — no Attacks, Reactions, or Stones.
     */
    fleeLock?: boolean;
    /** Quick Load Reload(1) spends this Turn (capped at Mastery Rank). */
    quickLoadReloadThisTurn?: number;
    /**
     * Per-Bond Summon combat usage this round (attacks / special / reaction).
     * Keyed by SummonBondRecord.id on the owner actor.
     */
    summonBondUsage?: Record<string, {
        bondId: string;
        attacksUsed: number;
        specialApplied: boolean;
        reactionsUsed: number;
    }>;
    /**
     * Active Buff Critical(X) per-round attack quota.
     * Refreshes when `roundKey` changes (`combatId:round`).
     */
    criticalQuota?: {
        roundKey: string;
        granted: number;
        remaining: number;
    };
    /**
     * Passive Parry stance for this round — spend pool 1:1 to strip Attack Dice
     * before the roll (0 dice = Fully Parried → Riposte / Reflection).
     */
    parry?: {
        entered: boolean;
        pool: number;
        max: number;
        attribute: 'might' | 'agility';
    };
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
        /** Legacy: +keep raises on next spell/skill roll. */
        freeRaises?: number;
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
        /** Vitality.ExtendActiveBuff — +rounds for the next Active Buff activated this turn (consumed on activation). */
        extendActiveBuffRounds?: number;
        /** Intellect.SpellRaises — +4 per tier to meet Raise TN only (not Normal TN). */
        spellRaiseTnBonus?: number;
        /** @deprecated Use spellRaiseTnBonus — legacy bonus-d8 path removed. */
        spellAutoRaises?: number;
        /** Intellect.SpellResistance — +TN vs Spells that directly target you until next turn. */
        spellResistanceBonus?: number;
        /** Intellect.SpellAction — extra attack actions this round, restricted to Spells. */
        extraSpellActions?: number;
        /** Intellect.SpecialBoost — +X to one eligible Special on each spell this turn. */
        spellSpecialBoost?: number;
        /** Resolve.Damage Reduction — additional %DR until next turn (creates DR if missing). */
        damageReductionBoostPct?: number;
        /** Resolve.Ward / legacy Special Reduction — minus to incoming eligible hostile Special(X). */
        incomingSpecialReduction?: number;
        /** Resolve.Ward — SET total until the start of your next turn. */
        tempWard?: number;
        /** Might.Parry — temporary Parry Pool until the start of your next turn. */
        tempParryPool?: number;
        /** Vitality.Damage Negation — temporary negation reserve until the start of your next turn. */
        tempDamageNegation?: number;
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
export declare function getActionEconomyActor(actor: Actor | null | undefined): Actor | null;
/**
 * Get round state from actor flags
 */
export declare function getRoundState(actor: Actor, combat: Combat | null): RoundState;
/** Extra movement distance (m) this round from initiative shop, stones, etc. — for range previews, not action counts. */
export declare function getMovementRangeBonusMeters(actor: Actor, combat: Combat | null): number;
/**
 * Set round state on actor.
 *
 * Foundry `setFlag` **merges** object values — writing `npcAttackUsesThisRound: {}`
 * does NOT remove prior keys. That left spent NPC attack copies stuck forever across
 * rounds. Always replace the whole `roundState` flag (unset, then set).
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
/** How many times this NPC attack option was already used this round. */
export declare function getNpcAttackUsesThisRound(actor: Actor, combat: Combat | null, npcAttackOptionId: string): number;
/** Whether this NPC attack still has remaining uses this round (maxUses is 1–5). */
export declare function canUseNpcAttackThisRound(actor: Actor, combat: Combat | null, npcAttackOptionId: string, maxUses: number): boolean;
/** Record one use of an NPC attack option this round. */
export declare function markNpcAttackUsedThisRound(actor: Actor, combat: Combat | null, npcAttackOptionId: string): Promise<void>;
/** Undo one use (e.g. attack roll failed after spending an action). */
export declare function unmarkNpcAttackUsedThisRound(actor: Actor, combat: Combat | null, npcAttackOptionId: string): Promise<void>;
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
 * Spend Movement for a Movement Power — replaces normal Movement for the round.
 */
export declare function spendMovementPowerAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/** True when base Move/Dash should be blocked because a Movement Power replaced Movement. */
export declare function isNormalMovementReplaced(actor: Actor, combat: Combat | null): boolean;
/**
 * Spend a reaction action
 */
export declare function spendReactionAction(actor: Actor, combat: Combat | null): Promise<boolean>;
export declare function getAvailableAttackActions(actor: Actor, combat: Combat | null): number;
/** Remaining Active Buff activations this round: always 1 or 0. */
export declare function remainingActiveBuffActions(usedThisRound: boolean | undefined, attackActionsAvailable: number): number;
export declare function getAvailableActiveBuffActions(actor: Actor, combat: Combat | null): number;
export declare function markActiveBuffUsedThisRound(actor: Actor, combat: Combat | null): Promise<void>;
/** Apply Dash / Disengage / Flee side-effects after spending Movement. */
export declare function applyBasicMovementManeuverFlags(actor: Actor, combat: Combat | null, maneuverId: string): Promise<void>;
export declare function isFleeLocked(actor: Actor, combat: Combat | null): boolean;
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
 * Refund one movement action if any were spent this round.
 */
export declare function refundMovementAction(actor: Actor, combat: Combat | null): Promise<void>;
/** Quick Load Reload(1) spent so far this Turn (capped at Mastery Rank). */
export declare function getQuickLoadReloadThisTurn(actor: Actor, combat: Combat | null): number;
/** Record one Quick Load Reload(1). Returns false if already at Mastery Rank cap. */
export declare function recordQuickLoadReload(actor: Actor, combat: Combat | null, masteryRank: number): Promise<boolean>;
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
export declare function spendStoneAbility(actor: Actor, _combatant: Combatant, attribute: AttributeKey, abilityKey: string, applyEffect: (roundState: RoundState) => Promise<void>, expectedCost?: number, colorlessSpent?: number): Promise<boolean>;
/**
 * General-Stonepower mit Aufteilung auf mehrere Pool-Farben (wie im Dialog pro Lane).
 * Summe pro Attribut muss exakt `calculateStoneCost(uses)` ergeben.
 */
export declare function spendGenericStoneAbilityWithPerAttributeDeductions(actor: Actor, _combatant: Combatant, abilityKey: string, perAttributeCounts: Partial<Record<AttributeKey | 'colorless', number>>, applyEffect: (roundState: RoundState) => Promise<void>, expectedCost?: number): Promise<boolean>;
/**
 * End-of-round stone regen: Mastery Rank stones, automatic.
 * Each stone goes to the next pool that can accept it, in order of attribute value (highest first);
 * ties between equal attributes are shuffled randomly.
 */
export declare function applyAutomaticStoneRegen(actor: Actor): Promise<void>;
/**
 * Apply a player-chosen regen allocation (Mastery Rank stones back into chosen pools).
 */
export declare function applyStoneRegenAllocation(actor: Actor, allocation: Partial<Record<AttributeKey, number>>): Promise<void>;
/**
 * Round advance no longer auto-fills pools. Players pick which stones come back
 * in the Stone Recovery step of the Stone Powers dialog.
 */
export declare function regenStonesEndOfRound(_combat: Combat): Promise<void>;
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