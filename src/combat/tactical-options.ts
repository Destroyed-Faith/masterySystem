/**
 * Playtest tactical options (Core 2026-11-19):
 * - All-Out Attack (Prep declaration)
 * - Regular Attack Action Transfer (Prep grant → recipient spends on their Turn)
 * - Shared Intellect Free Raises helpers (range / perception)
 * Two-actor writes live in `teamwork-transactions.ts`.
 *
 * Provisional playtest: 20 m coordination range; All-Out Armor floor 0.
 */

import {
  getActionEconomyActor,
  getAvailableAttackActions,
  getRoundState,
  setRoundState,
  type RoundState,
} from './action-economy.js';

/** Provisional playtest coordination range (meters). */
export const TACTICAL_COORDINATION_RANGE_M = 20;

/** Armor lost per All-Out Armor step; a step needs at least this much Armor left. */
export const ALL_OUT_ARMOR_STEP = 4;
/** Evade lost per All-Out Evade step; a step needs at least this much Evade left. */
export const ALL_OUT_EVADE_STEP = 2;
/** @deprecated Use ALL_OUT_ARMOR_STEP. */
export const ALL_OUT_ARMOR_MIN = ALL_OUT_ARMOR_STEP;

export type AllOutDefensePenalty = 'armor' | 'evade';

export type AllOutAttackState = {
  active: true;
  armorSteps: number;
  evadeSteps: number;
};

function stepCount(v: unknown): number {
  return Math.max(0, Math.floor(Number(v) || 0));
}

export type AttackActionTransferState = {
  /** Donor actor id (owner of the surrendered base Action). */
  fromActorId: string;
  /** Recipient actor id. */
  toActorId: string;
  /** Prep grant recorded; recipient spends on their own Turn. */
  status: 'granted' | 'spent' | 'expired';
};

/** All-Out steps for the Round. A stored single declaration (`penalty`) reads as one step. */
export function readAllOutAttack(rs: RoundState | null | undefined): AllOutAttackState | null {
  const raw = (rs as any)?.allOutAttack;
  if (!raw || raw.active !== true) return null;
  let armorSteps = stepCount(raw.armorSteps);
  let evadeSteps = stepCount(raw.evadeSteps);
  if (raw.armorSteps === undefined && raw.evadeSteps === undefined) {
    if (raw.penalty === 'evade') evadeSteps = 1;
    else armorSteps = 1;
  }
  if (armorSteps + evadeSteps <= 0) return null;
  return { active: true, armorSteps, evadeSteps };
}

/** One +1d8 per declared step. */
export function allOutDamageBonusDice(rs: RoundState | null | undefined): number {
  const ao = readAllOutAttack(rs);
  return ao ? ao.armorSteps + ao.evadeSteps : 0;
}

/**
 * All-Out dice for one Damage Roll. An explicit count from the damage card or a
 * reroll (including 0 for Special-only or Negation-stripped dice) wins; only a
 * missing count falls back to the live Round declaration.
 */
export function resolveAllOutDamageDice(
  explicit: unknown,
  specialOnly: boolean,
  liveRs: RoundState | null | undefined,
): number {
  if (specialOnly) return 0;
  if (explicit !== undefined) return Math.max(0, Math.floor(Number(explicit) || 0));
  return allOutDamageBonusDice(liveRs);
}

/** Effective Armor after All-Out −4 per Armor step (floor 0). */
export function applyAllOutArmorPenalty(armor: number, rs: RoundState | null | undefined): number {
  const steps = readAllOutAttack(rs)?.armorSteps ?? 0;
  return Math.max(0, Math.floor(Number(armor) || 0) - ALL_OUT_ARMOR_STEP * steps);
}

/** Effective Evade after All-Out −2 per Evade step (floor 0). */
export function applyAllOutEvadePenalty(evade: number, rs: RoundState | null | undefined): number {
  const steps = readAllOutAttack(rs)?.evadeSteps ?? 0;
  return Math.max(0, Math.floor(Number(evade) || 0) - ALL_OUT_EVADE_STEP * steps);
}

/**
 * Round state of the actor's economy owner, only when it belongs to the live
 * combat Round. A stale flag from an earlier Round or encounter returns null so
 * an expired All-Out drawback never lowers defenses.
 */
export function currentCombatRoundState(actor: any): RoundState | null {
  if (!actor) return null;
  const combat = (globalThis as any).game?.combat ?? null;
  if (!combat) return null;
  const owner = (getActionEconomyActor(actor) ?? actor) as any;
  let rs: RoundState | null | undefined;
  try {
    rs = owner?.getFlag?.('mastery-system', 'roundState');
  } catch {
    return null;
  }
  if (!rs) return null;
  const round = Math.max(1, Math.floor(Number(combat.round ?? 1) || 1));
  if (rs.round !== round || String(rs.combatId ?? '') !== String(combat.id ?? '')) return null;
  return rs;
}

export type AllOutDefenseView = {
  armorSteps: number;
  evadeSteps: number;
  /** Defense before any All-Out step. */
  armorBase: number;
  evadeBase: number;
  /** Defense after the declared steps. */
  armorNow: number;
  evadeNow: number;
  canAddArmor: boolean;
  canAddEvade: boolean;
  damageDice: number;
};

/**
 * The declaring character's own defenses, read from the same economy owner
 * whose Round state later lowers them when that character is hit.
 */
export async function allOutDefenseView(actor: any, rs: RoundState | null | undefined): Promise<AllOutDefenseView> {
  const { getTargetArmorBeforeAllOut, getTargetEvadeBeforeAllOut } = await import('./target-defenses.js');
  const owner = getActionEconomyActor(actor) ?? actor;
  const ao = readAllOutAttack(rs);
  const armorSteps = ao?.armorSteps ?? 0;
  const evadeSteps = ao?.evadeSteps ?? 0;
  const armorBase = getTargetArmorBeforeAllOut(owner);
  const evadeBase = getTargetEvadeBeforeAllOut(owner);
  const armorNow = applyAllOutArmorPenalty(armorBase, rs);
  const evadeNow = applyAllOutEvadePenalty(evadeBase, rs);
  return {
    armorSteps,
    evadeSteps,
    armorBase,
    evadeBase,
    armorNow,
    evadeNow,
    canAddArmor: armorBase - ALL_OUT_ARMOR_STEP * armorSteps >= ALL_OUT_ARMOR_STEP,
    canAddEvade: evadeBase - ALL_OUT_EVADE_STEP * evadeSteps >= ALL_OUT_EVADE_STEP,
    damageDice: armorSteps + evadeSteps,
  };
}

export type AllOutDeclareResult =
  | { ok: true; state: RoundState }
  | { ok: false; reason: 'armor-below-minimum'; effectiveArmor: number }
  | { ok: false; reason: 'evade-below-minimum'; effectiveEvade: number };

/** Add one All-Out step (−4 Armor or −2 Evade, +1d8 Damage) for this Round. */
export async function declareAllOutAttack(
  actor: any,
  combat: Combat | null,
  penalty: AllOutDefensePenalty,
): Promise<AllOutDeclareResult> {
  const choice: AllOutDefensePenalty = penalty === 'evade' ? 'evade' : 'armor';
  const rs = getRoundState(actor, combat);
  const view = await allOutDefenseView(actor, rs);
  if (choice === 'armor' && !view.canAddArmor) {
    return { ok: false, reason: 'armor-below-minimum', effectiveArmor: view.armorNow };
  }
  if (choice === 'evade' && !view.canAddEvade) {
    return { ok: false, reason: 'evade-below-minimum', effectiveEvade: view.evadeNow };
  }
  rs.allOutAttack = {
    active: true,
    armorSteps: view.armorSteps + (choice === 'armor' ? 1 : 0),
    evadeSteps: view.evadeSteps + (choice === 'evade' ? 1 : 0),
  };
  await setRoundState(actor, rs);
  return { ok: true, state: rs };
}

/** Clear the All-Out steps of one defense, or all of them. */
export async function clearAllOutAttack(
  actor: any,
  combat: Combat | null,
  which: AllOutDefensePenalty | 'all' = 'all',
): Promise<void> {
  const rs = getRoundState(actor, combat);
  const ao = readAllOutAttack(rs);
  if (!(rs as any).allOutAttack) return;
  const armorSteps = which === 'armor' || which === 'all' ? 0 : (ao?.armorSteps ?? 0);
  const evadeSteps = which === 'evade' || which === 'all' ? 0 : (ao?.evadeSteps ?? 0);
  if (armorSteps + evadeSteps > 0) rs.allOutAttack = { active: true, armorSteps, evadeSteps };
  else delete (rs as any).allOutAttack;
  await setRoundState(actor, rs);
}

function tokenCenter(token: any): { x: number; y: number } | null {
  const doc = token?.document ?? token;
  if (!doc) return null;
  const x = Number(doc.x ?? token.x);
  const y = Number(doc.y ?? token.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const w = Number(doc.width ?? token.width ?? 1) || 1;
  const h = Number(doc.height ?? token.height ?? 1) || 1;
  const grid = Number((globalThis as any).canvas?.grid?.size ?? 100) || 100;
  return { x: x + (w * grid) / 2, y: y + (h * grid) / 2 };
}

/** Distance in meters between two placed tokens (grid-aware when possible). */
export function tokenDistanceMeters(a: any, b: any): number | null {
  if (!a || !b) return null;
  try {
    const dist = (globalThis as any).canvas?.grid?.measureDistance?.(a, b);
    if (typeof dist === 'number' && Number.isFinite(dist)) return dist;
  } catch {
    /* fall through */
  }
  const ca = tokenCenter(a);
  const cb = tokenCenter(b);
  if (!ca || !cb) return null;
  const grid = Number((globalThis as any).canvas?.grid?.size ?? 100) || 100;
  const px = Math.hypot(ca.x - cb.x, ca.y - cb.y);
  // Foundry default: 1 grid ≈ 1.5 m in DF scenes; prefer scene grid distance when set.
  const units = Number((globalThis as any).canvas?.scene?.grid?.distance ?? 1.5) || 1.5;
  return (px / grid) * units;
}

export function actorsWithinCoordinationRange(
  donorToken: any,
  recipientToken: any,
  rangeM = TACTICAL_COORDINATION_RANGE_M,
): boolean {
  const d = tokenDistanceMeters(donorToken, recipientToken);
  if (d == null) return false;
  return d <= rangeM + 1e-6;
}

/** Best-effort perceptibility: recipient not Hidden from donor's perspective. */
export function canPerceiveAlly(donorActor: any, recipientActor: any): boolean {
  if (!donorActor || !recipientActor) return false;
  try {
    const hidden = recipientActor.getFlag?.('mastery-system', 'hidden') === true;
    if (hidden) return false;
  } catch {
    /* ignore */
  }
  const cond =
    recipientActor.statuses ??
    recipientActor.effects ??
    recipientActor.system?.statuses;
  if (cond && typeof cond.has === 'function' && cond.has('hidden')) return false;
  return true;
}

function tokenDisposition(token: any): number | null {
  const doc = token?.document ?? token;
  const d = Number(doc?.disposition);
  return Number.isFinite(d) ? d : null;
}

/**
 * Teamwork options only target allies. With placed tokens the token
 * dispositions must match; without tokens two player characters count as allies.
 */
export function areTeamworkAllies(
  a: any,
  b: any,
  tokens?: { aToken?: any; bToken?: any },
): boolean {
  if (!a || !b) return false;
  const da = tokenDisposition(tokens?.aToken);
  const db = tokenDisposition(tokens?.bToken);
  if (da != null && db != null) return da === db;
  return a.type === 'character' && b.type === 'character';
}

/** Attack Action Transfer recipients are player characters, never NPCs or Summons. */
export function isPlayerCharacter(actor: any): boolean {
  return actor?.type === 'character' && actor.hasPlayerOwner !== false;
}

/**
 * Prep: donor gives base Attack Action to recipient.
 * Recipient gains +1 donatedAttackActions (additive); donor locks base.
 * Without write access to the recipient the active GM records it.
 */
export async function grantRegularAttackActionTransfer(
  donor: any,
  recipient: any,
  combat: Combat | null,
  opts?: { donorToken?: any; recipientToken?: any; skipRangeCheck?: boolean },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { requestAttackActionTransfer } = await import('./teamwork-transactions.js');
  return requestAttackActionTransfer(donor, recipient, combat, opts ?? {});
}

/** Whether the actor's base Attack Action is locked because it was transferred. */
export function hasTransferredBaseAttack(rs: RoundState | null | undefined): boolean {
  return rs?.baseAttackTransferred === true;
}

export function donorStillHasUsableAttacks(actor: any, combat: Combat | null): number {
  return getAvailableAttackActions(actor, combat);
}
