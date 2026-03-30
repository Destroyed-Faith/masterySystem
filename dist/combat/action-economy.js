/**
 * Action Economy System
 *
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */
/**
 * Check if an actor is a PC
 */
export function isPC(actor) {
    return actor?.type === 'character';
}
/**
 * Actor document that owns `mastery-system` roundState / stoneUsage flags for action economy.
 *
 * Unlinked PC tokens use a synthetic `token.actor`; stone powers opened from the combat tracker
 * and other flows often update the **world** actor. Without this, the radial can show stone bonuses
 * while chat attack rolls consume a different document (wrong used/total; powers "still available").
 * NPCs keep per-token state so multiple unlinked copies of the same actor stay independent.
 */
export function getActionEconomyActor(actor) {
    if (!actor)
        return null;
    const anyA = actor;
    if (anyA.type !== 'character')
        return actor;
    const doc = anyA.token?.document;
    if (!doc || doc.actorLink !== false)
        return actor;
    const world = game.actors?.get(doc.actorId);
    return world || actor;
}
/**
 * Get round state from actor flags
 */
export function getRoundState(actor, combat) {
    const owner = (getActionEconomyActor(actor) ?? actor);
    const stored = owner.getFlag('mastery-system', 'roundState');
    const combatId = combat?.id ?? '';
    const round = combat?.round ?? 1;
    // Must match encounter AND round — a new combat can start again at round 1 with a clean tracker.
    if (stored &&
        stored.round === round &&
        stored.combatId === combatId) {
        return stored;
    }
    // Create default state
    const isPC = owner.type === 'character';
    const baseActions = {
        movementActions: { total: 1, used: 0 },
        attackActions: { total: 1, used: 0 },
        reactionActions: { total: 1, used: 0 }
    };
    return {
        combatId,
        round: combat?.round || 1,
        turn: combat?.turn || 0,
        isPC,
        ...baseActions,
        moveBonusMeters: 0,
        usedPowerIdsThisRound: [],
        stoneBonuses: {
            extraAttacks: 0,
            extraReactions: 0,
            extraMoveMeters: 0
        }
    };
}
/**
 * Set round state on actor
 */
export async function setRoundState(actor, state) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const o = owner;
    await o.setFlag('mastery-system', 'roundState', state);
    Hooks.callAll('masterySystem.roundStateUpdated', { actorId: o.id });
}
/**
 * Whether this power item has already been used this round (combat powers only).
 */
export function hasPowerBeenUsedThisRound(actor, combat, powerItemId) {
    const rs = getRoundState(actor, combat);
    return (rs.usedPowerIdsThisRound ?? []).includes(powerItemId);
}
/**
 * Record a power as used this round. No-op if already recorded.
 */
export async function markPowerUsedThisRound(actor, combat, powerItemId) {
    if (!powerItemId)
        return;
    const rs = getRoundState(actor, combat);
    const arr = rs.usedPowerIdsThisRound ?? [];
    if (arr.includes(powerItemId))
        return;
    rs.usedPowerIdsThisRound = [...arr, powerItemId];
    await setRoundState(actor, rs);
}
/**
 * Undo mark (e.g. attack roll failed after spending an action).
 */
export async function unmarkPowerUsedThisRound(actor, combat, powerItemId) {
    if (!powerItemId)
        return;
    const rs = getRoundState(actor, combat);
    const arr = rs.usedPowerIdsThisRound ?? [];
    if (!arr.length)
        return;
    rs.usedPowerIdsThisRound = arr.filter((id) => id !== powerItemId);
    await setRoundState(actor, rs);
}
/**
 * Apply initiative shop bonuses to round state
 * Called when shop purchases are made or at start of round
 */
export async function applyInitiativeShopBonuses(actor, combatant, combat) {
    if (!isPC(actor))
        return; // NPCs don't get shop bonuses
    const shopData = combatant.getFlag('mastery-system', 'initiativeShop');
    if (!shopData || shopData.round !== combat.round) {
        return; // No shop data for this round
    }
    const roundState = getRoundState(actor, combat);
    roundState.combatId = combat.id ?? '';
    // Apply extra attack
    if (shopData.extraAttack) {
        roundState.attackActions.total += 1;
    }
    // Apply extra movement (adds to distance bonus, not action count)
    if (shopData.extraMovement > 0) {
        roundState.moveBonusMeters += shopData.extraMovement * 2; // Each purchase = +2m
    }
    // Store shop data in round state
    roundState.initiativeShop = {
        round: shopData.round,
        extraMovement: shopData.extraMovement || 0,
        initiativeSwap: shopData.initiativeSwap || false,
        extraAttack: shopData.extraAttack || false
    };
    await setRoundState(actor, roundState);
}
/**
 * Spend an attack action (used by Attack, Buff, Utility)
 */
export async function spendAttackAction(actor, combat) {
    const roundState = getRoundState(actor, combat);
    if (roundState.attackActions.used >= roundState.attackActions.total) {
        ui.notifications?.warn('No attack actions remaining!');
        return false;
    }
    roundState.attackActions.used += 1;
    await setRoundState(actor, roundState);
    return true;
}
/**
 * Spend a movement action
 */
export async function spendMovementAction(actor, combat) {
    const roundState = getRoundState(actor, combat);
    if (roundState.movementActions.used >= roundState.movementActions.total) {
        ui.notifications?.warn('No movement actions remaining!');
        return false;
    }
    roundState.movementActions.used += 1;
    await setRoundState(actor, roundState);
    return true;
}
/**
 * Spend a reaction action
 */
export async function spendReactionAction(actor, combat) {
    const roundState = getRoundState(actor, combat);
    if (roundState.reactionActions.used >= roundState.reactionActions.total) {
        ui.notifications?.warn('No reaction actions remaining!');
        return false;
    }
    roundState.reactionActions.used += 1;
    await setRoundState(actor, roundState);
    return true;
}
/**
 * Get available attack actions (remaining count)
 */
export function getAvailableAttackActions(actor, combat) {
    const roundState = getRoundState(actor, combat);
    return Math.max(0, roundState.attackActions.total - roundState.attackActions.used);
}
/**
 * Get available movement actions (remaining count)
 */
export function getAvailableMovementActions(actor, combat) {
    const roundState = getRoundState(actor, combat);
    return Math.max(0, roundState.movementActions.total - roundState.movementActions.used);
}
/**
 * Consume an attack action (alias for spendAttackAction)
 */
export async function consumeAttackAction(actor, combat) {
    return await spendAttackAction(actor, combat);
}
/**
 * Refund one attack action if any were spent this round (e.g. attack flow failed after spend).
 */
export async function refundAttackAction(actor, combat) {
    const roundState = getRoundState(actor, combat);
    if (roundState.attackActions.used <= 0)
        return;
    roundState.attackActions.used -= 1;
    await setRoundState(actor, roundState);
}
/**
 * Consume a movement action (alias for spendMovementAction)
 */
export async function consumeMovementAction(actor, combat) {
    return await spendMovementAction(actor, combat);
}
/**
 * Get stone usage count for an ability this turn
 */
export function getStoneUsageCount(actor, attribute, abilityKey, combat) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const o = owner;
    const round = combat?.round || 1;
    const turn = combat?.turn || 0;
    const usageKey = `${attribute}:${abilityKey}:${round}:${turn}`;
    const stoneUsage = o.getFlag('mastery-system', 'stoneUsage');
    return stoneUsage?.[usageKey] || 0;
}
/**
 * Increment stone usage count for an ability this turn
 */
export async function incrementStoneUsage(actor, attribute, abilityKey, combat) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const o = owner;
    const round = combat?.round || 1;
    const turn = combat?.turn || 0;
    const usageKey = `${attribute}:${abilityKey}:${round}:${turn}`;
    const stoneUsage = o.getFlag('mastery-system', 'stoneUsage') || {};
    stoneUsage[usageKey] = (stoneUsage[usageKey] || 0) + 1;
    await o.setFlag('mastery-system', 'stoneUsage', stoneUsage);
}
/**
 * Calculate exponential stone cost: 2^(usesThisTurn)
 */
export function calculateStoneCost(usesThisTurn) {
    return Math.pow(2, usesThisTurn);
}
/**
 * Get stone pool for an attribute
 */
export function getStonePool(actor, attribute) {
    const system = actor.system;
    const pool = system.stonePools?.[attribute];
    if (!pool) {
        return { current: 0, max: 0 };
    }
    return {
        current: pool.current || 0,
        max: pool.max || 0
    };
}
/**
 * Set stone pool current value
 */
export async function setStonePool(actor, attribute, current) {
    await actor.update({
        [`system.stonePools.${attribute}.current`]: Math.max(0, current)
    });
}
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
export async function spendStoneAbility(actor, _combatant, attribute, abilityKey, applyEffect) {
    // NPCs cannot use stone abilities for action bonuses
    if (!isPC(actor)) {
        ui.notifications?.warn('NPCs cannot use stone abilities for action bonuses');
        return false;
    }
    const combat = game.combat;
    if (!combat) {
        ui.notifications?.warn('Not in combat!');
        return false;
    }
    // Get current usage count and calculate cost
    const uses = getStoneUsageCount(actor, attribute, abilityKey, combat);
    const cost = calculateStoneCost(uses);
    // Get stone pool
    const pool = getStonePool(actor, attribute);
    // Check if enough stones
    if (pool.current < cost) {
        ui.notifications?.warn(`Not enough ${attribute} stones! Need ${cost}, have ${pool.current}`);
        return false;
    }
    // Get round state
    const roundState = getRoundState(actor, combat);
    // Apply effect (modifies roundState)
    try {
        await applyEffect(roundState);
        // Deduct stones
        await setStonePool(actor, attribute, pool.current - cost);
        // Increment usage counter
        await incrementStoneUsage(actor, attribute, abilityKey, combat);
        // Do not call setRoundState(actor, roundState) here: `roundState` is the pre-effect snapshot.
        // Stone powers call getRoundState + setRoundState inside apply(); saving this snapshot would
        // overwrite extra attacks / move bonuses / reactions just granted.
        ui.notifications?.info(`Spent ${cost} ${attribute} stones. (${pool.current - cost} remaining)`);
        return true;
    }
    catch (error) {
        console.error('Mastery System | Error applying stone ability effect', error);
        ui.notifications?.error('Failed to apply stone ability effect');
        return false;
    }
}
/**
 * Regenerate stones at end of round
 * Shows dialog for each PC to allocate regen points (mastery rank per attribute)
 */
export async function regenStonesEndOfRound(combat) {
    const user = game.user;
    if (!user)
        return;
    // Get all PC combatants that this user owns (or all if GM)
    const pcCombatants = combat.combatants.filter((c) => {
        const actor = c.actor;
        return actor && actor.type === 'character' && (user.isGM || actor.isOwner);
    });
    if (pcCombatants.length === 0) {
        return;
    }
    console.log(`Mastery System | Showing stone regen for ${pcCombatants.length} PCs`);
    // Import stone regen dialog
    const { StoneRegenDialog } = await import('../stones/stone-regen-dialog.js');
    // Show regen dialog for each PC sequentially
    for (const combatant of pcCombatants) {
        const actor = combatant.actor;
        if (!actor)
            continue;
        const system = actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const regenPoints = masteryRank;
        // Check if any pools can actually regenerate
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
        const canRegen = attributeKeys.some(attr => {
            const pool = getStonePool(actor, attr);
            const sustained = (system.stonePools?.[attr]?.sustained || 0);
            const effectiveMax = pool.max - sustained;
            return pool.current < effectiveMax;
        });
        if (!canRegen) {
            console.log(`Mastery System | ${actor.name} stone pools already full, skipping regen`);
            continue;
        }
        // Show dialog
        const allocation = await StoneRegenDialog.showForActor(actor, regenPoints);
        if (allocation) {
            // Apply allocation
            const updates = {};
            for (const [attr, amount] of Object.entries(allocation)) {
                if (amount === 0)
                    continue;
                const pool = getStonePool(actor, attr);
                const sustained = (system.stonePools?.[attr]?.sustained || 0);
                const effectiveMax = pool.max - sustained;
                const newCurrent = Math.min(effectiveMax, pool.current + amount);
                updates[`system.stonePools.${attr}.current`] = newCurrent;
            }
            if (Object.keys(updates).length > 0) {
                await actor.update(updates);
                console.log(`Mastery System | Applied stone regen for ${actor.name}`, allocation);
            }
        }
        else {
            console.log(`Mastery System | ${actor.name} skipped stone regen`);
        }
    }
}
/**
 * Restore all stone pools to max after combat
 */
export async function restoreStonesAfterCombat(combat) {
    const actors = new Set();
    // Collect all actors from combat
    for (const combatant of combat.combatants) {
        if (combatant.actor) {
            actors.add(combatant.actor);
        }
    }
    // Restore stone pools for all PCs
    for (const actor of actors) {
        if (actor.type !== 'character')
            continue;
        const system = actor.system;
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
        const updates = {};
        for (const attr of attributeKeys) {
            const pool = getStonePool(actor, attr);
            const sustained = (system.stonePools?.[attr]?.sustained || 0);
            const fullCurrent = pool.max - sustained;
            if (pool.current !== fullCurrent) {
                updates[`system.stonePools.${attr}.current`] = fullCurrent;
            }
        }
        if (Object.keys(updates).length > 0) {
            await actor.update(updates);
            console.log(`Mastery System | Restored stone pools for ${actor.name}`);
        }
    }
}
/**
 * Initialize round state for all combatants at combat start
 */
export async function initializeCombatRoundState(combat) {
    for (const combatant of combat.combatants) {
        const actor = combatant.actor;
        if (!actor)
            continue;
        // Reset round state
        const roundState = getRoundState(actor, combat);
        await setRoundState(actor, roundState);
        // Reset stone usage (same owner as roundState for unlinked PCs)
        const flagOwner = getActionEconomyActor(actor) ?? actor;
        await flagOwner.setFlag('mastery-system', 'stoneUsage', {});
        // For PCs: apply initiative shop bonuses if any
        if (isPC(actor)) {
            await applyInitiativeShopBonuses(actor, combatant, combat);
        }
    }
}
/**
 * Reset turn state (called on turn change)
 * Resets used counts but keeps totals and bonuses
 */
export async function resetTurnState(actor, combat) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const o = owner;
    const roundState = getRoundState(actor, combat);
    roundState.combatId = combat?.id ?? '';
    // Reset used counts
    roundState.movementActions.used = 0;
    roundState.attackActions.used = 0;
    roundState.reactionActions.used = 0;
    // Clear stone usage for this turn (keep round-level usage)
    const stoneUsage = o.getFlag('mastery-system', 'stoneUsage') || {};
    const round = combat?.round || 1;
    const turn = combat?.turn || 0;
    // Remove all keys for this turn
    const keysToRemove = Object.keys(stoneUsage).filter(key => key.endsWith(`:${round}:${turn}`));
    for (const key of keysToRemove) {
        delete stoneUsage[key];
    }
    await o.setFlag('mastery-system', 'stoneUsage', stoneUsage);
    await setRoundState(actor, roundState);
}
/**
 * Reset round state (called on round change)
 * Clears bonuses and re-applies initiative shop for new round
 */
export async function resetRoundState(actor, combatant, combat) {
    // Create fresh round state
    const isPC = actor.type === 'character';
    const roundState = {
        combatId: combat.id ?? '',
        round: combat.round || 1,
        turn: combat.turn || 0,
        isPC,
        movementActions: { total: 1, used: 0 },
        attackActions: { total: 1, used: 0 },
        reactionActions: { total: 1, used: 0 },
        moveBonusMeters: 0,
        usedPowerIdsThisRound: [],
        stoneBonuses: {
            extraAttacks: 0,
            extraReactions: 0,
            extraMoveMeters: 0
        }
    };
    // For PCs: apply initiative shop bonuses for this round
    if (isPC) {
        await applyInitiativeShopBonuses(actor, combatant, combat);
        // Re-read to get updated state
        const updated = getRoundState(actor, combat);
        Object.assign(roundState, updated);
    }
    roundState.usedPowerIdsThisRound = [];
    roundState.combatId = combat.id ?? '';
    await setRoundState(actor, roundState);
}
//# sourceMappingURL=action-economy.js.map