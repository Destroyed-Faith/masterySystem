/**
 * Keep Ready / Sealed / Burned stone pools in sync across world actors and
 * unlinked token actors. Seals written via getActionEconomyActor often land on
 * the token while Safe Haven / sheet GM tools update the world prototype.
 */

import { getActionEconomyActor } from '../combat/action-economy.js';
import {
  ATTRIBUTE_KEYS,
  effectiveStoneAssignments,
  isLifetimeStoneMode,
  resolvedStonePoolMax,
  systemWithStoneProgression,
  usesV099Stones,
} from '../progression/v099-rules.js';

/** Same shape as SafeHavenSealHold — kept local to avoid import cycles. */
export interface StonePoolSealHold {
  attrCounts?: Record<string, number>;
  generic?: number;
}

// Hardcoded (not spread from action-economy): action-economy → ledger → this
// module would otherwise read STONE_POOL_ATTRIBUTE_KEYS before it is defined.
const POOL_KEYS = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
  'colorless',
] as const;

/**
 * In a fight for stone purposes: started combat, OR a per-character combat
 * ledger already exists for the live encounter (prepare phase — Round-1
 * stones were handed out / spent, so nothing may be refilled).
 */
function inLiveCombat(actor?: any): boolean {
  try {
    const combat = (globalThis as any).game?.combat;
    if (combat?.started && Math.floor(Number(combat.round) || 0) >= 1) return true;
    const cid = String(combat?.id ?? '');
    if (!cid || !actor) return false;
    const flag =
      actor?.flags?.['mastery-system']?.stoneCombatReady ??
      actor?.getFlag?.('mastery-system', 'stoneCombatReady');
    if (flag && String(flag.combatId ?? '') === cid) return true;
    const owner = getActionEconomyActor(actor) as any;
    const ownerFlag =
      owner && owner !== actor
        ? (owner?.flags?.['mastery-system']?.stoneCombatReady ??
          owner?.getFlag?.('mastery-system', 'stoneCombatReady'))
        : null;
    return !!(ownerFlag && String(ownerFlag.combatId ?? '') === cid);
  } catch {
    return false;
  }
}

/**
 * System used for Lifetime stone math. Token deltas often lack progression;
 * the world prototype keeps `stoneSlotOrder` / `v099Stones`.
 */
export function resolveActorStoneSystem(actor: any): any {
  const local = actor?.system ?? actor ?? {};
  if (isLifetimeStoneMode(local)) return local;
  try {
    let baseId = String(actor?.id ?? '');
    if (actor?.isToken) {
      baseId = String(actor?.token?.actorId ?? actor?.token?.document?.actorId ?? baseId);
    } else {
      const doc = actor?.token?.document;
      if (doc?.actorId) baseId = String(doc.actorId);
    }
    const world = baseId ? (globalThis as any).game?.actors?.get?.(baseId) : null;
    if (world && world !== actor) {
      return systemWithStoneProgression(local, world.system);
    }
  } catch {
    /* game / canvas optional */
  }
  return local;
}

/** Pool capacity for Ready refill (matches Safe Haven / Actor.prepareBaseData). */
export function stonePoolReadyMax(
  system: any,
  attr: string,
  pool: { max?: unknown } | null | undefined,
): number {
  const storedMax = Math.max(0, Number(pool?.max) || 0);
  if (attr === 'colorless') {
    if (usesV099Stones(system)) {
      return Math.max(
        storedMax,
        Math.max(0, Math.floor(Number(system?.progression?.permanentColorless) || 0)),
      );
    }
    return storedMax;
  }
  const attrValue = Math.max(0, Number(system?.attributes?.[attr]?.value) || 0);
  if (isLifetimeStoneMode(system)) {
    // Exact Lifetime assignments — never keep a stale Attribute÷8 max.
    return Math.max(0, Math.floor(Number((effectiveStoneAssignments(system) as any)[attr]) || 0));
  }
  const resolved = resolvedStonePoolMax(system, attr, attrValue);
  const assigned = Math.max(
    0,
    Math.floor(Number(system?.progression?.stoneAssignments?.[attr]) || 0),
  );
  return Math.max(resolved, storedMax, assigned);
}

function actorSyncKey(actor: any): string {
  if (actor?.isToken) {
    const tid = String(actor?.token?.id ?? actor?.id ?? '');
    return `token:${tid}`;
  }
  return `world:${String(actor?.id ?? '')}`;
}

/**
 * Every document that may hold combat stone pool state for this character:
 * the given actor, its economy owner, the world prototype, and placed tokens.
 */
export function listStonePoolSyncActors(actor: any): any[] {
  if (!actor) return [];
  const out: any[] = [];
  const seen = new Set<string>();
  const add = (a: any) => {
    if (!a || (a as any).type !== 'character') return;
    const key = actorSyncKey(a);
    if (!key.endsWith(':') && seen.has(key)) return;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(a);
  };

  add(actor);
  try {
    add(getActionEconomyActor(actor));
  } catch {
    /* economy resolve optional */
  }

  let baseId = String(actor?.id ?? '');
  try {
    if (actor?.isToken) {
      baseId = String(actor?.token?.actorId ?? actor?.token?.document?.actorId ?? baseId);
    } else {
      const doc = actor?.token?.document;
      if (doc?.actorId) baseId = String(doc.actorId);
    }
  } catch {
    /* ignore */
  }

  try {
    const world = baseId ? (globalThis as any).game?.actors?.get?.(baseId) : null;
    add(world);
  } catch {
    /* ignore */
  }

  try {
    const tokens = (globalThis as any).canvas?.tokens?.placeables ?? [];
    for (const token of tokens) {
      const aid = String(token?.document?.actorId ?? '');
      if (!baseId || aid !== baseId) continue;
      add(token?.actor);
    }
  } catch {
    /* canvas optional */
  }

  return out;
}

/** Plain stonePools object with Sealed/Burned cleared (Word of Recall hold respected). */
export function buildReadyStonePoolsObject(
  system: any,
  sealHold?: StonePoolSealHold | null,
  /** Optional progression donor (world actor system) when `system` is a token delta. */
  progressionDonor?: any,
  /**
   * Sustained counts to keep (Summon Bonds / Familiars). Safe Haven Rest must
   * not wipe these — only combat Sealed/Burned/spent return to Ready.
   */
  sustainedHold?: Record<string, number> | null,
): Record<string, { current: number; max: number; sustained: number; sealed: number; burned: number }> {
  const holdAttrs: Record<string, number> = {};
  for (const [attr, n] of Object.entries(sealHold?.attrCounts ?? {})) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    if (v > 0) holdAttrs[attr] = v;
  }
  const stoneSystem = progressionDonor
    ? systemWithStoneProgression(system, progressionDonor)
    : system;
  const next: Record<
    string,
    { current: number; max: number; sustained: number; sealed: number; burned: number }
  > = {};
  const existing = system?.stonePools ?? {};
  for (const attr of POOL_KEYS) {
    const poolData = existing[attr];
    if (poolData == null && attr === 'colorless') continue;
    const maxStones = stonePoolReadyMax(stoneSystem, attr, poolData ?? {});
    const heldSealed = Math.min(holdAttrs[attr] ?? 0, maxStones);
    const heldSustained = Math.min(
      Math.max(0, Math.floor(Number(sustainedHold?.[attr]) || 0)),
      Math.max(0, maxStones - heldSealed),
    );
    next[attr] = {
      max: maxStones,
      current: Math.max(0, maxStones - heldSealed - heldSustained),
      sustained: heldSustained,
      sealed: heldSealed,
      burned: 0,
    };
  }
  return next;
}

/** Dotted-path updates for callers that prefer partial writes. */
export function buildReadyStonePoolUpdates(
  system: any,
  sealHold?: StonePoolSealHold | null,
): Record<string, unknown> {
  const pools = buildReadyStonePoolsObject(system, sealHold);
  const updates: Record<string, unknown> = {};
  for (const [attr, pool] of Object.entries(pools)) {
    updates[`system.stonePools.${attr}.max`] = pool.max;
    updates[`system.stonePools.${attr}.current`] = pool.current;
    updates[`system.stonePools.${attr}.sustained`] = pool.sustained;
    updates[`system.stonePools.${attr}.sealed`] = pool.sealed;
    updates[`system.stonePools.${attr}.burned`] = pool.burned;
  }
  return updates;
}

/**
 * Align stonePools.max/current and stoneAssignments with the Lifetime track.
 * Does not clear Sealed/Burned — only repairs caps that still follow ÷8.
 * Uses world progression when the target is a token delta without the track.
 */
export async function syncStonePoolCapsFromAssignments(actor: any): Promise<boolean> {
  if (!actor) return false;
  const liveSystem = actor.system ?? {};
  const system = resolveActorStoneSystem(actor);
  if (!isLifetimeStoneMode(system)) return false;
  const eff = effectiveStoneAssignments(system);
  const updates: Record<string, unknown> = {};
  // Copy progression onto token actors so later prepareBaseData stays in Lifetime mode.
  if (liveSystem?.progression?.v099Stones !== true && system?.progression?.v099Stones === true) {
    updates['system.progression.v099Stones'] = true;
  }
  if (
    Array.isArray(system?.progression?.stoneSlotOrder) &&
    (!Array.isArray(liveSystem?.progression?.stoneSlotOrder) ||
      liveSystem.progression.stoneSlotOrder.length === 0)
  ) {
    updates['system.progression.stoneSlotOrder'] = system.progression.stoneSlotOrder.slice();
  }
  for (const attr of ATTRIBUTE_KEYS) {
    const want = Math.max(0, Math.floor(Number(eff[attr]) || 0));
    const pool = liveSystem?.stonePools?.[attr] ?? {};
    const max = Math.max(0, Math.floor(Number(pool.max) || 0));
    const current = Math.max(0, Math.floor(Number(pool.current) || 0));
    const sustained = Math.max(0, Math.floor(Number(pool.sustained) || 0));
    const sealed = Math.max(0, Math.floor(Number(pool.sealed) || 0));
    const burned = Math.max(0, Math.floor(Number(pool.burned) || 0));
    const reserved = sustained + sealed + burned;
    const readyCap = Math.max(0, want - reserved);
    const storedAssign = Math.max(
      0,
      Math.floor(Number(liveSystem?.progression?.stoneAssignments?.[attr]) || 0),
    );
    if (storedAssign !== want) {
      updates[`system.progression.stoneAssignments.${attr}`] = want;
    }
    if (max !== want) {
      updates[`system.stonePools.${attr}.max`] = want;
    }
    if (current > readyCap) {
      updates[`system.stonePools.${attr}.current`] = readyCap;
    } else if (current < readyCap && !inLiveCombat(actor)) {
      // Out of combat only: expand Ready to Audit cap. Mid-fight Spent stones
      // must stay spent — Stone Recovery (Mastery Rank) is the only refill.
      updates[`system.stonePools.${attr}.current`] = readyCap;
    }
  }
  if (!Object.keys(updates).length) return false;
  await actor.update?.(updates);
  return true;
}

/**
 * Force every economy document for this character to Ready stone pools.
 * Uses a whole `system.stonePools` replace so Foundry cannot leave a nested
 * `sealed` field behind on a DataModel fragment.
 */
export async function forceReadyStonePoolsOnCharacter(
  actor: any,
  sealHold?: StonePoolSealHold | null,
  opts?: { clearSummonSustained?: boolean },
): Promise<{ actors: number; vitalityReady: number; vitalitySealed: number }> {
  const targets = listStonePoolSyncActors(actor);
  let vitalityReady = 0;
  let vitalitySealed = 0;
  let sustainedHold: Record<string, number> | null = null;
  if (!opts?.clearSummonSustained) {
    try {
      const { summonBoundSustainedByAttr } = await import('./stone-audit.js');
      sustainedHold = summonBoundSustainedByAttr(actor);
    } catch {
      sustainedHold = null;
    }
  }
  for (const target of targets) {
    const stoneSystem = resolveActorStoneSystem(target);
    const pools = buildReadyStonePoolsObject(target?.system, sealHold, stoneSystem, sustainedHold);
    try {
      await target.update?.({ 'system.stonePools': pools });
    } catch (err) {
      console.warn('Mastery System | forceReadyStonePools update failed for', target?.name, err);
      try {
        await target.update?.(buildReadyStonePoolUpdates(target?.system, sealHold));
      } catch (err2) {
        console.warn('Mastery System | forceReadyStonePools dotted fallback failed', err2);
      }
    }
    vitalityReady = Math.max(
      vitalityReady,
      Math.max(0, Math.floor(Number(target?.system?.stonePools?.vitality?.current) || 0)),
    );
    vitalitySealed = Math.max(
      vitalitySealed,
      Math.max(0, Math.floor(Number(target?.system?.stonePools?.vitality?.sealed) || 0)),
    );
  }
  return { actors: targets.length, vitalityReady, vitalitySealed };
}
