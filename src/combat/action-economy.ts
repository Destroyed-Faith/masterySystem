/**
 * Action Economy System
 * 
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */

// Actor, Combatant, and Combat are global types in Foundry VTT v13

import {
  isLifetimeStoneMode,
  resolvedStonePoolMax,
  systemWithStoneProgression,
} from '../progression/v099-rules.js';
import { getStunnedRank } from '../system/auto-fail.js';
import { sumNpcAttackSlotsFromPowers, resolveNpcAttackSlots } from '../utils/npc-attack-model.js';
import { npcReactionSlotsForEconomy } from '../utils/npc-reactions.js';
import { powerIdentityKeyFromItem } from '../utils/power-catalog.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import {
  combatReadyRemaining,
  minLivePoolCurrent,
} from '../stones/stone-combat-ledger.js';

/**
 * Attributes with per-pool combat stones (must match `MasteryActor.prepareBaseData`).
 * Declared early so circular imports (ledger → pool-sync → here) never see `undefined`.
 */
export const DEFENSIVE_STONE_KEYS = [
  'evadeBonus',
  'tempArmor',
  'spellResistanceBonus',
  'damageReductionBoostPct',
  'incomingSpecialReduction',
  'tempWard',
  'tempParryPool',
  'tempDamageNegation',
] as const;

export type DefensiveStoneSnapshot = Partial<Record<(typeof DEFENSIVE_STONE_KEYS)[number], number>>;

export function snapshotDefensiveStones(sb: object | null | undefined): DefensiveStoneSnapshot {
  const out: DefensiveStoneSnapshot = {};
  if (!sb) return out;
  const bag = sb as Record<string, unknown>;
  for (const key of DEFENSIVE_STONE_KEYS) {
    const n = Math.max(0, Math.floor(Number(bag[key]) || 0));
    if (n > 0) out[key] = n;
  }
  return out;
}

export function defensiveSnapshotPending(snap: DefensiveStoneSnapshot | null | undefined): boolean {
  return !!snap && DEFENSIVE_STONE_KEYS.some((key) => Math.floor(Number(snap[key]) || 0) > 0);
}

/** Subtract the snapshot taken at the previous spotlight end. Later purchases stay. */
export function applyDefensiveStoneExpiry<T extends object>(
  sb: T,
  snap: DefensiveStoneSnapshot | null | undefined,
): T {
  if (!snap) return sb;
  const bag = sb as unknown as Record<string, number>;
  const dropFrom = snap as unknown as Record<string, number>;
  for (const key of DEFENSIVE_STONE_KEYS) {
    const drop = Math.max(0, Math.floor(Number(dropFrom[key]) || 0));
    if (drop <= 0) continue;
    const cur = Math.max(0, Math.floor(Number(bag[key]) || 0));
    bag[key] = Math.max(0, cur - drop);
  }
  return sb;
}

export const STONE_POOL_ATTRIBUTE_KEYS = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
] as const;

/** NPC ATK total = explicit per-phase/root slots (falls back to APR sum). */
function npcAttackSlotsForEconomy(owner: any): number {
  if (!owner || owner.type !== 'npc') return 1;
  try {
    return resolveNpcAttackSlots(owner.system);
  } catch {
    try {
      return sumNpcAttackSlotsFromPowers(owner.system);
    } catch {
      return Math.max(1, Math.min(20, Math.floor(Number(owner.system?.attackSlots) || 1)));
    }
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

function reconcileNpcReactionActions(owner: any, state: RoundState): RoundState {
  if (!owner || (owner.type !== 'npc' && owner.type !== 'summon')) return state;
  const slots = npcReactionSlotsForEconomy(owner);
  const used = Math.min(Math.max(0, Math.floor(Number(state.reactionActions?.used) || 0)), slots);
  if (
    Math.floor(Number(state.reactionActions?.total) || 0) === slots &&
    Math.floor(Number(state.reactionActions?.used) || 0) === used
  ) {
    return state;
  }
  return {
    ...state,
    reactionActions: { total: slots, used },
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

/** Doubling costs reset each turn. Exchange Passive is retired. */
export function stonePowerCostPersistsForCombat(_abilityKey: string): boolean {
  return false;
}

function genericStoneUsageFlagKey(
  abilityKey: string,
  round: number,
  turn: number,
  combat?: Combat | null,
): string {
  if (stonePowerCostPersistsForCombat(abilityKey)) {
    const combatId = String(combat?.id ?? 'active');
    return `generic:${abilityKey}:combat:${combatId}`;
  }
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
  const usageKey = genericStoneUsageFlagKey(abilityKey, round, turn, combat);
  const stoneUsage = (owner as any).getFlag('mastery-system', 'stoneUsage') as
    | Record<string, number>
    | undefined;
  if (stoneUsage && Object.prototype.hasOwnProperty.call(stoneUsage, usageKey)) {
    return stoneUsage[usageKey] || 0;
  }
  if (stonePowerCostPersistsForCombat(abilityKey)) {
    return 0;
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
  const usageKey = genericStoneUsageFlagKey(abilityKey, round, turn, combat);
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

/**
 * Total stone-pool capacity for economy-actor selection.
 * Lifetime track (assignments) wins; only pre-respec actors use ⌊value/8⌋.
 */
function totalStoneCapacityFromAttributes(actor: Actor | null | undefined): number {
  let sys = (actor as any)?.system ?? {};
  if (!isLifetimeStoneMode(sys) && actor) {
    try {
      let baseId = String((actor as any).id ?? '');
      if ((actor as any).isToken) {
        baseId = String(
          (actor as any).token?.actorId ?? (actor as any).token?.document?.actorId ?? baseId,
        );
      }
      const world = baseId ? ((globalThis as any).game?.actors?.get?.(baseId) as Actor | undefined) : undefined;
      if (world && world !== actor) {
        sys = systemWithStoneProgression(sys, (world as any).system);
      }
    } catch {
      /* game optional */
    }
  }
  const attrs = sys.attributes ?? {};
  let sum = 0;
  for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
    const attrValue = Number(attrs?.[attr]?.value) || 0;
    sum += resolvedStonePoolMax(sys, attr, attrValue);
  }
  return sum;
}

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
export function highestExtraAttackGrant(sources: Array<number | null | undefined>): number {
  let best = 0;
  for (const raw of sources) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    if (n > best) best = n;
  }
  return best;
}

/** PC Attack Action total = 1 base + the highest extra-attack grant. */
export function syncPcExtraAttackTotal(state: RoundState): void {
  if (!state.isPC) return;
  const sb = state.stoneBonuses;
  const grant = highestExtraAttackGrant([
    sb?.extraAttacks,
    sb?.shopExtraAttack,
    sb?.bonusAttackActions,
  ]);
  const total = 1 + grant;
  const used = Math.max(0, Math.floor(Number(state.attackActions?.used) || 0));
  state.attackActions = { total, used: Math.min(used, total) };
}

function retireSpellActionAttacks(state: RoundState): void {
  const sb = state.stoneBonuses;
  if (!sb) return;
  const extra = Math.max(0, Math.floor(Number(sb.extraSpellActions) || 0));
  if (extra <= 0) return;
  const attack = state.attackActions ?? { total: 0, used: 0 };
  attack.total = Math.max(0, Math.floor(Number(attack.total) || 0) - extra);
  const used = Math.max(0, Math.floor(Number(attack.used) || 0));
  attack.used = Math.min(used, attack.total);
  state.attackActions = attack;
  sb.extraAttacks = Math.max(0, Math.floor(Number(sb.extraAttacks) || 0) - extra);
  sb.extraSpellActions = 0;
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
    retireSpellActionAttacks(stored);
    // NPC ATK label / spend budget must follow live Angriffe/Runde edits.
    return reconcileNpcReactionActions(owner, reconcileNpcAttackActions(owner, stored));
  }

  // Create default state
  const isPC = owner.type === 'character';
  const npcAttackSlots = owner.type === 'npc' ? npcAttackSlotsForEconomy(owner) : 1;
  const npcMoveSlots =
    owner.type === 'npc'
      ? Math.max(1, Math.min(10, Math.floor(Number(owner.system?.npcMovementSlots) || 1)))
      : 1;
  const npcReactSlots =
    owner.type === 'npc' || owner.type === 'summon' ? npcReactionSlotsForEconomy(owner) : 1;
  const baseActions = {
    movementActions: { total: npcMoveSlots, used: 0 },
    attackActions: { total: npcAttackSlots, used: 0 },
    reactionActions: { total: npcReactSlots, used: 0 }
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

/** Intellect Range & AoE Boost. Existing range, reach, or radius only — callers add this to a value they already have. */
export function getStoneAreaBonusMeters(
  actor: Actor | null | undefined,
  kind: 'range' | 'reach' | 'aoe',
): number {
  if (!actor) return 0;
  try {
    const rs = (actor as any).getFlag?.('mastery-system', 'roundState') as { stoneBonuses?: Record<string, number> } | null;
    const sb = rs?.stoneBonuses;
    if (!sb) return 0;
    const key = kind === 'reach' ? 'meleeReachBonusM' : kind === 'aoe' ? 'aoeRadiusBonusM' : 'rangeBonusM';
    return Math.max(0, Math.floor(Number(sb[key]) || 0));
  } catch {
    return 0;
  }
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

/** Free Raises left this Round (Intellect Stone Ability). */
export function freeRaisePool(actor: Actor | null | undefined): number {
  if (!actor) return 0;
  try {
    const combat = ((globalThis as any).game?.combat ?? null) as Combat | null;
    const rs = getRoundState(actor, combat);
    return Math.max(0, Math.floor(Number(rs?.stoneBonuses?.freeRaises) || 0));
  } catch {
    return 0;
  }
}

/** Spend declared Free Raises. They leave the pool whether the roll hits or misses. */
export async function consumeFreeRaises(actor: Actor | null | undefined, requested: number): Promise<number> {
  const want = Math.max(0, Math.floor(Number(requested) || 0));
  if (!actor || want <= 0) return 0;
  const combat = ((globalThis as any).game?.combat ?? null) as Combat | null;
  const rs = getRoundState(actor, combat);
  const have = Math.max(0, Math.floor(Number(rs?.stoneBonuses?.freeRaises) || 0));
  const spend = Math.min(have, want);
  if (spend <= 0 || !rs.stoneBonuses) return 0;
  rs.stoneBonuses.freeRaises = have - spend;
  await setRoundState(actor, rs);
  return spend;
}

/**
 * Whether this power item has already been used this round (combat powers only).
 */
/**
 * Power Use Limit identity (PG "Power Use Limit"): a Power's identity is its
 * base **Technical Reference** (template + chosen Special), not the item id.
 * Two embedded duplicates of the same template therefore share one use per
 * round. Falls back to the raw item id for non-template items.
 */
function powerUseIdentity(actor: Actor, powerItemId: string): string {
  try {
    const item = (actor as any).items?.get?.(powerItemId);
    if (item) {
      const key = powerIdentityKeyFromItem(item as any);
      if (key) return key;
    }
  } catch {
    /* fall back to raw id */
  }
  return powerItemId;
}

export function hasPowerBeenUsedThisRound(
  actor: Actor,
  combat: Combat | null,
  powerItemId: string
): boolean {
  const rs = getRoundState(actor, combat);
  const used = rs.usedPowerIdsThisRound ?? [];
  // Raw ids from older round states still match directly.
  return used.includes(powerUseIdentity(actor, powerItemId)) || used.includes(powerItemId);
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
  const identity = powerUseIdentity(actor, powerItemId);
  const rs = getRoundState(actor, combat);
  const arr = rs.usedPowerIdsThisRound ?? [];
  if (arr.includes(identity)) return;
  rs.usedPowerIdsThisRound = [...arr, identity];
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
  const identity = powerUseIdentity(actor, powerItemId);
  const rs = getRoundState(actor, combat);
  const arr = rs.usedPowerIdsThisRound ?? [];
  if (!arr.length) return;
  rs.usedPowerIdsThisRound = arr.filter((id) => id !== identity && id !== powerItemId);
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

  // Initiative Shop is one Attack Action source. It does not add on top of Extra Attack.
  if (shopData.extraAttack) {
    if (!roundState.stoneBonuses) {
      roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
    }
    roundState.stoneBonuses.shopExtraAttack = 1;
    syncPcExtraAttackTotal(roundState);
  }

  if (shopData.extraReaction) {
    roundState.reactionActions.total += 1;
  }

  // Apply extra movement (adds to distance bonus, not action count)
  if (shopData.extraMovement > 0) {
    roundState.moveBonusMeters += shopData.extraMovement * 2; // Each purchase = +2m
  }

  // Mechanical Stress retired — initiative shop "remove stress" is ignored.

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
  if (isFleeLocked(actor, combat)) {
    ui.notifications?.warn('Flee: you cannot make Attacks until the start of your next Turn.');
    return false;
  }
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
export async function spendMovementPowerAction(
  actor: Actor,
  combat: Combat | null,
  templateId?: string,
): Promise<boolean> {
  const roundState = getRoundState(actor, combat);
  const id = String(templateId || '').trim();
  const used = roundState.usedMovementPowerIds ?? [];
  if (id && used.includes(id)) {
    ui.notifications?.warn('That Movement Power was already used this round.');
    return false;
  }
  if (roundState.movementActions.used >= roundState.movementActions.total) {
    ui.notifications?.warn('No movement actions remaining!');
    return false;
  }

  roundState.movementActions.used += 1;
  if (id) roundState.usedMovementPowerIds = [...used, id];
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
export async function spendReactionAction(
  actor: Actor,
  combat: Combat | null,
  context?: { reactionId?: string; triggerId?: string },
): Promise<boolean> {
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

  // Stunned: no Reactions until the start of your next turn (Players Guide).
  if (getStunnedRank(getActionEconomyActor(actor) ?? actor) > 0) {
    ui.notifications?.warn('Stunned — you cannot use Reactions until the start of your next turn.');
    return false;
  }

  if (roundState.reactionActions.used >= roundState.reactionActions.total) {
    ui.notifications?.warn('No reaction actions remaining!');
    return false;
  }

  try {
    const { denyReactionIfMarked } = await import('../stones/stone-combat-effects.js');
    const denial = await denyReactionIfMarked(actor, context);
    if (denial.denied) {
      ui.notifications?.warn(denial.reason || 'Reaction denied.');
      return false;
    }
  } catch (err) {
    console.warn('Mastery System | Reaction Denial check failed', err);
  }
  
  roundState.reactionActions.used += 1;
  await setRoundState(actor, roundState);
  await maybeLockStonePowersAfterCombatAction(actor, combat);
  try {
    const { breakOrdinaryStealth } = await import('./perception-combat-hooks.js');
    await breakOrdinaryStealth(actor, 'reaction');
  } catch {
    /* best-effort */
  }
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

/** Remaining Active Buff activations this round: always 1 or 0. */
export function remainingActiveBuffActions(
  usedThisRound: boolean | undefined,
  attackActionsAvailable: number,
): number {
  if (usedThisRound) return 0;
  if (attackActionsAvailable <= 0) return 0;
  return 1;
}

export function getAvailableActiveBuffActions(actor: Actor, combat: Combat | null): number {
  const roundState = getRoundState(actor, combat);
  return remainingActiveBuffActions(
    roundState.activeBuffUsedThisRound,
    getAvailableAttackActions(actor, combat),
  );
}

export async function markActiveBuffUsedThisRound(actor: Actor, combat: Combat | null): Promise<void> {
  const roundState = getRoundState(actor, combat);
  if (roundState.activeBuffUsedThisRound) return;
  roundState.activeBuffUsedThisRound = true;
  await setRoundState(actor, roundState);
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
    const slots = npcReactionSlotsForEconomy(actor);
    if (slots <= 0) return 0;
    const rs = getRoundState(summonCtx.owner, combat);
    const used = Math.max(0, Math.floor(Number((rs as any).summonBondUsage?.[summonCtx.bondId]?.reactionsUsed) || 0));
    return Math.max(0, slots - used);
  }
  // Stunned: no Reactions until the start of your next turn.
  if (getStunnedRank(getActionEconomyActor(actor) ?? actor) > 0) return 0;
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

/**
 * Refund one reaction action if any were spent this round.
 */
export async function refundReactionAction(actor: Actor, combat: Combat | null): Promise<void> {
  const roundState = getRoundState(actor, combat);
  if (roundState.reactionActions.used <= 0) return;
  roundState.reactionActions.used -= 1;
  await setRoundState(actor, roundState);
}

export type CombatActionRefundKind = 'attack' | 'movement' | 'reaction';

/**
 * GM recovery: refund one spent combat action of the given kind this round.
 * Returns false when nothing was spent (nothing to give back).
 */
export async function gmRefundCombatAction(
  actor: Actor,
  combat: Combat | null,
  kind: CombatActionRefundKind,
): Promise<boolean> {
  const economyActor = getActionEconomyActor(actor) ?? actor;
  const rs = getRoundState(economyActor, combat);
  if (kind === 'attack') {
    if (rs.attackActions.used <= 0) return false;
    await refundAttackAction(economyActor, combat);
    return true;
  }
  if (kind === 'movement') {
    if (rs.movementActions.used <= 0) return false;
    await refundMovementAction(economyActor, combat);
    return true;
  }
  if (rs.reactionActions.used <= 0) return false;
  await refundReactionAction(economyActor, combat);
  return true;
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
 * Additional Stone cost of the next Normal Ability Rank: 1, 2, 4, 8.
 * Rank 4 is the last Rank. Prefer `stonePowerRankCost` (Premium Abilities use 2 / 4 / 6 / 8).
 */
export function calculateStoneCost(usesThisTurn: number): number {
  const uses = Math.max(0, Math.floor(Number(usesThisTurn) || 0));
  if (uses >= 4) return 0;
  return Math.pow(2, uses);
}

/**
 * Get stone pool for an attribute
 */
export function getStonePool(actor: Actor, attribute: AttributeKey): { current: number; max: number } {
  const owner = getActionEconomyActor(actor) ?? actor;
  const system = (owner.system as any);
  const pool = system.stonePools?.[attribute];
  const max = Math.max(0, Math.floor(Number(pool?.max) || 0));
  let current = Math.max(0, Math.floor(Number(pool?.current) || 0));
  try {
    const fromLedger = combatReadyRemaining(owner, attribute);
    if (fromLedger != null) current = fromLedger;
    else current = minLivePoolCurrent(owner, attribute);
  } catch {
    /* game / canvas optional in unit tests */
  }
  return { current, max };
}

/**
 * Stones in a pool that must NOT come back through regen / refills:
 * Sustain, Sealed (Rituals / Remove Scar — return on Safe Haven Rest) and
 * Burned (lost until Safe Haven Rest, e.g. Last Breath).
 */
export function stonePoolReservedStones(system: any, attr: string): number {
  const p = system?.stonePools?.[attr] ?? {};
  const n = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));
  return n(p.sustained) + n(p.sealed) + n(p.burned);
}

/**
 * Persist max/current from floor(attribute/8) minus sustained — full pool for round-1 stone assignment.
 * Pass the **combatant's** actor (token document for unlinked PCs) so data matches Stone Powers UI.
 */
export async function refillStonePoolsFromAttributes(
  actor: Actor,
  opts: { force?: boolean } = {},
): Promise<void> {
  if (!isPC(actor)) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  if (!isPC(owner)) return;
  // A per-character combat ledger already exists for this encounter → stones
  // were handed out (and possibly spent) earlier in this fight. Re-running a
  // "fresh" refill (combatStart hook, setup resume, round-1 prompt, …) must
  // NOT resurrect spent stones. Only the explicit encounter start forces it.
  if (!opts.force) {
    try {
      const combat = typeof game !== 'undefined' ? game.combat : null;
      const { hasStoneCombatReady, ensureStoneCombatReady } = await import(
        '../stones/stone-combat-ledger.js'
      );
      if (combat?.id && hasStoneCombatReady(owner, combat)) {
        await ensureStoneCombatReady(owner, combat);
        return;
      }
    } catch {
      /* optional */
    }
  }
  const sys = (owner.system as any);
  let stoneSys = sys;
  try {
    const { resolveActorStoneSystem } = await import('../stones/stone-pool-sync.js');
    stoneSys = resolveActorStoneSystem(owner);
  } catch {
    /* optional */
  }
  const updates: Record<string, number> = {};
  const readyPools: Record<string, number> = {};
  for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
    const attrValue = Number(sys.attributes?.[attr]?.value ?? 0);
    const maxStones = resolvedStonePoolMax(stoneSys, attr, attrValue);
    const reserved = stonePoolReservedStones(sys, attr);
    const effectiveMax = Math.max(0, maxStones - reserved);
    readyPools[attr] = effectiveMax;
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
  try {
    const combat = game.combat;
    // Seal the ledger for the whole encounter — prepare phase included — so
    // every spend from here on is recorded per character.
    if (combat?.id) {
      const colorless = sys?.stonePools?.colorless;
      if (colorless && typeof colorless === 'object') {
        const max = Math.max(0, Math.floor(Number(colorless.max) || 0));
        const reserved = stonePoolReservedStones(sys, 'colorless');
        readyPools.colorless = Math.max(0, max - reserved);
      }
      const { resealStoneCombatReadyFromPools } = await import('../stones/stone-combat-ledger.js');
      await resealStoneCombatReadyFromPools(owner, combat, readyPools);
    }
  } catch {
    /* optional */
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
  let stoneSys = sys;
  try {
    const { resolveActorStoneSystem } = await import('../stones/stone-pool-sync.js');
    stoneSys = resolveActorStoneSystem(owner);
  } catch {
    /* optional */
  }
  const combat = typeof game !== 'undefined' ? game.combat : null;
  const updates: Record<string, number> = {};
  for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
    const attrValue = Number(sys.attributes?.[attr]?.value ?? 0);
    const maxStones = resolvedStonePoolMax(stoneSys, attr, attrValue);
    const reserved = stonePoolReservedStones(sys, attr);
    const effectiveMax = Math.max(0, maxStones - reserved);
    const curMax = Number(sys.stonePools?.[attr]?.max ?? -1);
    // Prefer combat ledger / MIN across copies — never trust a single full sibling.
    const liveCurrent =
      combatReadyRemaining(owner, attr) ?? minLivePoolCurrent(owner, attr);
    const newCurrent = Math.min(liveCurrent, effectiveMax);
    const storedCurrent = Math.max(0, Number(sys.stonePools?.[attr]?.current ?? 0));
    if (curMax !== maxStones || storedCurrent !== newCurrent) {
      updates[`system.stonePools.${attr}.max`] = maxStones;
      updates[`system.stonePools.${attr}.current`] = newCurrent;
    }
  }
  if (Object.keys(updates).length > 0) {
    await owner.update(updates);
  }
  // Crush stale full copies + keep the per-character Ready ledger authoritative.
  if (combat?.id) {
    try {
      const { ensureStoneCombatReady } = await import('../stones/stone-combat-ledger.js');
      await ensureStoneCombatReady(owner, combat);
    } catch {
      /* optional */
    }
  }
}
/**
 * Set stone pool current value. In combat this also updates the per-character
 * Ready ledger and mirrors onto every world/token copy so Round 2 cannot
 * resurrect a stale full pool.
 */
export async function setStonePool(
  actor: Actor,
  attribute: AttributeKey,
  current: number
): Promise<void> {
  const next = Math.max(0, Math.floor(Number(current) || 0));
  try {
    const combat = game.combat;
    // Prepare phase (round 0) counts: Round-1 stones are bought there.
    if (combat?.id) {
      const { setCombatPoolCurrent } = await import('../stones/stone-combat-ledger.js');
      await setCombatPoolCurrent(actor, attribute, next, combat);
      return;
    }
  } catch {
    /* fall through to single-doc write */
  }
  const owner = getActionEconomyActor(actor) ?? actor;
  await owner.update({
    [`system.stonePools.${attribute}.current`]: next,
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
  // Callers pass the Rank cost (Normal 1/2/4/8, Premium 2/4/6/8); an explicit
  // 0 is legal — the Support-prefilled Rank costs no Stones.
  const cost =
    expectedCost !== undefined && Number.isFinite(expectedCost) && expectedCost >= 0
      ? Math.floor(expectedCost)
      : calculateStoneCost(uses);
  
  // Get stone pool
  const pool = getStonePool(actor, attribute);
  
  if (String(abilityKey || '') === 'vitality.removeScar') {
    // Remove Scar Seals — never Exhaust. Exhausted stones come back via round
    // Recovery; Sealed stones stay out until Safe Haven Rest.
    const { payAndApplyRemoveScar } = await import('../stones/remove-scar.js');
    const { getArtifactStoneSupportPrefill } = await import('../utils/artifact-stone-functions.js');
    return payAndApplyRemoveScar(actor, {
      colorlessSpent,
      supportPrefillTier: getArtifactStoneSupportPrefill(actor, 'vitality.removeScar', 'vitality'),
    });
  }
  try {
    const { stonePowerAllowsColorless, stonePowerColorlessRejectMessage } = await import(
      '../stones/stone-payment-rules.js'
    );
    if (!stonePowerAllowsColorless(abilityKey) && colorlessSpent > 0) {
      ui.notifications?.warn(stonePowerColorlessRejectMessage(abilityKey));
      return false;
    }
  } catch {
    /* payment-rules unavailable */
  }

  const colorlessWanted = Math.max(0, Math.floor(Number(colorlessSpent) || 0));
  let colorlessUsed = 0;
  try {
    const { getSpendableColorlessStones } = await import('../stones/colorless-stones.js');
    colorlessUsed = Math.min(colorlessWanted, getSpendableColorlessStones(actor));
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
      const { spendColorlessStones } = await import('../stones/colorless-stones.js');
      await spendColorlessStones(actor, colorlessUsed);
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
  // Callers pass the Rank cost (an explicit 0 = Support-prefilled Rank);
  // fall back to the Normal cost curve otherwise.
  const cost =
    expectedCost !== undefined && Number.isFinite(expectedCost) && expectedCost >= 0
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
    const { getSpendableColorlessStones } = await import('../stones/colorless-stones.js');
    const have = getSpendableColorlessStones(actor);
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
      const { spendColorlessStones } = await import('../stones/colorless-stones.js');
      await spendColorlessStones(actor, colorlessN);
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
  const masteryRank = getRulesMasteryRank(owner);
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
      const reserved = stonePoolReservedStones(system, attr);
      const effectiveMax = Math.max(0, pool.max - reserved);
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
 * Apply a player-chosen regen allocation. Attribute Stones and designated
 * Colorless Stones share one limit when `recoveryLimit` is set (Mastery Rank).
 * Colorless Stones regenerate only by id, and only when Colorless Recovery
 * designated that Stone. The designation itself is not consumed.
 */
export async function applyStoneRegenAllocation(
  actor: Actor,
  allocation: Partial<Record<AttributeKey | 'colorless', number>> & {
    colorlessIds?: string[];
    recoveryLimit?: number;
  },
): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const system = (owner.system as any);
  const combat = game.combat;
  const { setCombatPoolCurrent, combatReadyRemaining, minLivePoolCurrent } = await import(
    '../stones/stone-combat-ledger.js'
  );
  const keys: AttributeKey[] = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
  ];
  const colorlessIds = allocation.colorlessIds ?? [];
  const limit = allocation.recoveryLimit;
  let room = limit == null ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(Number(limit) || 0));
  let spentAttributes = 0;
  for (const attr of keys) {
    const add = Math.max(0, Math.floor(Number(allocation[attr]) || 0));
    if (!add || room <= 0) continue;
    const take = Math.min(add, room);
    const pool = getStonePool(owner, attr);
    const reserved = stonePoolReservedStones(system, attr);
    const cap = Math.max(0, pool.max - reserved);
    const before =
      combatReadyRemaining(owner, attr) ?? minLivePoolCurrent(owner, attr);
    const next = Math.min(cap, before + take);
    const gained = Math.max(0, next - before);
    if (gained > 0) {
      await setCombatPoolCurrent(owner, attr, next, combat);
      room -= gained;
      spentAttributes += gained;
    }
  }
  void spentAttributes;

  if (room > 0 && colorlessIds.length) {
    const { restoreDesignatedColorlessStones } = await import('../stones/colorless-recovery.js');
    const restored = await restoreDesignatedColorlessStones(owner, colorlessIds.slice(0, room));
    room -= restored.length;
  }
}

/**
 * Round advance no longer auto-fills pools. Players pick which stones come back
 * in the Stone Recovery step of the Stone Powers dialog.
 */
export async function regenStonesEndOfRound(_combat: Combat): Promise<void> {
  /* interactive recovery runs in the Stone Powers dialog */
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

    // Capacity is the assigned permanent Stone count (v0.9.9) or the legacy
    // attribute threshold until that character finishes respec.
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
      const pool = getStonePool(owner, attr);
      const reserved = stonePoolReservedStones(system, attr);
      const attrValue = Number(system.attributes?.[attr]?.value ?? 0);
      const maxStones = resolvedStonePoolMax(system, attr, attrValue);
      const fullCurrent = Math.max(0, maxStones - reserved);

      if (pool.current !== fullCurrent || pool.max !== maxStones) {
        updates[`system.stonePools.${attr}.max`] = maxStones;
        updates[`system.stonePools.${attr}.current`] = fullCurrent;
      }
    }

    // Permanent Colorless Stones return to Ready after combat (Initiative
    // Colorless Stones disappear instead — combat cleanup drops them).
    const colorlessPool = system?.stonePools?.colorless;
    if (colorlessPool && typeof colorlessPool === 'object') {
      const max = Math.max(0, Math.floor(Number(colorlessPool.max) || 0));
      const sustained = Math.max(0, Math.floor(Number(colorlessPool.sustained) || 0));
      const sealed = Math.max(0, Math.floor(Number(colorlessPool.sealed) || 0));
      const full = Math.max(0, max - sustained - sealed);
      if ((Number(colorlessPool.current) || 0) !== full) {
        updates['system.stonePools.colorless.current'] = full;
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
    try {
      const { clearStoneCombatReady } = await import('../stones/stone-combat-ledger.js');
      await clearStoneCombatReady(owner);
    } catch {
      /* ignore */
    }
    try {
      const { clearColorlessRecovery } = await import('../stones/colorless-recovery.js');
      await clearColorlessRecovery(owner);
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
    let preparedForThisCombat =
      !!stored &&
      String(stored.combatId ?? '') === combatId &&
      Math.max(1, Math.floor(Number(stored.round) || 1)) <= 1;
    // A stone ledger for this encounter is the authoritative "already prepared"
    // marker — spends whose powers never touch roundState still count.
    if (!preparedForThisCombat) {
      try {
        const { hasStoneCombatReady } = await import('../stones/stone-combat-ledger.js');
        if (hasStoneCombatReady(flagOwner, combat as any)) preparedForThisCombat = true;
      } catch {
        /* optional */
      }
    }
    if (preparedForThisCombat) continue;

    // No prepare-phase spend for this combat — fill pools so a cold start
    // does not inherit leftover 0s as "spent this round".
    try {
      await refillStonePoolsFromAttributes(flagOwner);
    } catch (err) {
      console.warn('Mastery System | Round-1 stone refill at combat start failed', err);
    }

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

  // Reset used counts. Reactions are a per-ROUND budget (Players Guide
  // "Basic Action Kit": 1 Reaction per Round) — they refresh in
  // `resetRoundState`, NOT at the start of your turn. Resetting here would
  // grant a second Reaction to anyone who reacted before their turn.
  roundState.movementActions.used = 0;
  roundState.attackActions.used = 0;
  // Basic maneuver turn locks expire at the start of your next Turn.
  roundState.baseAttackLocked = false;
  roundState.safeMovementThisTurn = false;
  roundState.movementPowerUsedThisRound = false;
  roundState.fleeLock = false;
  roundState.fleeCommitted = false;
  try {
    await (owner as any).unsetFlag?.('mastery-system', 'pendingSlip');
    await (owner as any).unsetFlag?.('mastery-system', 'slipMovementActive');
    await (owner as any).unsetFlag?.('mastery-system', 'pendingSafeMovement');
  } catch {
    /* slip / safe movement are turn-scoped */
  }
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
 * Clear offensive / casting "this turn" stone bonuses when the spotlight ends.
 * Defensive stones that last until the start of the next own turn
 * (Parry, Armor, Evade, Damage Negation, Damage Reduction, Spell Resistance,
 * Special Negation / Ward) are preserved here and armed via
 * `armDefensiveStoneExpiry` for removal in `releaseDefensiveStoneExpiry`.
 */
export async function clearCombatStoneTurnBonusesForActor(actor: Actor, combat: Combat | null): Promise<void> {
  if (!combat) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  const roundState = getRoundState(actor, combat);
  if (!roundState.stoneBonuses) return;
  const sb = roundState.stoneBonuses;
  const changed =
    (sb.damageBonus ?? 0) !== 0 ||
    (sb.meleeDamageBonusDice ?? 0) !== 0 ||
    (sb.spellPoolDice ?? 0) !== 0 ||
    (sb.spellKeepDice ?? 0) !== 0 ||
    (sb.ignoreWoundPenalties ?? 0) !== 0 ||
    (sb.spellAutoRaises ?? 0) !== 0 ||
    (sb.spellRaiseTnBonus ?? 0) !== 0 ||
    (sb.spellPenetration ?? 0) !== 0 ||
    (sb.phasingChargesFromStones ?? 0) !== 0 ||
    (sb.tempHpGrantedThisTurn ?? 0) !== 0;
  if (!changed) return;
  // Vitality Temporary HP lasts until depleted or combat ends — do not strip
  // the HP pool when the actor's spotlight ends. Combat-end cleanup still zeroes it.
  // Defensive keys below are copied through unchanged.
  const defensive = snapshotDefensiveStones(sb);
  roundState.stoneBonuses = {
    extraAttacks: sb.extraAttacks ?? 0,
    extraReactions: sb.extraReactions ?? 0,
    extraMoveMeters: sb.extraMoveMeters ?? 0,
    armorPenetration: sb.armorPenetration ?? 0,
    meleeIgnoreArmor: sb.meleeIgnoreArmor ?? 0,
    freeRaises: sb.freeRaises ?? 0,
    critRaises: sb.critRaises ?? 0,
    specialBoost: sb.specialBoost ?? 0,
    spellSpecialBoost: sb.spellSpecialBoost ?? 0,
    invisibilityBonus: sb.invisibilityBonus ?? 0,
    rangeBonusM: sb.rangeBonusM ?? 0,
    meleeReachBonusM: sb.meleeReachBonusM ?? 0,
    aoeRadiusBonusM: sb.aoeRadiusBonusM ?? 0,
    enemyEvadeReduction: sb.enemyEvadeReduction ?? 0,
    extendActiveBuffRounds: sb.extendActiveBuffRounds ?? 0,
    activeBuffPlBonus: sb.activeBuffPlBonus ?? 0,
    evadeBonus: defensive.evadeBonus ?? 0,
    damageBonus: 0,
    meleeDamageBonusDice: 0,
    tempArmor: defensive.tempArmor ?? 0,
    spellPoolDice: 0,
    spellKeepDice: 0,
    tempHpGrantedThisTurn: 0,
    ignoreWoundPenalties: 0,
    secondChanceFreeBoxes: sb.secondChanceFreeBoxes ?? 0,
    spellAutoRaises: 0,
    spellRaiseTnBonus: 0,
    spellPenetration: 0,
    spellResistanceBonus: defensive.spellResistanceBonus ?? 0,
    extraSpellActions: sb.extraSpellActions ?? 0,
    damageReductionBoostPct: defensive.damageReductionBoostPct ?? 0,
    incomingSpecialReduction: defensive.incomingSpecialReduction ?? 0,
    tempWard: defensive.tempWard ?? 0,
    tempParryPool: defensive.tempParryPool ?? 0,
    tempDamageNegation: defensive.tempDamageNegation ?? 0,
    phasingChargesFromStones: 0,
    initiativeBonus: sb.initiativeBonus ?? 0,
    reactionRangeBonus: sb.reactionRangeBonus ?? 0,
    extraPassives: sb.extraPassives ?? 0,
    defensiveExpiry: sb.defensiveExpiry ?? null,
  };
  await setRoundState(owner as Actor, roundState);
}

/** Remember defensive stones when this actor's spotlight ends. Do not remove them yet. */
export async function armDefensiveStoneExpiry(actor: Actor, combat: Combat | null): Promise<void> {
  if (!combat) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  const roundState = getRoundState(owner as Actor, combat);
  const sb = roundState.stoneBonuses;
  if (!sb || defensiveSnapshotPending(sb.defensiveExpiry)) return;
  const snap = snapshotDefensiveStones(sb);
  if (!defensiveSnapshotPending(snap)) return;
  sb.defensiveExpiry = snap;
  await setRoundState(owner as Actor, roundState);
}

/** At the start of this actor's next turn, drop the stones snapshotted last spotlight. */
export async function releaseDefensiveStoneExpiry(actor: Actor, combat: Combat | null): Promise<void> {
  if (!combat) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  const roundState = getRoundState(owner as Actor, combat);
  const sb = roundState.stoneBonuses;
  if (!sb || !defensiveSnapshotPending(sb.defensiveExpiry)) return;
  applyDefensiveStoneExpiry(sb, sb.defensiveExpiry);
  sb.defensiveExpiry = null;
  await setRoundState(owner as Actor, roundState);
}

/**
 * Reset round state (called on round change)
 * Clears bonuses and re-applies initiative shop for new round
 */
export async function resetRoundState(actor: Actor, combatant: Combatant, combat: Combat): Promise<void> {
  const previous = (actor as any).getFlag?.('mastery-system', 'roundState') as RoundState | undefined;
  const keepFlee =
    previous?.fleeLock === true && String(previous.combatId ?? '') === String((combat as any)?.id ?? '');
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
    reactionActions: { total: isPC ? 1 : npcReactionSlotsForEconomy(actor), used: 0 },
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
  const storedSb = ((actor as any).getFlag?.('mastery-system', 'roundState') as RoundState | undefined)?.stoneBonuses;
  if (storedSb && roundState.stoneBonuses) {
    for (const key of DEFENSIVE_STONE_KEYS) {
      (roundState.stoneBonuses as DefensiveStoneSnapshot)[key] = Math.max(0, Math.floor(Number(storedSb[key]) || 0));
    }
    roundState.stoneBonuses.defensiveExpiry = storedSb.defensiveExpiry ?? null;
  }
  if (keepFlee) {
    roundState.fleeLock = true;
    roundState.fleeCommitted = true;
  }

  await setRoundState(actor, roundState);
}
