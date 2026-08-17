/**
 * Action Economy System
 * 
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */

// Actor, Combatant, and Combat are global types in Foundry VTT v13

import { healStressFromBars } from '../utils/calculations.js';
import { getStunnedRank } from '../system/auto-fail.js';
import { sumNpcAttackSlotsFromPowers } from '../utils/npc-attack-model.js';

/** NPC ATK total = sum of Angriffe/Runde copies (falls back to attackSlots). */
function npcAttackSlotsForEconomy(owner: any): number {
  if (!owner || owner.type !== 'npc') return 1;
  try {
    return sumNpcAttackSlotsFromPowers(owner.system);
  } catch {
    return Math.max(1, Math.min(20, Math.floor(Number(owner.system?.attackSlots) || 1)));
  }
}

/** Keep RoundState.attackActions.total in sync with current NPC APR sum. */
function reconcileNpcAttackActions(owner: any, state: RoundState): RoundState {
  if (!owner || owner.type !== 'npc') return state;
  const slots = npcAttackSlotsForEconomy(owner);
  const used = Math.min(Math.max(0, Math.floor(Number(state.attackActions?.used) || 0)), slots);
  if (
    Math.floor(Number(state.attackActions?.total) || 0) === slots &&
    Math.floor(Number(state.attackActions?.used) || 0) === used
  ) {
    return state;
  }
  return {
    ...state,
    attackActions: { total: slots, used },
  };
}
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
  summonBondUsage?: Record<
    string,
    { bondId: string; attacksUsed: number; specialApplied: boolean; reactionsUsed: number }
  >;
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
export function isPC(actor: Actor | null | undefined): boolean {
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
function findPlacedTokenDocumentForActorId(actorId: string): any | null {
  const combat = (game as any).combat;
  if (combat?.combatants?.size) {
    for (const c of combat.combatants) {
      const t = (c as any).token;
      if (!t) continue;
      if (t.actorId === actorId) return t;
    }
  }
  const placeables = (canvas as any)?.tokens?.placeables;
  if (placeables?.length) {
    for (const tok of placeables) {
      const td = tok.document;
      if (td?.actorId === actorId) return td;
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
const actionEconomyResolveInProgress = new Set<string>();

export function getActionEconomyActor(actor: Actor | null | undefined): Actor | null {
  if (!actor) return null;
  const anyA = actor as any;
  if (anyA.type !== 'character') return actor;

  if (actionEconomyResolveInProgress.has(anyA.id)) return actor;
  actionEconomyResolveInProgress.add(anyA.id);
  try {
    return resolveActionEconomyActorInner(anyA);
  } finally {
    actionEconomyResolveInProgress.delete(anyA.id);
  }
}

function resolveActionEconomyActorInner(anyA: any): Actor {
  const actor = anyA as Actor;

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
  const baseId: string | undefined = doc?.actorId ?? anyA.id;
  const world = baseId ? ((game as any).actors?.get(baseId) as Actor | undefined) : undefined;
  // When already running on a token actor, use `actor` directly — `doc.actor` would
  // re-enter prepareData on the same synthetic actor during canvas init.
  const tokenActor = (
    anyA.isToken ? actor : (doc as any)?.actor
  ) as Actor | undefined;

  if (
    tokenActor &&
    totalStoneCapacityFromAttributes(tokenActor) > totalStoneCapacityFromAttributes(world)
  ) {
    return tokenActor;
  }
  if (world && (world as any).type === 'character') {
    return world as Actor;
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
  // Prepare phase runs on round 0. Stone purchases made there belong to round 1,
  // so both writes and reads must normalise to 1 — otherwise every read during
  // prepare returns a fresh default and the purchases are silently dropped when
  // Foundry advances the encounter to round 1.
  const round = Math.max(1, Math.floor(Number(combat?.round ?? 1) || 1));
  const storedCombatId = String(stored?.combatId ?? '');

  // Must match encounter AND round — a new combat can start again at round 1 with a clean tracker.
  if (
    stored &&
    stored.round === round &&
    storedCombatId === combatId
  ) {
    // NPC ATK label / spend budget must follow live Angriffe/Runde edits.
    return reconcileNpcAttackActions(owner, stored);
  }

  // Create default state
  const isPC = owner.type === 'character';
  const npcAttackSlots = owner.type === 'npc' ? npcAttackSlotsForEconomy(owner) : 1;
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
    round,
    turn: combat?.turn || 0,
    isPC,
    ...baseActions,
    moveBonusMeters: 0,
    usedPowerIdsThisRound: [],
    npcAttackUsesThisRound: {},
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
 * Set round state on actor.
 *
 * Foundry `setFlag` **merges** object values — writing `npcAttackUsesThisRound: {}`
 * does NOT remove prior keys. That left spent NPC attack copies stuck forever across
 * rounds. Always replace the whole `roundState` flag (unset, then set).
 */
export async function setRoundState(actor: Actor, state: RoundState): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const o = owner as any;
  const toSave: RoundState = { ...state };
  if (toSave.combatId !== undefined) {
    (toSave as any).combatId = String(toSave.combatId);
  }
  // Ensure object maps are plain data (never leave undefined holes that skip clears).
  if (!toSave.npcAttackUsesThisRound) toSave.npcAttackUsesThisRound = {};
  if (!toSave.usedPowerIdsThisRound) toSave.usedPowerIdsThisRound = [];

  const hadPrev =
    !!o.getFlag?.('mastery-system', 'roundState') ||
    !!o.flags?.['mastery-system']?.roundState;
  if (hadPrev && typeof o.unsetFlag === 'function') {
    try {
      await o.unsetFlag('mastery-system', 'roundState');
    } catch (err) {
      console.warn('Mastery System | unsetFlag(roundState) failed; attempting replace via update', err);
      try {
        await o.update?.({ 'flags.mastery-system.-=roundState': null });
      } catch {
        /* ignore — setFlag below still runs */
      }
    }
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

/** How many times this NPC attack option was already used this round. */
export function getNpcAttackUsesThisRound(
  actor: Actor,
  combat: Combat | null,
  npcAttackOptionId: string
): number {
  if (!npcAttackOptionId) return 0;
  const rs = getRoundState(actor, combat);
  return Math.max(0, Math.floor(Number(rs.npcAttackUsesThisRound?.[npcAttackOptionId]) || 0));
}

/** Whether this NPC attack still has remaining uses this round (maxUses is 1–5). */
export function canUseNpcAttackThisRound(
  actor: Actor,
  combat: Combat | null,
  npcAttackOptionId: string,
  maxUses: number
): boolean {
  const cap = Math.min(5, Math.max(1, Math.floor(Number(maxUses) || 1)));
  return getNpcAttackUsesThisRound(actor, combat, npcAttackOptionId) < cap;
}

/** Record one use of an NPC attack option this round. */
export async function markNpcAttackUsedThisRound(
  actor: Actor,
  combat: Combat | null,
  npcAttackOptionId: string
): Promise<void> {
  if (!npcAttackOptionId) return;
  const rs = getRoundState(actor, combat);
  const map = { ...(rs.npcAttackUsesThisRound ?? {}) };
  map[npcAttackOptionId] = Math.max(0, Math.floor(Number(map[npcAttackOptionId]) || 0)) + 1;
  rs.npcAttackUsesThisRound = map;
  await setRoundState(actor, rs);
}

/** Undo one use (e.g. attack roll failed after spending an action). */
export async function unmarkNpcAttackUsedThisRound(
  actor: Actor,
  combat: Combat | null,
  npcAttackOptionId: string
): Promise<void> {
  if (!npcAttackOptionId) return;
  const rs = getRoundState(actor, combat);
  const map = { ...(rs.npcAttackUsesThisRound ?? {}) };
  const next = Math.max(0, Math.floor(Number(map[npcAttackOptionId]) || 0) - 1);
  if (next <= 0) delete map[npcAttackOptionId];
  else map[npcAttackOptionId] = next;
  rs.npcAttackUsesThisRound = map;
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
  if ((actor as any).type === 'summon') {
    const { resolveSummonBondContext, spendSummonAttack } = await import('../stones/summon-combat.js');
    const ctx = resolveSummonBondContext(actor);
    if (ctx) {
      const res = await spendSummonAttack(ctx.owner, combat, ctx.bond);
      if (!res.ok) {
        ui.notifications?.warn(res.reason ?? 'No Summon Attacks remaining for this Bond this Round.');
        return false;
      }
      return true;
    }
  }
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
export async function spendMovementPowerAction(actor: Actor, combat: Combat | null): Promise<boolean> {
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
export function isNormalMovementReplaced(actor: Actor, combat: Combat | null): boolean {
  return !!getRoundState(actor, combat).movementPowerUsedThisRound;
}

/**
 * Spend a reaction action
 */
export async function spendReactionAction(actor: Actor, combat: Combat | null): Promise<boolean> {
  if ((actor as any).type === 'summon') {
    const { resolveSummonBondContext, spendSummonBondReaction } = await import('../stones/summon-combat.js');
    const ctx = resolveSummonBondContext(actor);
    if (ctx) {
      const res = await spendSummonBondReaction(ctx.owner, combat, ctx.bond);
      if (!res.ok) {
        ui.notifications?.warn(res.reason ?? 'Summon Bond may use only one Reaction per Round.');
        return false;
      }
      return true;
    }
  }
  const roundState = getRoundState(actor, combat);

  if (roundState.fleeLock) {
    ui.notifications?.warn('Flee: you cannot use Reactions until the start of your next Turn.');
    return false;
  }

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
 * Dash/Disengage locks the base Attack Action (`baseAttackLocked`).
 * Flee locks all attacks until next Turn.
 */
function resolveSummonOwnerAndBond(summonActor: any): { owner: Actor; bondId: string; summonAttacks: number } | null {
  if (!summonActor || summonActor.type !== 'summon') return null;
  const link = summonActor.system?.summonBond ?? {};
  const ownerId = link.ownerActorId || summonActor.system?.familiar?.ownerActorId;
  const bondId = link.bondId || summonActor.system?.familiar?.familiarId;
  if (!ownerId || !bondId) return null;
  const owner = (game as any).actors?.get(ownerId);
  if (!owner) return null;
  const bonds = Array.isArray(owner.system?.summonBonds) ? owner.system.summonBonds : [];
  const bond = bonds.find((b: any) => b.id === bondId);
  if (!bond) return null;
  return { owner, bondId, summonAttacks: Math.max(1, Math.floor(Number(bond.summonAttacks) || 1)) };
}

export function getAvailableAttackActions(actor: Actor, combat: Combat | null): number {
  const summonCtx = resolveSummonOwnerAndBond(actor);
  if (summonCtx) {
    const rs = getRoundState(summonCtx.owner, combat);
    const used = Math.max(0, Math.floor(Number((rs as any).summonBondUsage?.[summonCtx.bondId]?.attacksUsed) || 0));
    return Math.max(0, summonCtx.summonAttacks - used);
  }
  const roundState = getRoundState(actor, combat);
  if (roundState.fleeLock) return 0;
  const owner = getActionEconomyActor(actor) ?? actor;
  const stunnedLock = Math.max(0, getStunnedRank(owner));
  const baseLock = roundState.baseAttackLocked ? 1 : 0;
  const effectiveTotal = Math.max(0, roundState.attackActions.total - stunnedLock - baseLock);
  const n = Math.max(0, effectiveTotal - roundState.attackActions.used);
  return n;
}

/** Apply Dash / Disengage / Flee side-effects after spending Movement. */
export async function applyBasicMovementManeuverFlags(
  actor: Actor,
  combat: Combat | null,
  maneuverId: string,
): Promise<void> {
  const id = String(maneuverId || '');
  if (!id) return;
  const rs = getRoundState(actor, combat);
  if (id === 'dash') {
    rs.baseAttackLocked = true;
  } else if (id === 'disengage') {
    rs.baseAttackLocked = true;
    rs.safeMovementThisTurn = true;
  } else if (id === 'flee') {
    rs.fleeLock = true;
    rs.baseAttackLocked = true;
  }
  await setRoundState(actor, rs);
}

export function isFleeLocked(actor: Actor, combat: Combat | null): boolean {
  return !!getRoundState(actor, combat).fleeLock;
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
  const summonCtx = resolveSummonOwnerAndBond(actor);
  if (summonCtx) {
    const rs = getRoundState(summonCtx.owner, combat);
    const used = Math.max(0, Math.floor(Number((rs as any).summonBondUsage?.[summonCtx.bondId]?.reactionsUsed) || 0));
    return Math.max(0, 1 - used);
  }
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
 * Refund one movement action if any were spent this round.
 */
export async function refundMovementAction(actor: Actor, combat: Combat | null): Promise<void> {
  const roundState = getRoundState(actor, combat);
  if (roundState.movementActions.used <= 0) return;
  roundState.movementActions.used -= 1;
  await setRoundState(actor, roundState);
}

/** Quick Load Reload(1) spent so far this Turn (capped at Mastery Rank). */
export function getQuickLoadReloadThisTurn(actor: Actor, combat: Combat | null): number {
  return Math.max(0, Math.floor(Number(getRoundState(actor, combat).quickLoadReloadThisTurn) || 0));
}

/** Record one Quick Load Reload(1). Returns false if already at Mastery Rank cap. */
export async function recordQuickLoadReload(
  actor: Actor,
  combat: Combat | null,
  masteryRank: number,
): Promise<boolean> {
  const rs = getRoundState(actor, combat);
  const used = Math.max(0, Math.floor(Number(rs.quickLoadReloadThisTurn) || 0));
  const cap = Math.max(1, Math.floor(Number(masteryRank) || 1));
  if (used >= cap) return false;
  rs.quickLoadReloadThisTurn = used + 1;
  await setRoundState(actor, rs);
  return true;
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
    const user = typeof game !== 'undefined' ? game.user : null;
    if (
      user &&
      !user.isGM &&
      typeof (owner as any).canUserModify === 'function' &&
      !(owner as any).canUserModify(user, 'update')
    ) {
      return;
    }
    await owner.update(updates);
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
  applyEffect: (roundState: RoundState) => Promise<void>,
  expectedCost?: number,
  colorlessSpent = 0,
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

  if (isFleeLocked(actor, combat)) {
    ui.notifications?.warn('Flee: you cannot spend Stones until the start of your next Turn.');
    return false;
  }

  const isGenericStoneAbility = abilityKey.startsWith('generic.');
  // Get current usage count and calculate cost
  const uses = isGenericStoneAbility
    ? getGenericStonePowerUsageCount(actor, abilityKey, combat)
    : getStoneUsageCount(actor, attribute, abilityKey, combat);
  // Ramp powers (no Tier 1) pass an explicit higher first-wave cost.
  const cost =
    expectedCost !== undefined && Number.isFinite(expectedCost) && expectedCost > 0
      ? Math.floor(expectedCost)
      : calculateStoneCost(uses);
  
  // Get stone pool
  const pool = getStonePool(actor, attribute);
  
  const colorlessWanted = Math.max(0, Math.floor(Number(colorlessSpent) || 0));
  let colorlessUsed = 0;
  try {
    const { getTempColorlessStones } = await import('../stones/colorless-stones.js');
    colorlessUsed = Math.min(colorlessWanted, getTempColorlessStones(actor));
  } catch {
    colorlessUsed = 0;
  }
  const attributeCost = Math.max(0, cost - colorlessUsed);

  // Check if enough stones
  if (pool.current < attributeCost) {
    ui.notifications?.warn(
      `Not enough ${attribute} stones! Need ${attributeCost}, have ${pool.current}`
    );
    return false;
  }
  
  // Get round state
  const roundState = getRoundState(actor, combat);
  
  // Apply effect (modifies roundState)
  try {
    await applyEffect(roundState);
    
    // Deduct stones
    if (attributeCost > 0) {
      await setStonePool(actor, attribute, pool.current - attributeCost);
    }
    if (colorlessUsed > 0) {
      const { spendTempColorlessStones } = await import('../stones/colorless-stones.js');
      await spendTempColorlessStones(actor, colorlessUsed);
    }

    // Increment usage counter (General Powers: ein Zähler pro Macht, nicht pro Pool-Farbe)
    if (isGenericStoneAbility) {
      await incrementGenericStonePowerUsage(actor, abilityKey, combat);
    } else {
      await incrementStoneUsage(actor, attribute, abilityKey, combat);
    }
    
    // Do not call setRoundState(actor, roundState) here: `roundState` is the pre-effect snapshot.
    // Stone powers call getRoundState + setRoundState inside apply(); saving this snapshot would
    // overwrite extra attacks / move bonuses / reactions just granted.
    
    const leftover = pool.current - attributeCost;
    const colorlessNote = colorlessUsed > 0 ? ` + ${colorlessUsed} colorless` : '';
    ui.notifications?.info(
      `Spent ${attributeCost} ${attribute} stones${colorlessNote}. (${leftover} ${attribute} remaining)`
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
  perAttributeCounts: Partial<Record<AttributeKey | 'colorless', number>>,
  applyEffect: (roundState: RoundState) => Promise<void>,
  expectedCost?: number
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
  // Ramp powers (no Tier 1) pass an explicit higher cost for their first wave;
  // fall back to the standard exponential cost otherwise.
  const cost =
    expectedCost !== undefined && Number.isFinite(expectedCost) && expectedCost > 0
      ? Math.floor(expectedCost)
      : calculateStoneCost(uses);

  let sum = 0;
  const counts: Partial<Record<AttributeKey, number>> = {};
  for (const attr of STONE_USAGE_ATTR_KEYS) {
    const n = Math.max(0, Math.floor(Number(perAttributeCounts[attr]) || 0));
    if (n > 0) counts[attr] = n;
    sum += n;
  }
  const witsN = Math.max(0, Math.floor(Number(perAttributeCounts.wits) || 0));
  if (witsN > 0) {
    counts.wits = witsN;
    sum += witsN;
  }
  const colorlessN = Math.max(0, Math.floor(Number(perAttributeCounts.colorless) || 0));
  sum += colorlessN;

  if (sum !== cost) {
    ui.notifications?.warn(
      `Stone payment mismatch for ${abilityKey}: need ${cost} stones across pools, allocation sums to ${sum}`
    );
    return false;
  }

  if (colorlessN > 0) {
    const { getTempColorlessStones } = await import('../stones/colorless-stones.js');
    const have = getTempColorlessStones(actor);
    if (have < colorlessN) {
      ui.notifications?.warn(`Not enough colorless stones! Need ${colorlessN}, have ${have}`);
      return false;
    }
  }

  for (const attr of Object.keys(counts) as AttributeKey[]) {
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

    for (const attr of Object.keys(counts) as AttributeKey[]) {
      const n = counts[attr] || 0;
      if (!n) continue;
      const pool = getStonePool(actor, attr);
      await setStonePool(actor, attr, pool.current - n);
    }
    if (colorlessN > 0) {
      const { spendTempColorlessStones } = await import('../stones/colorless-stones.js');
      await spendTempColorlessStones(actor, colorlessN);
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
  }
}

/**
 * Apply a player-chosen regen allocation (Mastery Rank stones back into chosen pools).
 */
export async function applyStoneRegenAllocation(
  actor: Actor,
  allocation: Partial<Record<AttributeKey, number>>,
): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const system = (owner.system as any);
  const updates: Record<string, number> = {};
  const keys: AttributeKey[] = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
  ];
  for (const attr of keys) {
    const add = Math.max(0, Math.floor(Number(allocation[attr]) || 0));
    if (!add) continue;
    const pool = getStonePool(owner, attr);
    const sustained = Number(system.stonePools?.[attr]?.sustained) || 0;
    const cap = Math.max(0, pool.max - sustained);
    const next = Math.min(cap, pool.current + add);
    if (next !== pool.current) {
      updates[`system.stonePools.${attr}.current`] = next;
    }
  }
  if (Object.keys(updates).length > 0) {
    await owner.update(updates);
  }
}

/**
 * Round advance no longer auto-fills pools. Players pick which stones come back
 * in StoneRegenDialog before Stone Powers.
 */
export async function regenStonesEndOfRound(_combat: Combat): Promise<void> {
  /* interactive regen runs in StoneRegenDialog */
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
    const updates: any = {};

    // Same target as the round-1 refill: capacity from the attribute, current
    // filled up to capacity minus sustained. Artifact-bound stones are not
    // subtracted here — bindings are deducted when stones are spent
    // (`poolSpendableStones`), so they stay reserved without shrinking the pool.
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
      const pool = getStonePool(owner, attr);
      const sustained = (system.stonePools?.[attr]?.sustained || 0);
      const attrValue = Number(system.attributes?.[attr]?.value ?? 0);
      const maxStones = Math.floor(attrValue / 8);
      const fullCurrent = Math.max(0, maxStones - sustained);

      if (pool.current !== fullCurrent || pool.max !== maxStones) {
        updates[`system.stonePools.${attr}.max`] = maxStones;
        updates[`system.stonePools.${attr}.current`] = fullCurrent;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await owner.update(updates);
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
  const combatId = String((combat as any)?.id ?? '');
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;

    const flagOwner = (getActionEconomyActor(actor) ?? actor) as any;

    // Stone Powers for round 1 are bought during the prepare phase, before
    // Foundry reports `started`. That state must survive combat start.
    const stored = flagOwner.getFlag?.('mastery-system', 'roundState') as RoundState | undefined;
    const preparedForThisCombat =
      !!stored &&
      String(stored.combatId ?? '') === combatId &&
      Math.max(1, Math.floor(Number(stored.round) || 1)) <= 1;
    if (preparedForThisCombat) continue;

    const roundState = getRoundState(actor, combat);
    await setRoundState(actor, roundState);

    // Reset stone usage (same owner as roundState for unlinked PCs)
    await flagOwner.setFlag('mastery-system', 'stoneUsage', {});
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
  // Basic maneuver turn locks expire at the start of your next Turn.
  roundState.baseAttackLocked = false;
  roundState.safeMovementThisTurn = false;
  roundState.fleeLock = false;
  roundState.quickLoadReloadThisTurn = 0;
  
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
    (sb.spellPoolDice ?? 0) !== 0 ||
    (sb.spellKeepDice ?? 0) !== 0 ||
    (sb.tempHpGrantedThisTurn ?? 0) !== 0 ||
    (sb.ignoreWoundPenalties ?? 0) !== 0 ||
    (sb.spellAutoRaises ?? 0) !== 0 ||
    (sb.spellResistanceBonus ?? 0) !== 0 ||
    (sb.spellSpecialBoost ?? 0) !== 0 ||
    (sb.damageReductionBoostPct ?? 0) !== 0 ||
    (sb.tempWard ?? 0) !== 0 ||
    (sb.tempParryPool ?? 0) !== 0 ||
    (sb.tempDamageNegation ?? 0) !== 0 ||
    (sb.phasingChargesFromStones ?? 0) !== 0 ||
    (sb.extendActiveBuffRounds ?? 0) !== 0;
  if (!changed) return;
  // Expire Temp HP granted by the Vitality "Temporary HP" stone power. It is a
  // per-turn buff ("until your next turn"): decrement the scalar mirror by the
  // amount this turn granted so it neither persists nor stacks additively
  // across turns/rounds. Any still-unused portion is simply lost on expiry.
  const grantedTempHp = Math.max(0, Math.floor(Number(sb.tempHpGrantedThisTurn ?? 0) || 0));
  if (grantedTempHp > 0) {
    const curTempHp = Math.max(0, Math.floor(Number((owner as any).system?.health?.tempHP ?? 0) || 0));
    const nextTempHp = Math.max(0, curTempHp - grantedTempHp);
    if (nextTempHp !== curTempHp) {
      try {
        await (owner as any).update?.({ 'system.health.tempHP': nextTempHp });
      } catch (e) {
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
    incomingSpecialReduction: 0,
    tempWard: 0,
    tempParryPool: 0,
    tempDamageNegation: 0,
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
    !isPC && (actor as any).type === 'npc' ? npcAttackSlotsForEconomy(actor) : 1;
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
    npcAttackUsesThisRound: {},
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
  roundState.npcAttackUsesThisRound = {};
  roundState.combatId = (combat as any).id ?? '';

  await setRoundState(actor, roundState);
}
