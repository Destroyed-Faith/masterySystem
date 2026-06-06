/**
 * Action Economy System
 * 
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */

// Actor, Combatant, and Combat are global types in Foundry VTT v13

import { healStressFromBars } from '../utils/calculations.js';
import { getStunnedRank } from '../system/auto-fail.js';

export type AttributeKey =
  | 'might'
  | 'agility'
  | 'vitality'
  | 'intellect'
  | 'resolve'
  | 'influence'
  | 'wits';

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
      // Unlinked tokens carry their own attribute build on the token delta,
      // while the world prototype may still sit at defaults. Stone pools derive
      // from attributes, so only route to the world actor when it actually has
      // the (equal/greater) stone capacity; otherwise keep the built token actor
      // so its pools/flags stay consistent with what the player sees and plays.
      if (totalStoneCapacityFromAttributes(world) >= totalStoneCapacityFromAttributes(actor)) {
        return world as Actor;
      }
    }
  }
  return actor;
}

/** Sum of attribute-derived stone-pool capacity (⌊value/8⌋) across the core pools. */
function totalStoneCapacityFromAttributes(actor: Actor | null | undefined): number {
  const attrs = (actor as any)?.system?.attributes ?? {};
  let sum = 0;
  for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
    sum += Math.floor((Number(attrs?.[attr]?.value) || 0) / 8);
  }
  return sum;
}

/**
 * Get round state from actor flags
 */
export function getRoundState(actor: Actor, combat: Combat | null): RoundState {
  const owner = (getActionEconomyActor(actor) ?? actor) as any;
  const stored = owner.getFlag('mastery-system', 'roundState') as RoundState | undefined;
  const combatId = String((combat as any)?.id ?? '');
  const round = combat?.round ?? 1;
  const storedCombatId = String(stored?.combatId ?? '');

  // Must match encounter AND round — a new combat can start again at round 1 with a clean tracker.
  if (
    stored &&
    stored.round === round &&
    storedCombatId === combatId
  ) {
    return stored;
  }

  // Create default state
  const isPC = owner.type === 'character';
  const npcAttackSlots =
    owner.type === 'npc'
      ? Math.max(1, Math.min(20, Math.floor(Number(owner.system?.attackSlots) || 1)))
      : 1;
  const npcMoveSlots =
    owner.type === 'npc'
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
export function getMovementRangeBonusMeters(actor: Actor, combat: Combat | null): number {
  const rs = getRoundState(actor, combat);
  return (Number(rs.moveBonusMeters) || 0) + (Number(rs.stoneBonuses?.extraMoveMeters) || 0);
}

/**
 * Set round state on actor
 */
export async function setRoundState(actor: Actor, state: RoundState): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const o = owner as any;
  const toSave: RoundState = { ...state };
  if (toSave.combatId !== undefined) {
    (toSave as any).combatId = String(toSave.combatId);
  }
  await o.setFlag('mastery-system', 'roundState', toSave);
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
  const owner = getActionEconomyActor(actor) ?? actor;
  const stunnedLock = Math.max(0, getStunnedRank(owner));
  const effectiveTotal = Math.max(0, roundState.attackActions.total - stunnedLock);

  if (roundState.attackActions.used >= effectiveTotal) {
    if (stunnedLock > 0) {
      ui.notifications?.warn(`Stunned (${stunnedLock}) — no attack actions remaining this round!`);
    } else {
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
 * Get available attack actions (remaining count).
 * Stunned(X) locks X attack actions for the current round — the total is
 * clamped before subtracting `used`, never going below 0.
 */
export function getAvailableAttackActions(actor: Actor, combat: Combat | null): number {
  const roundState = getRoundState(actor, combat);
  const owner = getActionEconomyActor(actor) ?? actor;
  const stunnedLock = Math.max(0, getStunnedRank(owner));
  const effectiveTotal = Math.max(0, roundState.attackActions.total - stunnedLock);
  const n = Math.max(0, effectiveTotal - roundState.attackActions.used);
  if (n === 0) {
    console.debug('Mastery System | [action-economy] getAvailableAttackActions: 0 remaining', {
      actorId: (owner as any).id,
      name: (owner as any).name,
      combatId: (combat as any)?.id,
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
export function getAvailableMovementActions(actor: Actor, combat: Combat | null): number {
  const roundState = getRoundState(actor, combat);
  return Math.max(0, roundState.movementActions.total - roundState.movementActions.used);
}

/**
 * Remaining reaction actions this combat round (initiative shop / stones increase `total`).
 */
export function getAvailableReactionActions(actor: Actor, combat: Combat | null): number {
  const roundState = getRoundState(actor, combat);
  return Math.max(0, roundState.reactionActions.total - roundState.reactionActions.used);
}

/** Read-only `{ used, total, remaining }` for UI / chat. */
export function getReactionActionsSummary(actor: Actor, combat: Combat | null): {
  used: number;
  total: number;
  remaining: number;
} {
  const roundState = getRoundState(actor, combat);
  const total = Math.max(0, Math.floor(Number(roundState.reactionActions?.total) || 0));
  const used = Math.max(0, Math.floor(Number(roundState.reactionActions?.used) || 0));
  return { used, total, remaining: Math.max(0, total - used) };
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
  const owner = getActionEconomyActor(actor) ?? actor;
  const system = (owner.system as any);
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
] as const;

/**
 * Persist max/current from floor(attribute/8) minus sustained — full pool for round-1 stone assignment.
 * Pass the **combatant's** actor (token document for unlinked PCs) so data matches Stone Powers UI.
 */
export async function refillStonePoolsFromAttributes(actor: Actor): Promise<void> {
  if (!isPC(actor)) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  if (!isPC(owner)) return;
  const sys = (owner.system as any);
  const updates: Record<string, number> = {};
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
    if ((globalThis as any).CONFIG?.masterySystemDebugStonePools === true) {
      console.log('Mastery System | [StonePools] refillStonePoolsFromAttributes', (owner as any).name, updates);
    }
  }
}

/**
 * Fix stale max (e.g. 0 in DB) and clamp current without forcing a full refill (round 2+).
 */
export async function syncStonePoolCapsFromAttributes(actor: Actor): Promise<void> {
  if (!isPC(actor)) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  if (!isPC(owner)) return;
  const sys = (owner.system as any);
  const updates: Record<string, number> = {};
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
    if ((globalThis as any).CONFIG?.masterySystemDebugStonePools === true) {
      console.log('Mastery System | [StonePools] syncStonePoolCapsFromAttributes', (owner as any).name, updates);
    }
  }
}

/**
 * Set stone pool current value
 */
export async function setStonePool(
  actor: Actor,
  attribute: AttributeKey,
  current: number
): Promise<void> {
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
 * General-Stonepower mit Aufteilung auf mehrere Pool-Farben (wie im Dialog pro Lane).
 * Summe pro Attribut muss exakt `calculateStoneCost(uses)` ergeben.
 */
export async function spendGenericStoneAbilityWithPerAttributeDeductions(
  actor: Actor,
  _combatant: Combatant,
  abilityKey: string,
  perAttributeCounts: Partial<Record<AttributeKey, number>>,
  applyEffect: (roundState: RoundState) => Promise<void>
): Promise<boolean> {
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
  const cost = calculateStoneCost(uses);

  let sum = 0;
  const counts: Partial<Record<AttributeKey, number>> = {};
  for (const attr of STONE_USAGE_ATTR_KEYS) {
    const n = Math.max(0, Math.floor(Number(perAttributeCounts[attr]) || 0));
    if (n > 0) counts[attr] = n;
    sum += n;
  }

  if (sum !== cost) {
    ui.notifications?.warn(
      `Stone payment mismatch for ${abilityKey}: need ${cost} stones across pools, allocation sums to ${sum}`
    );
    return false;
  }

  for (const attr of STONE_USAGE_ATTR_KEYS) {
    const n = counts[attr] || 0;
    if (!n) continue;
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
      if (!n) continue;
      const pool = getStonePool(actor, attr);
      await setStonePool(actor, attr, pool.current - n);
    }

    await incrementGenericStonePowerUsage(actor, abilityKey, combat);

    ui.notifications?.info(`Spent ${cost} stones (generic power, mixed pools).`);

    return true;
  } catch (error) {
    console.error('Mastery System | Error applying generic mixed stone ability', error);
    ui.notifications?.error('Failed to apply stone ability effect');
    return false;
  }
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

/**
 * End-of-round stone regen: Mastery Rank stones, automatic.
 * Each stone goes to the next pool that can accept it, in order of attribute value (highest first);
 * ties between equal attributes are shuffled randomly.
 */
export async function applyAutomaticStoneRegen(actor: Actor): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const system = (owner.system as any);
  const masteryRank = system.mastery?.rank || 2;
  const regenPoints = masteryRank;
  const attributeKeys: AttributeKey[] = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence'
  ];

  type Entry = { attr: AttributeKey; value: number };
  const entries: Entry[] = attributeKeys.map((attr) => ({
    attr,
    value: Number(system.attributes?.[attr]?.value ?? 0)
  }));
  entries.sort((a, b) => b.value - a.value);

  const priority: AttributeKey[] = [];
  let i = 0;
  while (i < entries.length) {
    let j = i + 1;
    while (j < entries.length && entries[j]!.value === entries[i]!.value) j++;
    const group = entries.slice(i, j).map((e) => e.attr);
    shuffleArray(group);
    priority.push(...group);
    i = j;
  }

  const simulated: Record<AttributeKey, number> = {} as Record<AttributeKey, number>;
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
    if (!placed) break;
  }

  const updates: Record<string, number> = {};
  for (const attr of attributeKeys) {
    const oldC = getStonePool(owner, attr).current;
    const newC = simulated[attr];
    if (newC !== oldC) {
      updates[`system.stonePools.${attr}.current`] = newC;
    }
  }

  if (Object.keys(updates).length > 0) {
    await owner.update(updates);
    console.log(`Mastery System | Automatic stone regen for ${(owner as any).name}`, {
      regenPoints,
      updates
    });
  }
}

/**
 * Regenerate stones at end of round (automatic; no player allocation dialog).
 */
export async function regenStonesEndOfRound(combat: Combat): Promise<void> {
  const user = game.user;
  if (!user) return;

  const pcCombatants = combat.combatants.filter((c: Combatant) => {
    const actor = c.actor;
    return actor && actor.type === 'character' && (user.isGM || actor.isOwner);
  });

  if (pcCombatants.length === 0) {
    return;
  }

  console.log(`Mastery System | Automatic stone regen for ${pcCombatants.length} PC combatant(s)`);

  for (const combatant of pcCombatants) {
    const actor = combatant.actor;
    if (!actor) continue;

    const owner = getActionEconomyActor(actor) ?? actor;
    const system = (owner.system as any);
    const attributeKeys: AttributeKey[] = [
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
      console.log(`Mastery System | ${(owner as any).name} stone pools already full, skipping regen`);
      continue;
    }

    await applyAutomaticStoneRegen(actor);
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

    const owner = getActionEconomyActor(actor) ?? actor;
    const system = (owner.system as any);
    const attributeKeys: AttributeKey[] = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
    const updates: any = {};
    
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
      console.log(`Mastery System | Restored stone pools for ${(owner as any).name}`);
    }

    // Drop per-encounter round state and stone usage so stone evade/damage
    // bonuses and usage counters cannot leak into the next combat or out of combat.
    try {
      await (owner as any).unsetFlag?.('mastery-system', 'roundState');
    } catch {
      /* ignore */
    }
    try {
      await (owner as any).setFlag?.('mastery-system', 'stoneUsage', {});
    } catch {
      /* ignore */
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
 * Clear per-turn stone power bonuses on an actor when their spotlight in the
 * initiative tracker ends (e.g. +8 Evade, +damage dice, armor pen — "this turn").
 * Does not remove round-long initiative-shop totals on `stoneBonuses.extraAttacks` etc.
 */
export async function clearCombatStoneTurnBonusesForActor(actor: Actor, combat: Combat | null): Promise<void> {
  if (!combat) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  const roundState = getRoundState(actor, combat);
  if (!roundState.stoneBonuses) return;
  const sb = roundState.stoneBonuses;
  const changed =
    (sb.evadeBonus ?? 0) !== 0 ||
    (sb.damageBonus ?? 0) !== 0 ||
    (sb.meleeDamageBonusDice ?? 0) !== 0 ||
    (sb.armorPenetration ?? 0) !== 0 ||
    (sb.meleeIgnoreArmor ?? 0) !== 0 ||
    (sb.freeRaises ?? 0) !== 0 ||
    (sb.critRaises ?? 0) !== 0 ||
    (sb.tempArmor ?? 0) !== 0 ||
    (sb.saveKeepBonus ?? 0) !== 0 ||
    (sb.spellPoolDice ?? 0) !== 0 ||
    (sb.spellKeepDice ?? 0) !== 0 ||
    (sb.tempHpGrantedThisTurn ?? 0) !== 0 ||
    (sb.ignoreWoundPenalties ?? 0) !== 0 ||
    (sb.spellAutoRaises ?? 0) !== 0 ||
    (sb.spellSaveBonus ?? 0) !== 0 ||
    (sb.spellSpecialBoost ?? 0) !== 0 ||
    (sb.damageReductionBoostPct ?? 0) !== 0 ||
    (sb.phasingChargesFromStones ?? 0) !== 0;
  if (!changed) return;
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
    saveKeepBonus: 0,
    spellPoolDice: 0,
    spellKeepDice: 0,
    tempHpGrantedThisTurn: 0,
    ignoreWoundPenalties: 0,
    secondChanceFreeBoxes: sb.secondChanceFreeBoxes ?? 0,
    spellAutoRaises: 0,
    spellSaveBonus: 0,
    extraSpellActions: sb.extraSpellActions ?? 0,
    spellSpecialBoost: 0,
    damageReductionBoostPct: 0,
    saveAllBonus: sb.saveAllBonus ?? 0,
    incomingSpecialReduction: sb.incomingSpecialReduction ?? 0,
    phasingChargesFromStones: 0,
    initiativeBonus: sb.initiativeBonus ?? 0,
    reactionRangeBonus: sb.reactionRangeBonus ?? 0,
    extraPassives: sb.extraPassives ?? 0,
  };
  await setRoundState(owner as Actor, roundState);
}

/**
 * Reset round state (called on round change)
 * Clears bonuses and re-applies initiative shop for new round
 */
export async function resetRoundState(actor: Actor, combatant: Combatant, combat: Combat): Promise<void> {
  // Create fresh round state
  const isPC = actor.type === 'character';
  const npcSlots =
    !isPC && (actor as any).type === 'npc'
      ? Math.max(1, Math.min(20, Math.floor(Number((actor as any).system?.attackSlots) || 1)))
      : 1;
  const npcMoveSlots =
    !isPC && (actor as any).type === 'npc'
      ? Math.max(1, Math.min(10, Math.floor(Number((actor as any).system?.npcMovementSlots) || 1)))
      : 1;
  const roundState: RoundState = {
    combatId: (combat as any).id ?? '',
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
  roundState.combatId = (combat as any).id ?? '';

  await setRoundState(actor, roundState);
}
