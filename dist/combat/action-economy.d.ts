/**
 * Action Economy System
 *
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */
/**
 * Attributes with per-pool combat stones (must match `MasteryActor.prepareBaseData`).
 * Declared early so circular imports (ledger → pool-sync → here) never see `undefined`.
 */
export declare const DEFENSIVE_STONE_KEYS: readonly ["evadeBonus", "tempArmor", "spellResistanceBonus", "damageReductionBoostPct", "incomingSpecialReduction", "tempWard", "tempParryPool", "tempDamageNegation"];
export type DefensiveStoneSnapshot = Partial<Record<(typeof DEFENSIVE_STONE_KEYS)[number], number>>;
export declare function snapshotDefensiveStones(sb: object | null | undefined): DefensiveStoneSnapshot;
export declare function defensiveSnapshotPending(snap: DefensiveStoneSnapshot | null | undefined): boolean;
/** Subtract the snapshot taken at the previous spotlight end. Later purchases stay. */
export declare function applyDefensiveStoneExpiry<T extends object>(sb: T, snap: DefensiveStoneSnapshot | null | undefined): T;
export declare const STONE_POOL_ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';
/** Doubling costs reset each turn. Exchange Passive is retired. */
export declare function stonePowerCostPersistsForCombat(_abilityKey: string): boolean;
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
    /** Technical Movement Power ids already used this round. Each id spends one Movement, not the rest. */
    usedMovementPowerIds?: string[];
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
    /** Set when Flee actually commits, so a second hook does not spend again. */
    fleeCommitted?: boolean;
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
        attribute: 'might' | 'agility' | 'intellect' | 'resolve' | 'influence';
        /** Martial strips Attack Dice. Spell strips Casting Dice (Fully Countered). */
        delivery?: 'martial' | 'spell';
        /** Pool at the moment Parry was entered. Recovery cannot exceed this. */
        entryPool?: number;
        /** Parry Recovery already refunded this Round. */
        recoveredThisRound?: number;
    };
    stoneBonuses?: {
        extraAttacks: number;
        extraReactions: number;
        extraMoveMeters: number;
        /** Generic per-hit damage-die bonus (legacy field — still consumed by damage-dialog). */
        damageBonus?: number;
        /** Might Martial Damage — bonus d8 on the next martial damage roll this turn (consumed on roll). */
        meleeDamageBonusDice?: number;
        /** Generic armor-penetration on attacks (legacy field — kept for compatibility). */
        armorPenetration?: number;
        /** Armor Reduction — ignore this much Armor on damaging attacks this round. Highest rank wins. */
        meleeIgnoreArmor?: number;
        /** Agility Invisibility Boost, added only when Invisibility is already active. */
        invisibilityBonus?: number;
        /** Intellect Range & AoE Boost. */
        rangeBonusM?: number;
        meleeReachBonusM?: number;
        aoeRadiusBonusM?: number;
        /** Resolve Active Buff Empowerment — extra Power Levels on one Active Buff this round. */
        activeBuffPlBonus?: number;
        /** Influence Enemy Evade Reduction against this character's attacks. */
        enemyEvadeReduction?: number;
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
        /** Intellect.Raise Focus — bonus to meet Raise TN only (not the normal success TN). */
        spellRaiseTnBonus?: number;
        /** Intellect.Spell Penetration — Spell Resistance ignored. Never reduces Base TN. */
        spellPenetration?: number;
        /** Intellect.Special Boost — added to every numeric Special(X) you apply this round. */
        specialBoost?: number;
        /** @deprecated Use spellRaiseTnBonus — legacy bonus-d8 path removed. */
        spellAutoRaises?: number;
        /** Intellect.SpellResistance — +TN vs Spells that directly target you until next turn. */
        spellResistanceBonus?: number;
        /**
         * Intellect.SpellAction — retired. Reads strip this pile out of
         * attackActions.total and extraAttacks, then store 0. Extra Attack is
         * the only extra-attack source.
         */
        extraSpellActions?: number;
        /**
         * Initiative Shop extra Attack Action. Does not stack with Extra Attack:
         * the character keeps the highest single grant.
         */
        shopExtraAttack?: number;
        /** Other named Attack Action grants. Highest source wins. */
        bonusAttackActions?: number;
        /** @deprecated Mirror of specialBoost. Kept so older turn-cleanup still sees the bonus. */
        spellSpecialBoost?: number;
        /** Resolve.Damage Reduction — additional %DR until next turn (creates DR if missing). */
        damageReductionBoostPct?: number;
        /** Resolve.Ward / legacy Special Reduction — minus to incoming eligible hostile Special(X). */
        incomingSpecialReduction?: number;
        /** Resolve.Ward — SET total until the start of your next turn. */
        tempWard?: number;
        /** Might.Parry — temporary Parry Pool until the start of your next turn. */
        tempParryPool?: number;
        /** Snapshot of defensive stones taken when this actor's spotlight ended. */
        defensiveExpiry?: DefensiveStoneSnapshot | null;
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
 * Spell Action used to add a second attack pile on top of Extra Attack.
 * Drop that pile on read so a fight already in progress stops counting it.
 * Mutating the stored object makes the correction stick: a later save writes
 * extraSpellActions 0, and a second read does not subtract again.
 */
/**
 * Additional Attack Actions do not stack. The highest single source is used.
 * Extra Attack and Artifact support of Extra Attack are the same source.
 */
export declare function highestExtraAttackGrant(sources: Array<number | null | undefined>): number;
/** PC Attack Action total = 1 base + the highest extra-attack grant. */
export declare function syncPcExtraAttackTotal(state: RoundState): void;
/**
 * Get round state from actor flags
 */
export declare function getRoundState(actor: Actor, combat: Combat | null): RoundState;
/** Extra movement distance (m) this round from initiative shop, stones, etc. — for range previews, not action counts. */
export declare function getMovementRangeBonusMeters(actor: Actor, combat: Combat | null): number;
/** Intellect Range & AoE Boost. Existing range, reach, or radius only — callers add this to a value they already have. */
export declare function getStoneAreaBonusMeters(actor: Actor | null | undefined, kind: 'range' | 'reach' | 'aoe'): number;
/**
 * Set round state on actor.
 *
 * Foundry `setFlag` **merges** object values — writing `npcAttackUsesThisRound: {}`
 * does NOT remove prior keys. That left spent NPC attack copies stuck forever across
 * rounds. Always replace the whole `roundState` flag (unset, then set).
 */
export declare function setRoundState(actor: Actor, state: RoundState): Promise<void>;
/** Free Raises left this Round (Intellect Stone Ability). */
export declare function freeRaisePool(actor: Actor | null | undefined): number;
/** Spend declared Free Raises. They leave the pool whether the roll hits or misses. */
export declare function consumeFreeRaises(actor: Actor | null | undefined, requested: number): Promise<number>;
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
export declare function spendMovementPowerAction(actor: Actor, combat: Combat | null, templateId?: string): Promise<boolean>;
/** True when base Move/Dash should be blocked because a Movement Power replaced Movement. */
export declare function isNormalMovementReplaced(actor: Actor, combat: Combat | null): boolean;
/**
 * Spend a reaction action
 */
export declare function spendReactionAction(actor: Actor, combat: Combat | null, context?: {
    reactionId?: string;
    triggerId?: string;
}): Promise<boolean>;
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
/**
 * Refund one reaction action if any were spent this round.
 */
export declare function refundReactionAction(actor: Actor, combat: Combat | null): Promise<void>;
export type CombatActionRefundKind = 'attack' | 'movement' | 'reaction';
/**
 * GM recovery: refund one spent combat action of the given kind this round.
 * Returns false when nothing was spent (nothing to give back).
 */
export declare function gmRefundCombatAction(actor: Actor, combat: Combat | null, kind: CombatActionRefundKind): Promise<boolean>;
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
 * Additional Stone cost of the next Normal Ability Rank: 1, 2, 4, 8.
 * Rank 4 is the last Rank. Prefer `stonePowerRankCost` (Premium Abilities use 2 / 4 / 6 / 8).
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
 * Stones in a pool that must NOT come back through regen / refills:
 * Sustain, Sealed (Rituals / Remove Scar — return on Safe Haven Rest) and
 * Burned (lost until Safe Haven Rest, e.g. Last Breath).
 */
export declare function stonePoolReservedStones(system: any, attr: string): number;
/**
 * Persist max/current from floor(attribute/8) minus sustained — full pool for round-1 stone assignment.
 * Pass the **combatant's** actor (token document for unlinked PCs) so data matches Stone Powers UI.
 */
export declare function refillStonePoolsFromAttributes(actor: Actor, opts?: {
    force?: boolean;
}): Promise<void>;
/**
 * Fix stale max (e.g. 0 in DB) and clamp current without forcing a full refill (round 2+).
 */
export declare function syncStonePoolCapsFromAttributes(actor: Actor): Promise<void>;
/**
 * Set stone pool current value. In combat this also updates the per-character
 * Ready ledger and mirrors onto every world/token copy so Round 2 cannot
 * resurrect a stale full pool.
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
 * Apply a player-chosen regen allocation. Attribute Stones and designated
 * Colorless Stones share one limit when `recoveryLimit` is set (Mastery Rank).
 * Colorless Stones regenerate only by id, and only when Colorless Recovery
 * designated that Stone. The designation itself is not consumed.
 */
export declare function applyStoneRegenAllocation(actor: Actor, allocation: Partial<Record<AttributeKey | 'colorless', number>> & {
    colorlessIds?: string[];
    recoveryLimit?: number;
}): Promise<void>;
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
 * Clear offensive / casting "this turn" stone bonuses when the spotlight ends.
 * Defensive stones that last until the start of the next own turn
 * (Parry, Armor, Evade, Damage Negation, Damage Reduction, Spell Resistance,
 * Special Negation / Ward) are preserved here and armed via
 * `armDefensiveStoneExpiry` for removal in `releaseDefensiveStoneExpiry`.
 */
export declare function clearCombatStoneTurnBonusesForActor(actor: Actor, combat: Combat | null): Promise<void>;
/** Remember defensive stones when this actor's spotlight ends. Do not remove them yet. */
export declare function armDefensiveStoneExpiry(actor: Actor, combat: Combat | null): Promise<void>;
/** At the start of this actor's next turn, drop the stones snapshotted last spotlight. */
export declare function releaseDefensiveStoneExpiry(actor: Actor, combat: Combat | null): Promise<void>;
/**
 * Reset round state (called on round change)
 * Clears bonuses and re-applies initiative shop for new round
 */
export declare function resetRoundState(actor: Actor, combatant: Combatant, combat: Combat): Promise<void>;
//# sourceMappingURL=action-economy.d.ts.map