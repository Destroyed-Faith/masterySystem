/**
 * Action Economy System
 * 
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */

// Actor, Combatant, and Combat are global types in Foundry VTT v13

import { healStressFromBars } from '../utils/calculations.js';

export type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence';

const STONE_USAGE_ATTR_KEYS: AttributeKey[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence'
];

function genericStoneUsageFlagKey(abilityKey: string, round: number, turn: number): string {
  return `generic:${abilityKey}:${round}:${turn}`;
}

/**
 * Nutzungszähler für General-Stonepowers (generic.*): ein Wert pro Macht/Zug — unabhängig davon,
 * welcher Pool bezahlt hat. Sonst startet jede Farbe wieder bei Kosten 1 und die UI bleibt leer.
 */
export function getGenericStonePowerUsageCount(
  actor: Actor,
  abilityKey: string,
  combat: Combat | null
): number {
  const owner = getActionEconomyActor(actor) ?? actor;
  const round = combat?.round || 1;
  const turn = combat?.turn || 0;
  const usageKey = genericStoneUsageFlagKey(abilityKey, round, turn);
  const stoneUsage = (owner as any).getFlag('mastery-system', 'stoneUsage') as
    | Record<string, number>
    | undefined;
  if (stoneUsage && Object.prototype.hasOwnProperty.call(stoneUsage, usageKey)) {
    return stoneUsage[usageKey] || 0;
  }
  let legacy = 0;
  for (const attr of STONE_USAGE_ATTR_KEYS) {
    legacy += getStoneUsageCount(actor, attr, abilityKey, combat);
  }
  return legacy;
}

export async function incrementGenericStonePowerUsage(
  actor: Actor,
  abilityKey: string,
  combat: Combat | null
): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const round = combat?.round || 1;
  const turn = combat?.turn || 0;
  const usageKey = genericStoneUsageFlagKey(abilityKey, round, turn);
  const stoneUsage =
    ((owner as any).getFlag('mastery-system', 'stoneUsage') as Record<string, number>) || {};
  stoneUsage[usageKey] = (stoneUsage[usageKey] || 0) + 1;
  await (owner as any).setFlag('mastery-system', 'stoneUsage', stoneUsage);
}

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
  movementActions: { total: number; used: number };
  attackActions: { total: number; used: number };
  reactionActions: { total: number; used: number };
  moveBonusMeters: number; // Total movement distance bonus this round
  initiativeShop?: {
    round: number;
    extraMovement: number; // Number of purchases (each = +2m)
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
    damageBonus?: number;
    armorPenetration?: number;
    evadeBonus?: number;
    critRaises?: number;
    tempArmor?: number;
    freeRaises?: number;
    saveKeepBonus?: number;
    spellPoolDice?: number;
    spellKeepDice?: number;
  };
}

/**
 * Stone usage tracking key format: `${attribute}:${abilityKey}:${round}:${turn}`
 */
export type StoneUsageKey = string;

/**
 * Check if an actor is a PC
 */
export function isPC(actor: Actor | null | undefined): boolean {
  return actor?.type === 'character';
}

/**
 * Find a placed token document for this actor id (combat first, then canvas).
 * `game.actors.get(id)` often has no `actor.token`, so we cannot detect unlinked from it alone.
 */
function findPlacedTokenDocumentForActorId(actorId: string): any | null {
  const combat = (game as any).combat;
  if (combat?.combatants?.size) {
    for (const c of combat.combatants) {
      const t = (c as any).token;
      if (!t) continue;
      const ca = (c as any).actor;
      if (ca?.id === actorId || t.actorId === actorId) return t;
    }
  }
  const placeables = (canvas as any)?.tokens?.placeables;
  if (placeables?.length) {
    for (const tok of placeables) {
      const td = tok.document;
      if (tok.actor?.id === actorId || td?.actorId === actorId) return td;
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
export function getActionEconomyActor(actor: Actor | null | undefined): Actor | null {
  if (!actor) return null;
  const anyA = actor as any;
  if (anyA.type !== 'character') return actor;

  let doc = anyA.token?.document;
  if (!doc) {
    doc = findPlacedTokenDocumentForActorId(anyA.id);
  }

  if (doc?.actorLink === true) {
    return actor;
  }

  const baseId: string | undefined = doc?.actorId ?? anyA.id;
  if (baseId) {
    const world = (game as any).actors?.get(baseId);
    if (world && (world as any).type === 'character') {
      return world as Actor;
    }
  }
  return actor;
}

/**
 * Get round state from actor flags
 */
export function getRoundState(actor: Actor, combat: Combat | null): RoundState {
  const owner = (getActionEconomyActor(actor) ?? actor) as any;
  const stored = owner.getFlag('mastery-system', 'roundState') as RoundState | undefined;
  const combatId = (combat as any)?.id ?? '';
  const round = combat?.round ?? 1;

  // Must match encounter AND round — a new combat can start again at round 1 with a clean tracker.
  if (
    stored &&
    stored.round === round &&
    stored.combatId === combatId
  ) {
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
export async function setRoundState(actor: Actor, state: RoundState): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const o = owner as any;
  await o.setFlag('mastery-system', 'roundState', state);
  Hooks.callAll('masterySystem.roundStateUpdated', { actorId: o.id });
}

/**
 * Whether this power item has already been used this round (combat powers only).
 */
export function hasPowerBeenUsedThisRound(
  actor: Actor,
  combat: Combat | null,
  powerItemId: string
): boolean {
  const rs = getRoundState(actor, combat);
  return (rs.usedPowerIdsThisRound ?? []).includes(powerItemId);
}

/**
 * Record a power as used this round. No-op if already recorded.
 */
export async function markPowerUsedThisRound(
  actor: Actor,
  combat: Combat | null,
  powerItemId: string
): Promise<void> {
  if (!powerItemId) return;
  const rs = getRoundState(actor, combat);
  const arr = rs.usedPowerIdsThisRound ?? [];
  if (arr.includes(powerItemId)) return;
  rs.usedPowerIdsThisRound = [...arr, powerItemId];
  await setRoundState(actor, rs);
}

/**
 * Undo mark (e.g. attack roll failed after spending an action).
 */
export async function unmarkPowerUsedThisRound(
  actor: Actor,
  combat: Combat | null,
  powerItemId: string
): Promise<void> {
  if (!powerItemId) return;
  const rs = getRoundState(actor, combat);
  const arr = rs.usedPowerIdsThisRound ?? [];
  if (!arr.length) return;
  rs.usedPowerIdsThisRound = arr.filter((id) => id !== powerItemId);
  await setRoundState(actor, rs);
}

/**
 * Apply initiative shop bonuses to round state
 * Called when shop purchases are made or at start of round
 */
export async function applyInitiativeShopBonuses(
  actor: Actor,
  combatant: Combatant,
  combat: Combat
): Promise<void> {
  if (!isPC(actor)) return; // NPCs don't get shop bonuses
  
  const shopData = combatant.getFlag('mastery-system', 'initiativeShop') as any;
  if (!shopData || shopData.round !== combat.round) {
    return; // No shop data for this round
  }
  
  const roundState = getRoundState(actor, combat);
  roundState.combatId = (combat as any).id ?? '';

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

  const owner = (getActionEconomyActor(actor) ?? actor) as any;
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

export interface StonePowersConfigLockState {
  combatId: string;
  round: number;
}

/**
 * True after this PC has spent movement, attack, or reaction in the current combat round
 * (Stone Powers attribute defaults / activations are then read-only until the next round).
 */
export function isStonePowersConfigurationLocked(actor: Actor, combat: Combat | null): boolean {
  if (!combat) return false;
  const owner = (getActionEconomyActor(actor) ?? actor) as any;
  const lock = owner.getFlag('mastery-system', STONE_POWERS_CONFIG_LOCK_FLAG) as
    | StonePowersConfigLockState
    | undefined;
  return !!(lock && lock.combatId === combat.id && lock.round === combat.round);
}

export async function lockStonePowersConfigurationForRound(actor: Actor, combat: Combat | null): Promise<void> {
  if (!combat || !isPC(actor)) return;
  const owner = (getActionEconomyActor(actor) ?? actor) as any;
  await owner.setFlag('mastery-system', STONE_POWERS_CONFIG_LOCK_FLAG, {
    combatId: combat.id,
    round: combat.round
  });
}

export async function clearStonePowersConfigurationLock(actor: Actor): Promise<void> {
  const owner = (getActionEconomyActor(actor) ?? actor) as any;
  await owner.unsetFlag('mastery-system', STONE_POWERS_CONFIG_LOCK_FLAG);
}

export async function clearStonePowersConfigurationLocksInCombat(combat: Combat): Promise<void> {
  for (const c of combat.combatants) {
    const a = c.actor;
    if (a && a.type === 'character') await clearStonePowersConfigurationLock(a);
  }
}

async function maybeLockStonePowersAfterCombatAction(actor: Actor, combat: Combat | null): Promise<void> {
  if (!combat || !isPC(actor)) return;
  await lockStonePowersConfigurationForRound(actor, combat);
}

export async function spendAttackAction(actor: Actor, combat: Combat | null): Promise<boolean> {
  const roundState = getRoundState(actor, combat);

  if (roundState.attackActions.used >= roundState.attackActions.total) {
    ui.notifications?.warn('No attack actions remaining!');
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
export async function spendMovementAction(actor: Actor, combat: Combat | null): Promise<boolean> {
  const roundState = getRoundState(actor, combat);
  
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
 * Spend a reaction action
 */
export async function spendReactionAction(actor: Actor, combat: Combat | null): Promise<boolean> {
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
 * Get available attack actions (remaining count)
 */
export function getAvailableAttackActions(actor: Actor, combat: Combat | null): number {
  const roundState = getRoundState(actor, combat);
  return Math.max(0, roundState.attackActions.total - roundState.attackActions.used);
}

/**
 * Get available movement actions (remaining count)
 */
export function getAvailableMovementActions(actor: Actor, combat: Combat | null): number {
  const roundState = getRoundState(actor, combat);
  return Math.max(0, roundState.movementActions.total - roundState.movementActions.used);
}

/**
 * Consume an attack action (alias for spendAttackAction)
 */
export async function consumeAttackAction(actor: Actor, combat: Combat | null): Promise<boolean> {
  return await spendAttackAction(actor, combat);
}

/**
 * Refund one attack action if any were spent this round (e.g. attack flow failed after spend).
 */
export async function refundAttackAction(actor: Actor, combat: Combat | null): Promise<void> {
  const roundState = getRoundState(actor, combat);
  if (roundState.attackActions.used <= 0) return;
  roundState.attackActions.used -= 1;
  await setRoundState(actor, roundState);
}

/**
 * Consume a movement action (alias for spendMovementAction)
 */
export async function consumeMovementAction(actor: Actor, combat: Combat | null): Promise<boolean> {
  return await spendMovementAction(actor, combat);
}

/**
 * Get stone usage count for an ability this turn
 */
export function getStoneUsageCount(
  actor: Actor,
  attribute: AttributeKey,
  abilityKey: string,
  combat: Combat | null
): number {
  const owner = getActionEconomyActor(actor) ?? actor;
  const o = owner as any;
  const round = combat?.round || 1;
  const turn = combat?.turn || 0;
  const usageKey: StoneUsageKey = `${attribute}:${abilityKey}:${round}:${turn}`;
  
  const stoneUsage = o.getFlag('mastery-system', 'stoneUsage') as Record<string, number> | undefined;
  return stoneUsage?.[usageKey] || 0;
}

/**
 * Increment stone usage count for an ability this turn
 */
export async function incrementStoneUsage(
  actor: Actor,
  attribute: AttributeKey,
  abilityKey: string,
  combat: Combat | null
): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const o = owner as any;
  const round = combat?.round || 1;
  const turn = combat?.turn || 0;
  const usageKey: StoneUsageKey = `${attribute}:${abilityKey}:${round}:${turn}`;
  
  const stoneUsage = (o.getFlag('mastery-system', 'stoneUsage') as Record<string, number>) || {};
  stoneUsage[usageKey] = (stoneUsage[usageKey] || 0) + 1;
  
  await o.setFlag('mastery-system', 'stoneUsage', stoneUsage);
}

/**
 * Calculate exponential stone cost: 2^(usesThisTurn)
 */
export function calculateStoneCost(usesThisTurn: number): number {
  return Math.pow(2, usesThisTurn);
}

/**
 * Get stone pool for an attribute
 */
export function getStonePool(actor: Actor, attribute: AttributeKey): { current: number; max: number } {
  const system = (actor.system as any);
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
export async function setStonePool(
  actor: Actor,
  attribute: AttributeKey,
  current: number
): Promise<void> {
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
export async function spendStoneAbility(
  actor: Actor,
  _combatant: Combatant,
  attribute: AttributeKey,
  abilityKey: string,
  applyEffect: (roundState: RoundState) => Promise<void>
): Promise<boolean> {
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
  const cost = calculateStoneCost(uses);
  
  // Get stone pool
  const pool = getStonePool(actor, attribute);
  
  // Check if enough stones
  if (pool.current < cost) {
    ui.notifications?.warn(
      `Not enough ${attribute} stones! Need ${cost}, have ${pool.current}`
    );
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
    } else {
      await incrementStoneUsage(actor, attribute, abilityKey, combat);
    }
    
    // Do not call setRoundState(actor, roundState) here: `roundState` is the pre-effect snapshot.
    // Stone powers call getRoundState + setRoundState inside apply(); saving this snapshot would
    // overwrite extra attacks / move bonuses / reactions just granted.
    
    ui.notifications?.info(
      `Spent ${cost} ${attribute} stones. (${pool.current - cost} remaining)`
    );
    
    return true;
  } catch (error) {
    console.error('Mastery System | Error applying stone ability effect', error);
    ui.notifications?.error('Failed to apply stone ability effect');
    return false;
  }
}

/**
 * Regenerate stones at end of round
 * Shows dialog for each PC to allocate regen points (mastery rank per attribute)
 */
export async function regenStonesEndOfRound(combat: Combat): Promise<void> {
  const user = game.user;
  if (!user) return;
  
  // Get all PC combatants that this user owns (or all if GM)
  const pcCombatants = combat.combatants.filter((c: Combatant) => {
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
    if (!actor) continue;
    
    const system = (actor.system as any);
    const masteryRank = system.mastery?.rank || 2;
    const regenPoints = masteryRank;
    
    // Check if any pools can actually regenerate
    const attributeKeys: AttributeKey[] = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
    const canRegen = attributeKeys.some(attr => {
      const pool = getStonePool(actor, attr);
      const sustained = (system.stonePools?.[attr]?.sustained || 0);
      const effectiveMax = pool.max - sustained;
      return pool.current < effectiveMax;
    });
    
    if (!canRegen) {
      console.log(`Mastery System | ${(actor as any).name} stone pools already full, skipping regen`);
      continue;
    }
    
    // Show dialog
    const allocation = await StoneRegenDialog.showForActor(actor, regenPoints);
    
    if (allocation) {
      // Apply allocation
      const updates: any = {};
      for (const [attr, amount] of Object.entries(allocation)) {
        if (amount === 0) continue;
        
        const pool = getStonePool(actor, attr as AttributeKey);
        const sustained = (system.stonePools?.[attr]?.sustained || 0);
        const effectiveMax = pool.max - sustained;
        const newCurrent = Math.min(effectiveMax, pool.current + amount);
        
        updates[`system.stonePools.${attr}.current`] = newCurrent;
      }
      
      if (Object.keys(updates).length > 0) {
        await actor.update(updates);
        console.log(`Mastery System | Applied stone regen for ${(actor as any).name}`, allocation);
      }
    } else {
      console.log(`Mastery System | ${(actor as any).name} skipped stone regen`);
    }
  }
}

/**
 * Restore all stone pools to max after combat
 */
export async function restoreStonesAfterCombat(combat: Combat): Promise<void> {
  const actors = new Set<Actor>();
  
  // Collect all actors from combat
  for (const combatant of combat.combatants) {
    if (combatant.actor) {
      actors.add(combatant.actor);
    }
  }
  
  // Restore stone pools for all PCs
  for (const actor of actors) {
    if (actor.type !== 'character') continue;
    
    const system = (actor.system as any);
    const attributeKeys: AttributeKey[] = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
    const updates: any = {};
    
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
      console.log(`Mastery System | Restored stone pools for ${(actor as any).name}`);
    }
  }
}

/**
 * Initialize round state for all combatants at combat start
 */
export async function initializeCombatRoundState(combat: Combat): Promise<void> {
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;
    
    // Reset round state
    const roundState = getRoundState(actor, combat);
    await setRoundState(actor, roundState);
    
    // Reset stone usage (same owner as roundState for unlinked PCs)
    const flagOwner = getActionEconomyActor(actor) ?? actor;
    await (flagOwner as any).setFlag('mastery-system', 'stoneUsage', {});
    
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
export async function resetTurnState(actor: Actor, combat: Combat | null): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const o = owner as any;
  const roundState = getRoundState(actor, combat);
  roundState.combatId = (combat as any)?.id ?? '';

  // Reset used counts
  roundState.movementActions.used = 0;
  roundState.attackActions.used = 0;
  roundState.reactionActions.used = 0;
  
  // Clear stone usage for this turn (keep round-level usage)
  const stoneUsage = (o.getFlag('mastery-system', 'stoneUsage') as Record<string, number>) || {};
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
export async function resetRoundState(actor: Actor, combatant: Combatant, combat: Combat): Promise<void> {
  // Create fresh round state
  const isPC = actor.type === 'character';
  const roundState: RoundState = {
    combatId: (combat as any).id ?? '',
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
  roundState.combatId = (combat as any).id ?? '';

  await setRoundState(actor, roundState);
}
