/**
 * Action Economy System
 *
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */
// Actor, Combatant, and Combat are global types in Foundry VTT v13
import { healStressFromBars } from '../utils/calculations.js';
import { getStunnedRank } from '../system/auto-fail.js';
const STONE_USAGE_ATTR_KEYS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence'
];
function genericStoneUsageFlagKey(abilityKey, round, turn) {
    return `generic:${abilityKey}:${round}:${turn}`;
}
/**
 * Nutzungszähler für General-Stonepowers (generic.*): ein Wert pro Macht/Zug — unabhängig davon,
 * welcher Pool bezahlt hat. Sonst startet jede Farbe wieder bei Kosten 1 und die UI bleibt leer.
 */
export function getGenericStonePowerUsageCount(actor, abilityKey, combat) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const round = combat?.round || 1;
    const turn = combat?.turn || 0;
    const usageKey = genericStoneUsageFlagKey(abilityKey, round, turn);
    const stoneUsage = owner.getFlag('mastery-system', 'stoneUsage');
    if (stoneUsage && Object.prototype.hasOwnProperty.call(stoneUsage, usageKey)) {
        return stoneUsage[usageKey] || 0;
    }
    let legacy = 0;
    for (const attr of STONE_USAGE_ATTR_KEYS) {
        legacy += getStoneUsageCount(actor, attr, abilityKey, combat);
    }
    return legacy;
}
export async function incrementGenericStonePowerUsage(actor, abilityKey, combat) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const round = combat?.round || 1;
    const turn = combat?.turn || 0;
    const usageKey = genericStoneUsageFlagKey(abilityKey, round, turn);
    const stoneUsage = owner.getFlag('mastery-system', 'stoneUsage') || {};
    stoneUsage[usageKey] = (stoneUsage[usageKey] || 0) + 1;
    await owner.setFlag('mastery-system', 'stoneUsage', stoneUsage);
}
/**
 * Check if an actor is a PC
 */
export function isPC(actor) {
    return actor?.type === 'character';
}
/**
 * Find a placed token document for this actor id (combat first, then canvas).
 * `game.actors.get(id)` often has no `actor.token`, so we cannot detect unlinked from it alone.
 *
 * IMPORTANT: never read `token.actor` / `combatant.actor` here. Those getters build a
 * synthetic Actor and run `prepareData`, which calls back into action-economy and can
 * recurse forever while the canvas is drawing tokens.
 */
function findPlacedTokenDocumentForActorId(actorId) {
    const combat = game.combat;
    if (combat?.combatants?.size) {
        for (const c of combat.combatants) {
            const t = c.token;
            if (!t)
                continue;
            if (t.actorId === actorId)
                return t;
        }
    }
    const placeables = canvas?.tokens?.placeables;
    if (placeables?.length) {
        for (const tok of placeables) {
            const td = tok.document;
            if (td?.actorId === actorId)
                return td;
        }
    }
    return null;
}
/**
 * Actor document that owns `mastery-system` roundState / stoneUsage flags for action economy.
 *
 * Unlinked PC tokens use a synthetic `token.actor` on the canvas; stone powers and `game.actors.get`
 * often refer to the **prototype** actor. Only `actorLink === true` is treated as linked; any other
 * value (false / undefined) uses the prototype so tracker, radial, and chat agree.
 * NPCs stay per-actor (no redirect) so multiple unlinked copies remain independent.
 */
const actionEconomyResolveInProgress = new Set();
export function getActionEconomyActor(actor) {
    if (!actor)
        return null;
    const anyA = actor;
    if (anyA.type !== 'character')
        return actor;
    if (actionEconomyResolveInProgress.has(anyA.id))
        return actor;
    actionEconomyResolveInProgress.add(anyA.id);
    try {
        return resolveActionEconomyActorInner(anyA);
    }
    finally {
        actionEconomyResolveInProgress.delete(anyA.id);
    }
}
function resolveActionEconomyActorInner(anyA) {
    const actor = anyA;
    let doc = anyA.token?.document;
    if (!doc) {
        doc = findPlacedTokenDocumentForActorId(anyA.id);
    }
    if (doc?.actorLink === true) {
        return actor;
    }
    // Unlinked token: pick a SINGLE canonical owner for action-economy flags
    // (round state, stone usage/pools) so that writers and readers never diverge
    // — regardless of whether we were handed the world (prototype) actor or the
    // token's own (built) actor. Unlinked tokens often carry the real attribute
    // build on the token delta while the world prototype still sits at defaults;
    // stone pools / round-state derive from attributes, so the built token actor
    // must win when it has the greater capacity. Resolving symmetrically here is
    // what makes e.g. a stone power (written via the token actor) visible to the
    // damage dialog (which refetches the world actor by id).
    const baseId = doc?.actorId ?? anyA.id;
    const world = baseId ? game.actors?.get(baseId) : undefined;
    // When already running on a token actor, use `actor` directly — `doc.actor` would
    // re-enter prepareData on the same synthetic actor during canvas init.
    const tokenActor = (anyA.isToken ? actor : doc?.actor);
    if (tokenActor &&
        totalStoneCapacityFromAttributes(tokenActor) > totalStoneCapacityFromAttributes(world)) {
        return tokenActor;
    }
    if (world && world.type === 'character') {
        return world;
    }
    return actor;
}
/** Sum of attribute-derived stone-pool capacity (⌊value/8⌋) across the core pools. */
function totalStoneCapacityFromAttributes(actor) {
    const attrs = actor?.system?.attributes ?? {};
    let sum = 0;
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
        sum += Math.floor((Number(attrs?.[attr]?.value) || 0) / 8);
    }
    return sum;
}
/**
 * Get round state from actor flags
 */
export function getRoundState(actor, combat) {
    const owner = (getActionEconomyActor(actor) ?? actor);
    const stored = owner.getFlag('mastery-system', 'roundState');
    const combatId = String(combat?.id ?? '');
    const round = combat?.round ?? 1;
    const storedCombatId = String(stored?.combatId ?? '');
    // Must match encounter AND round — a new combat can start again at round 1 with a clean tracker.
    if (stored &&
        stored.round === round &&
        storedCombatId === combatId) {
        return stored;
    }
    // Create default state
    const isPC = owner.type === 'character';
    const npcAttackSlots = owner.type === 'npc'
        ? Math.max(1, Math.min(20, Math.floor(Number(owner.system?.attackSlots) || 1)))
        : 1;
    const npcMoveSlots = owner.type === 'npc'
        ? Math.max(1, Math.min(10, Math.floor(Number(owner.system?.npcMovementSlots) || 1)))
        : 1;
    const baseActions = {
        movementActions: { total: npcMoveSlots, used: 0 },
        attackActions: { total: npcAttackSlots, used: 0 },
        reactionActions: { total: 1, used: 0 }
    };
    return {
        combatId: combatId || undefined,
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
/** Extra movement distance (m) this round from initiative shop, stones, etc. — for range previews, not action counts. */
export function getMovementRangeBonusMeters(actor, combat) {
    const rs = getRoundState(actor, combat);
    return (Number(rs.moveBonusMeters) || 0) + (Number(rs.stoneBonuses?.extraMoveMeters) || 0);
}
/**
 * Set round state on actor
 */
export async function setRoundState(actor, state) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const o = owner;
    const toSave = { ...state };
    if (toSave.combatId !== undefined) {
        toSave.combatId = String(toSave.combatId);
    }
    await o.setFlag('mastery-system', 'roundState', toSave);
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
    if (shopData.extraReaction) {
        roundState.reactionActions.total += 1;
    }
    // Apply extra movement (adds to distance bonus, not action count)
    if (shopData.extraMovement > 0) {
        roundState.moveBonusMeters += shopData.extraMovement * 2; // Each purchase = +2m
    }
    const owner = (getActionEconomyActor(actor) ?? actor);
    if (shopData.removeStress && owner.system?.stress?.bars?.length) {
        const roll = await new Roll('1d8').evaluate({ async: true });
        const amount = roll.total ?? 0;
        const stress = owner.system.stress;
        const healed = healStressFromBars(stress.bars, stress.currentBar ?? 0, amount);
        await owner.update({
            'system.stress.bars': healed.bars,
            'system.stress.currentBar': healed.currentBar
        });
    }
    // Store shop data in round state
    roundState.initiativeShop = {
        round: shopData.round,
        extraMovement: shopData.extraMovement || 0,
        initiativeSwap: shopData.initiativeSwap || false,
        extraReaction: !!shopData.extraReaction,
        removeStress: !!shopData.removeStress,
        extraAttack: shopData.extraAttack || false
    };
    await setRoundState(actor, roundState);
}
/**
 * Spend an attack action (used by Attack, Buff, Utility)
 */
const STONE_POWERS_CONFIG_LOCK_FLAG = 'stonePowersConfigLock';
/**
 * True after this PC has spent movement, attack, or reaction in the current combat round
 * (Stone Powers attribute defaults / activations are then read-only until the next round).
 */
export function isStonePowersConfigurationLocked(actor, combat) {
    if (!combat)
        return false;
    const owner = (getActionEconomyActor(actor) ?? actor);
    const lock = owner.getFlag('mastery-system', STONE_POWERS_CONFIG_LOCK_FLAG);
    return !!(lock && lock.combatId === combat.id && lock.round === combat.round);
}
export async function lockStonePowersConfigurationForRound(actor, combat) {
    if (!combat || !isPC(actor))
        return;
    const owner = (getActionEconomyActor(actor) ?? actor);
    await owner.setFlag('mastery-system', STONE_POWERS_CONFIG_LOCK_FLAG, {
        combatId: combat.id,
        round: combat.round
    });
}
export async function clearStonePowersConfigurationLock(actor) {
    const owner = (getActionEconomyActor(actor) ?? actor);
    await owner.unsetFlag('mastery-system', STONE_POWERS_CONFIG_LOCK_FLAG);
}
export async function clearStonePowersConfigurationLocksInCombat(combat) {
    for (const c of combat.combatants) {
        const a = c.actor;
        if (a && a.type === 'character')
            await clearStonePowersConfigurationLock(a);
    }
}
async function maybeLockStonePowersAfterCombatAction(actor, combat) {
    if (!combat || !isPC(actor))
        return;
    await lockStonePowersConfigurationForRound(actor, combat);
}
export async function spendAttackAction(actor, combat) {
    const roundState = getRoundState(actor, combat);
    const owner = getActionEconomyActor(actor) ?? actor;
    const stunnedLock = Math.max(0, getStunnedRank(owner));
    const effectiveTotal = Math.max(0, roundState.attackActions.total - stunnedLock);
    if (roundState.attackActions.used >= effectiveTotal) {
        if (stunnedLock > 0) {
            ui.notifications?.warn(`Stunned (${stunnedLock}) — no attack actions remaining this round!`);
        }
        else {
            ui.notifications?.warn('No attack actions remaining!');
        }
        return false;
    }
    roundState.attackActions.used += 1;
    await setRoundState(actor, roundState);
    await maybeLockStonePowersAfterCombatAction(actor, combat);
    return true;
}
/**
 * Spend a movement action
 */
export async function spendMovementAction(actor, combat) {
    const roundState = getRoundState(actor, combat);
    if (roundState.movementPowerUsedThisRound) {
        ui.notifications?.warn('A Movement Power already replaced your normal Movement this round.');
        return false;
    }
    if (roundState.movementActions.used >= roundState.movementActions.total) {
        ui.notifications?.warn('No movement actions remaining!');
        return false;
    }
    roundState.movementActions.used += 1;
    await setRoundState(actor, roundState);
    await maybeLockStonePowersAfterCombatAction(actor, combat);
    return true;
}
/**
 * Spend Movement for a Movement Power — replaces normal Movement for the round.
 */
export async function spendMovementPowerAction(actor, combat) {
    const roundState = getRoundState(actor, combat);
    if (roundState.movementPowerUsedThisRound) {
        ui.notifications?.warn('A Movement Power was already used this round.');
        return false;
    }
    if (roundState.movementActions.used >= roundState.movementActions.total) {
        ui.notifications?.warn('No movement actions remaining!');
        return false;
    }
    roundState.movementActions.used = roundState.movementActions.total;
    roundState.movementPowerUsedThisRound = true;
    await setRoundState(actor, roundState);
    await maybeLockStonePowersAfterCombatAction(actor, combat);
    return true;
}
/** True when base Move/Dash should be blocked because a Movement Power replaced Movement. */
export function isNormalMovementReplaced(actor, combat) {
    return !!getRoundState(actor, combat).movementPowerUsedThisRound;
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
    await maybeLockStonePowersAfterCombatAction(actor, combat);
    return true;
}
/**
 * Get available attack actions (remaining count).
 * Stunned(X) locks X attack actions for the current round — the total is
 * clamped before subtracting `used`, never going below 0.
 */
export function getAvailableAttackActions(actor, combat) {
    const roundState = getRoundState(actor, combat);
    const owner = getActionEconomyActor(actor) ?? actor;
    const stunnedLock = Math.max(0, getStunnedRank(owner));
    const effectiveTotal = Math.max(0, roundState.attackActions.total - stunnedLock);
    const n = Math.max(0, effectiveTotal - roundState.attackActions.used);
    if (n === 0) {
        console.debug('Mastery System | [action-economy] getAvailableAttackActions: 0 remaining', {
            actorId: owner.id,
            name: owner.name,
            combatId: combat?.id,
            combatRound: combat?.round,
            combatTurn: combat?.turn,
            stateRound: roundState.round,
            stateTurn: roundState.turn,
            used: roundState.attackActions.used,
            total: roundState.attackActions.total,
            effectiveTotal,
            stunnedLock,
        });
    }
    return n;
}
/**
 * Get available movement actions (remaining count)
 */
export function getAvailableMovementActions(actor, combat) {
    const roundState = getRoundState(actor, combat);
    return Math.max(0, roundState.movementActions.total - roundState.movementActions.used);
}
/**
 * Remaining reaction actions this combat round (initiative shop / stones increase `total`).
 */
export function getAvailableReactionActions(actor, combat) {
    const roundState = getRoundState(actor, combat);
    return Math.max(0, roundState.reactionActions.total - roundState.reactionActions.used);
}
/** Read-only `{ used, total, remaining }` for UI / chat. */
export function getReactionActionsSummary(actor, combat) {
    const roundState = getRoundState(actor, combat);
    const total = Math.max(0, Math.floor(Number(roundState.reactionActions?.total) || 0));
    const used = Math.max(0, Math.floor(Number(roundState.reactionActions?.used) || 0));
    return { used, total, remaining: Math.max(0, total - used) };
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
    const owner = getActionEconomyActor(actor) ?? actor;
    const system = owner.system;
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
 * Attributes with per-pool combat stones (must match `MasteryActor.prepareBaseData`).
 */
export const STONE_POOL_ATTRIBUTE_KEYS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits'
];
/**
 * Persist max/current from floor(attribute/8) minus sustained — full pool for round-1 stone assignment.
 * Pass the **combatant's** actor (token document for unlinked PCs) so data matches Stone Powers UI.
 */
export async function refillStonePoolsFromAttributes(actor) {
    if (!isPC(actor))
        return;
    const owner = getActionEconomyActor(actor) ?? actor;
    if (!isPC(owner))
        return;
    const sys = owner.system;
    const updates = {};
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
        const attrValue = Number(sys.attributes?.[attr]?.value ?? 0);
        const maxStones = Math.floor(attrValue / 8);
        const sustained = Number(sys.stonePools?.[attr]?.sustained ?? 0);
        const effectiveMax = Math.max(0, maxStones - sustained);
        const curMax = Number(sys.stonePools?.[attr]?.max ?? -1);
        const curCurrent = Number(sys.stonePools?.[attr]?.current ?? -1);
        if (curMax !== maxStones || curCurrent !== effectiveMax) {
            updates[`system.stonePools.${attr}.max`] = maxStones;
            updates[`system.stonePools.${attr}.current`] = effectiveMax;
        }
    }
    if (Object.keys(updates).length > 0) {
        await owner.update(updates);
        if (globalThis.CONFIG?.masterySystemDebugStonePools === true) {
            console.log('Mastery System | [StonePools] refillStonePoolsFromAttributes', owner.name, updates);
        }
    }
}
/**
 * Fix stale max (e.g. 0 in DB) and clamp current without forcing a full refill (round 2+).
 */
export async function syncStonePoolCapsFromAttributes(actor) {
    if (!isPC(actor))
        return;
    const owner = getActionEconomyActor(actor) ?? actor;
    if (!isPC(owner))
        return;
    const sys = owner.system;
    const updates = {};
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
        const attrValue = Number(sys.attributes?.[attr]?.value ?? 0);
        const maxStones = Math.floor(attrValue / 8);
        const sustained = Number(sys.stonePools?.[attr]?.sustained ?? 0);
        const effectiveMax = Math.max(0, maxStones - sustained);
        const curMax = Number(sys.stonePools?.[attr]?.max ?? -1);
        const curCurrent = Math.max(0, Number(sys.stonePools?.[attr]?.current ?? 0));
        const newCurrent = Math.min(curCurrent, effectiveMax);
        if (curMax !== maxStones || curCurrent !== newCurrent) {
            updates[`system.stonePools.${attr}.max`] = maxStones;
            updates[`system.stonePools.${attr}.current`] = newCurrent;
        }
    }
    if (Object.keys(updates).length > 0) {
        await owner.update(updates);
        if (globalThis.CONFIG?.masterySystemDebugStonePools === true) {
            console.log('Mastery System | [StonePools] syncStonePoolCapsFromAttributes', owner.name, updates);
        }
    }
}
/**
 * Set stone pool current value
 */
export async function setStonePool(actor, attribute, current) {
    const owner = getActionEconomyActor(actor) ?? actor;
    await owner.update({
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
export async function spendStoneAbility(actor, _combatant, attribute, abilityKey, applyEffect, expectedCost) {
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
    const isGenericStoneAbility = abilityKey.startsWith('generic.');
    // Get current usage count and calculate cost
    const uses = isGenericStoneAbility
        ? getGenericStonePowerUsageCount(actor, abilityKey, combat)
        : getStoneUsageCount(actor, attribute, abilityKey, combat);
    // Ramp powers (no Tier 1) pass an explicit higher first-wave cost.
    const cost = expectedCost !== undefined && Number.isFinite(expectedCost) && expectedCost > 0
        ? Math.floor(expectedCost)
        : calculateStoneCost(uses);
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
        // Increment usage counter (General Powers: ein Zähler pro Macht, nicht pro Pool-Farbe)
        if (isGenericStoneAbility) {
            await incrementGenericStonePowerUsage(actor, abilityKey, combat);
        }
        else {
            await incrementStoneUsage(actor, attribute, abilityKey, combat);
        }
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
 * General-Stonepower mit Aufteilung auf mehrere Pool-Farben (wie im Dialog pro Lane).
 * Summe pro Attribut muss exakt `calculateStoneCost(uses)` ergeben.
 */
export async function spendGenericStoneAbilityWithPerAttributeDeductions(actor, _combatant, abilityKey, perAttributeCounts, applyEffect, expectedCost) {
    if (!isPC(actor)) {
        ui.notifications?.warn('NPCs cannot use stone abilities for action bonuses');
        return false;
    }
    const combat = game.combat;
    if (!combat) {
        ui.notifications?.warn('Not in combat!');
        return false;
    }
    if (!abilityKey.startsWith('generic.')) {
        ui.notifications?.error('Mixed pool spend is only for generic stone powers');
        return false;
    }
    const uses = getGenericStonePowerUsageCount(actor, abilityKey, combat);
    // Ramp powers (no Tier 1) pass an explicit higher cost for their first wave;
    // fall back to the standard exponential cost otherwise.
    const cost = expectedCost !== undefined && Number.isFinite(expectedCost) && expectedCost > 0
        ? Math.floor(expectedCost)
        : calculateStoneCost(uses);
    let sum = 0;
    const counts = {};
    for (const attr of STONE_USAGE_ATTR_KEYS) {
        const n = Math.max(0, Math.floor(Number(perAttributeCounts[attr]) || 0));
        if (n > 0)
            counts[attr] = n;
        sum += n;
    }
    if (sum !== cost) {
        ui.notifications?.warn(`Stone payment mismatch for ${abilityKey}: need ${cost} stones across pools, allocation sums to ${sum}`);
        return false;
    }
    for (const attr of STONE_USAGE_ATTR_KEYS) {
        const n = counts[attr] || 0;
        if (!n)
            continue;
        const pool = getStonePool(actor, attr);
        if (pool.current < n) {
            ui.notifications?.warn(`Not enough ${attr} stones! Need ${n}, have ${pool.current}`);
            return false;
        }
    }
    const roundState = getRoundState(actor, combat);
    try {
        await applyEffect(roundState);
        for (const attr of STONE_USAGE_ATTR_KEYS) {
            const n = counts[attr] || 0;
            if (!n)
                continue;
            const pool = getStonePool(actor, attr);
            await setStonePool(actor, attr, pool.current - n);
        }
        await incrementGenericStonePowerUsage(actor, abilityKey, combat);
        ui.notifications?.info(`Spent ${cost} stones (generic power, mixed pools).`);
        return true;
    }
    catch (error) {
        console.error('Mastery System | Error applying generic mixed stone ability', error);
        ui.notifications?.error('Failed to apply stone ability effect');
        return false;
    }
}
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
/**
 * End-of-round stone regen: Mastery Rank stones, automatic.
 * Each stone goes to the next pool that can accept it, in order of attribute value (highest first);
 * ties between equal attributes are shuffled randomly.
 */
export async function applyAutomaticStoneRegen(actor) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const system = owner.system;
    const masteryRank = system.mastery?.rank || 2;
    const regenPoints = masteryRank;
    const attributeKeys = [
        'might',
        'agility',
        'vitality',
        'intellect',
        'resolve',
        'influence'
    ];
    const entries = attributeKeys.map((attr) => ({
        attr,
        value: Number(system.attributes?.[attr]?.value ?? 0)
    }));
    entries.sort((a, b) => b.value - a.value);
    const priority = [];
    let i = 0;
    while (i < entries.length) {
        let j = i + 1;
        while (j < entries.length && entries[j].value === entries[i].value)
            j++;
        const group = entries.slice(i, j).map((e) => e.attr);
        shuffleArray(group);
        priority.push(...group);
        i = j;
    }
    const simulated = {};
    for (const attr of attributeKeys) {
        simulated[attr] = getStonePool(owner, attr).current;
    }
    for (let step = 0; step < regenPoints; step++) {
        let placed = false;
        for (const attr of priority) {
            const pool = getStonePool(owner, attr);
            const sustained = system.stonePools?.[attr]?.sustained || 0;
            const effectiveMax = Math.max(0, pool.max - sustained);
            if (simulated[attr] < effectiveMax) {
                simulated[attr] += 1;
                placed = true;
                break;
            }
        }
        if (!placed)
            break;
    }
    const updates = {};
    for (const attr of attributeKeys) {
        const oldC = getStonePool(owner, attr).current;
        const newC = simulated[attr];
        if (newC !== oldC) {
            updates[`system.stonePools.${attr}.current`] = newC;
        }
    }
    if (Object.keys(updates).length > 0) {
        await owner.update(updates);
        console.log(`Mastery System | Automatic stone regen for ${owner.name}`, {
            regenPoints,
            updates
        });
    }
}
/**
 * Regenerate stones at end of round (automatic; no player allocation dialog).
 */
export async function regenStonesEndOfRound(combat) {
    const user = game.user;
    if (!user)
        return;
    const pcCombatants = combat.combatants.filter((c) => {
        const actor = c.actor;
        return actor && actor.type === 'character' && (user.isGM || actor.isOwner);
    });
    if (pcCombatants.length === 0) {
        return;
    }
    console.log(`Mastery System | Automatic stone regen for ${pcCombatants.length} PC combatant(s)`);
    for (const combatant of pcCombatants) {
        const actor = combatant.actor;
        if (!actor)
            continue;
        const owner = getActionEconomyActor(actor) ?? actor;
        const system = owner.system;
        const attributeKeys = [
            'might',
            'agility',
            'vitality',
            'intellect',
            'resolve',
            'influence'
        ];
        const canRegen = attributeKeys.some((attr) => {
            const pool = getStonePool(owner, attr);
            const sustained = system.stonePools?.[attr]?.sustained || 0;
            const effectiveMax = pool.max - sustained;
            return pool.current < effectiveMax;
        });
        if (!canRegen) {
            console.log(`Mastery System | ${owner.name} stone pools already full, skipping regen`);
            continue;
        }
        await applyAutomaticStoneRegen(actor);
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
        const owner = getActionEconomyActor(actor) ?? actor;
        const system = owner.system;
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
        const updates = {};
        for (const attr of attributeKeys) {
            const pool = getStonePool(owner, attr);
            const sustained = (system.stonePools?.[attr]?.sustained || 0);
            const attrValue = Number(system.attributes?.[attr]?.value ?? 0);
            const maxFromAttr = Math.floor(attrValue / 8);
            const effectiveMax = Math.max(pool.max, maxFromAttr);
            const fullCurrent = Math.max(0, effectiveMax - sustained);
            if (pool.current !== fullCurrent || pool.max !== effectiveMax) {
                updates[`system.stonePools.${attr}.max`] = effectiveMax;
                updates[`system.stonePools.${attr}.current`] = fullCurrent;
            }
        }
        if (Object.keys(updates).length > 0) {
            await owner.update(updates);
            console.log(`Mastery System | Restored stone pools for ${owner.name}`);
        }
        // Drop per-encounter round state and stone usage so stone evade/damage
        // bonuses and usage counters cannot leak into the next combat or out of combat.
        try {
            await owner.unsetFlag?.('mastery-system', 'roundState');
        }
        catch {
            /* ignore */
        }
        try {
            await owner.setFlag?.('mastery-system', 'stoneUsage', {});
        }
        catch {
            /* ignore */
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
 * Clear per-turn stone power bonuses on an actor when their spotlight in the
 * initiative tracker ends (e.g. +8 Evade, +damage dice, armor pen — "this turn").
 * Does not remove round-long initiative-shop totals on `stoneBonuses.extraAttacks` etc.
 */
export async function clearCombatStoneTurnBonusesForActor(actor, combat) {
    if (!combat)
        return;
    const owner = getActionEconomyActor(actor) ?? actor;
    const roundState = getRoundState(actor, combat);
    if (!roundState.stoneBonuses)
        return;
    const sb = roundState.stoneBonuses;
    const changed = (sb.evadeBonus ?? 0) !== 0 ||
        (sb.damageBonus ?? 0) !== 0 ||
        (sb.meleeDamageBonusDice ?? 0) !== 0 ||
        (sb.armorPenetration ?? 0) !== 0 ||
        (sb.meleeIgnoreArmor ?? 0) !== 0 ||
        (sb.freeRaises ?? 0) !== 0 ||
        (sb.critRaises ?? 0) !== 0 ||
        (sb.tempArmor ?? 0) !== 0 ||
        (sb.spellPoolDice ?? 0) !== 0 ||
        (sb.spellKeepDice ?? 0) !== 0 ||
        (sb.tempHpGrantedThisTurn ?? 0) !== 0 ||
        (sb.ignoreWoundPenalties ?? 0) !== 0 ||
        (sb.spellAutoRaises ?? 0) !== 0 ||
        (sb.spellResistanceBonus ?? 0) !== 0 ||
        (sb.spellSpecialBoost ?? 0) !== 0 ||
        (sb.damageReductionBoostPct ?? 0) !== 0 ||
        (sb.phasingChargesFromStones ?? 0) !== 0 ||
        (sb.extendActiveBuffRounds ?? 0) !== 0;
    if (!changed)
        return;
    // Expire Temp HP granted by the Vitality "Temporary HP" stone power. It is a
    // per-turn buff ("until your next turn"): decrement the scalar mirror by the
    // amount this turn granted so it neither persists nor stacks additively
    // across turns/rounds. Any still-unused portion is simply lost on expiry.
    const grantedTempHp = Math.max(0, Math.floor(Number(sb.tempHpGrantedThisTurn ?? 0) || 0));
    if (grantedTempHp > 0) {
        const curTempHp = Math.max(0, Math.floor(Number(owner.system?.health?.tempHP ?? 0) || 0));
        const nextTempHp = Math.max(0, curTempHp - grantedTempHp);
        if (nextTempHp !== curTempHp) {
            try {
                await owner.update?.({ 'system.health.tempHP': nextTempHp });
            }
            catch (e) {
                console.warn('Mastery System | Failed to expire stone Temp HP', e);
            }
        }
    }
    // Round-long bonuses persist through spotlight changes; per-turn bonuses
    // reset when the actor's spotlight in the initiative tracker ends.
    roundState.stoneBonuses = {
        extraAttacks: sb.extraAttacks ?? 0,
        extraReactions: sb.extraReactions ?? 0,
        extraMoveMeters: sb.extraMoveMeters ?? 0,
        evadeBonus: 0,
        damageBonus: 0,
        meleeDamageBonusDice: 0,
        armorPenetration: 0,
        meleeIgnoreArmor: 0,
        freeRaises: 0,
        critRaises: 0,
        tempArmor: 0,
        spellPoolDice: 0,
        spellKeepDice: 0,
        tempHpGrantedThisTurn: 0,
        ignoreWoundPenalties: 0,
        // "one Active Buff you activate this turn" — an unconsumed extension dies with the turn.
        extendActiveBuffRounds: 0,
        secondChanceFreeBoxes: sb.secondChanceFreeBoxes ?? 0,
        spellAutoRaises: 0,
        spellResistanceBonus: 0,
        extraSpellActions: sb.extraSpellActions ?? 0,
        spellSpecialBoost: 0,
        damageReductionBoostPct: 0,
        incomingSpecialReduction: sb.incomingSpecialReduction ?? 0,
        phasingChargesFromStones: 0,
        initiativeBonus: sb.initiativeBonus ?? 0,
        reactionRangeBonus: sb.reactionRangeBonus ?? 0,
        extraPassives: sb.extraPassives ?? 0,
    };
    await setRoundState(owner, roundState);
}
/**
 * Reset round state (called on round change)
 * Clears bonuses and re-applies initiative shop for new round
 */
export async function resetRoundState(actor, combatant, combat) {
    // Create fresh round state
    const isPC = actor.type === 'character';
    const npcSlots = !isPC && actor.type === 'npc'
        ? Math.max(1, Math.min(20, Math.floor(Number(actor.system?.attackSlots) || 1)))
        : 1;
    const npcMoveSlots = !isPC && actor.type === 'npc'
        ? Math.max(1, Math.min(10, Math.floor(Number(actor.system?.npcMovementSlots) || 1)))
        : 1;
    const roundState = {
        combatId: combat.id ?? '',
        round: combat.round || 1,
        turn: combat.turn || 0,
        isPC,
        movementActions: { total: isPC ? 1 : npcMoveSlots, used: 0 },
        attackActions: { total: isPC ? 1 : npcSlots, used: 0 },
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