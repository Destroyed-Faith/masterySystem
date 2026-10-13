/**
 * Per-character combat ledger of remaining Ready stones.
 *
 * Actor `system.stonePools.*.current` alone is not enough: world vs token
 * copies can disagree and `livePoolFields` used to take MAX, so spent stones
 * looked full again at Round 2. This flag is the combat source of truth for
 * how many Ready stones each pool still has.
 */

// Keys duplicated (not imported from action-economy) so this module can be
// imported synchronously from getStonePool without a circular init crash.
import { getActionEconomyActor } from '../combat/action-economy.js';
import { listStonePoolSyncActors } from './stone-pool-sync.js';

export const STONE_COMBAT_READY_FLAG = 'stoneCombatReady';

export interface StoneCombatReadyLedger {
  combatId: string;
  /** Remaining Ready stones per pool (attributes + colorless). */
  pools: Record<string, number>;
}

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

type LedgerCombatLike = { id?: string; started?: boolean; combatants?: any } | null | undefined;

/**
 * Combat id the ledger is keyed by. The ledger is active for the WHOLE
 * encounter — prepare phase (round 0, `started === false`) included — because
 * Round-1 stones are bought there and every spend must be recorded.
 */
export function stoneLedgerCombatId(combat: LedgerCombatLike): string {
  if (!combat) return '';
  const id = String(combat.id ?? '').trim();
  return id;
}

function currentCombatId(): string {
  try {
    const combat = (globalThis as any).game?.combat;
    return stoneLedgerCombatId(combat);
  } catch {
    return '';
  }
}

/** True when a ledger for `combat` (default: live combat) already exists. */
export function hasStoneCombatReady(actor: any, combat?: LedgerCombatLike): boolean {
  const cid = combat === undefined ? currentCombatId() : stoneLedgerCombatId(combat);
  if (!cid) return false;
  return readStoneCombatReady(actor, cid) !== null;
}

function readPoolCurrent(actor: any, attr: string): number {
  return Math.max(0, Math.floor(Number(actor?.system?.stonePools?.[attr]?.current) || 0));
}

/** Most depleted live current across world/token copies (never MAX). */
export function minLivePoolCurrent(actor: any, attr: string): number {
  let found = false;
  let min = Number.POSITIVE_INFINITY;
  try {
    for (const a of listStonePoolSyncActors(actor)) {
      const n = readPoolCurrent(a, attr);
      found = true;
      if (n < min) min = n;
    }
  } catch {
    /* canvas/game optional */
  }
  if (!found) {
    let owner = actor;
    try {
      owner = getActionEconomyActor(actor) ?? actor;
    } catch {
      owner = actor;
    }
    return readPoolCurrent(owner, attr);
  }
  return Number.isFinite(min) ? min : 0;
}

function readFlagFrom(actor: any): StoneCombatReadyLedger | undefined {
  if (!actor) return undefined;
  try {
    if (typeof actor.getFlag === 'function') {
      return actor.getFlag('mastery-system', STONE_COMBAT_READY_FLAG) as StoneCombatReadyLedger | undefined;
    }
  } catch {
    /* ignore */
  }
  return actor?.flags?.['mastery-system']?.[STONE_COMBAT_READY_FLAG] as StoneCombatReadyLedger | undefined;
}

export function readStoneCombatReady(actor: any, combatId?: string): StoneCombatReadyLedger | null {
  const cid = String(combatId ?? currentCombatId() ?? '').trim();
  if (!cid) return null;
  let raw = readFlagFrom(actor);
  if (!raw || String(raw.combatId) !== cid) {
    try {
      const owner = getActionEconomyActor(actor);
      if (owner && owner !== actor) raw = readFlagFrom(owner);
    } catch {
      /* game/canvas optional in unit tests */
    }
  }
  if (!raw || String(raw.combatId) !== cid) return null;
  const pools: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.pools || {})) {
    pools[k] = Math.max(0, Math.floor(Number(v) || 0));
  }
  return { combatId: cid, pools };
}

/**
 * Remaining Ready for one pool while this combat's ledger is active.
 * Returns null when out of combat or no ledger yet (caller falls back to pools).
 * Never exceeds the lowest live `current` — spent through any path stays spent.
 */
export function combatReadyRemaining(actor: any, attr: string, combatId?: string): number | null {
  const ledger = readStoneCombatReady(actor, combatId);
  if (!ledger) return null;
  if (!Object.prototype.hasOwnProperty.call(ledger.pools, attr) && Object.keys(ledger.pools).length === 0) {
    return null;
  }
  const fromLedger = Math.max(0, Math.floor(Number(ledger.pools[attr]) || 0));
  return Math.min(fromLedger, minLivePoolCurrent(actor, attr));
}

export async function writeStoneCombatReady(
  actor: any,
  ledger: StoneCombatReadyLedger,
): Promise<void> {
  let owner = actor;
  try {
    owner = getActionEconomyActor(actor) ?? actor;
  } catch {
    owner = actor;
  }
  if (!owner?.setFlag) return;
  const pools: Record<string, number> = {};
  for (const key of POOL_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(ledger.pools, key)) continue;
    pools[key] = Math.max(0, Math.floor(Number(ledger.pools[key]) || 0));
  }
  // Preserve any extra keys (future-proof).
  for (const [k, v] of Object.entries(ledger.pools || {})) {
    if (Object.prototype.hasOwnProperty.call(pools, k)) continue;
    pools[k] = Math.max(0, Math.floor(Number(v) || 0));
  }
  await owner.setFlag('mastery-system', STONE_COMBAT_READY_FLAG, {
    combatId: String(ledger.combatId),
    pools,
  });
}

export async function clearStoneCombatReady(actor: any): Promise<void> {
  let owner = actor;
  try {
    owner = getActionEconomyActor(actor) ?? actor;
  } catch {
    owner = actor;
  }
  if (!owner) return;
  try {
    await owner.unsetFlag?.('mastery-system', STONE_COMBAT_READY_FLAG);
  } catch {
    try {
      await owner.setFlag?.('mastery-system', STONE_COMBAT_READY_FLAG, { combatId: '', pools: {} });
    } catch {
      /* ignore */
    }
  }
}

/** Snapshot remaining Ready from the most depleted live pools. */
export function snapshotStoneCombatReadyPools(actor: any): Record<string, number> {
  const pools: Record<string, number> = {};
  for (const key of POOL_KEYS) {
    pools[key] = minLivePoolCurrent(actor, key);
  }
  return pools;
}

/**
 * Mirror ledger Ready values onto every world/token pool copy so a stale full
 * sibling cannot win the next Available read. Only ever LOWERS a copy — a copy
 * that is already below the ledger was spent through a path the ledger did
 * not see, and raising it would resurrect spent stones.
 */
export async function mirrorStoneCombatReadyToPools(
  actor: any,
  ledger: StoneCombatReadyLedger,
): Promise<void> {
  for (const target of listStonePoolSyncActors(actor)) {
    const patch: Record<string, number> = {};
    for (const [attr, n] of Object.entries(ledger.pools || {})) {
      const want = Math.max(0, Math.floor(Number(n) || 0));
      if (readPoolCurrent(target, attr) > want) {
        patch[`system.stonePools.${attr}.current`] = want;
      }
    }
    if (!Object.keys(patch).length) continue;
    try {
      await target.update?.(patch);
    } catch (err) {
      console.warn('Mastery System | mirrorStoneCombatReadyToPools failed', target?.name, err);
    }
  }
}

/**
 * Ensure a combat ledger exists for this fight. Seeds from the lowest live
 * `current` across sync copies so a stale full world actor cannot inflate Ready.
 * An existing ledger is reconciled DOWN to the lowest live copy (spent is
 * spent), then stale-full copies are lowered to the ledger.
 */
export async function ensureStoneCombatReady(
  actor: any,
  combat: LedgerCombatLike,
): Promise<StoneCombatReadyLedger | null> {
  const cid = stoneLedgerCombatId(combat);
  if (!cid) return null;
  let ledger = readStoneCombatReady(actor, cid);
  if (!ledger) {
    ledger = {
      combatId: cid,
      pools: snapshotStoneCombatReadyPools(actor),
    };
    await writeStoneCombatReady(actor, ledger);
  } else {
    let changed = false;
    for (const key of POOL_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(ledger.pools, key)) continue;
      const live = minLivePoolCurrent(actor, key);
      if (live < ledger.pools[key]) {
        ledger.pools[key] = live;
        changed = true;
      }
    }
    if (changed) await writeStoneCombatReady(actor, ledger);
  }
  await mirrorStoneCombatReadyToPools(actor, ledger);
  return ledger;
}

/**
 * Force-overwrite the combat ledger (Round-1 refill / prep).
 * Pass explicit `pools` when you just wrote them — do not re-snapshot MIN across
 * stale token copies or the refill would be undone.
 */
export async function resealStoneCombatReadyFromPools(
  actor: any,
  combat: LedgerCombatLike,
  pools?: Record<string, number>,
): Promise<void> {
  const cid = stoneLedgerCombatId(combat);
  if (!cid) return;
  const next = pools ?? snapshotStoneCombatReadyPools(actor);
  await writeStoneCombatReady(actor, { combatId: cid, pools: next });
  for (const target of listStonePoolSyncActors(actor)) {
    const patch: Record<string, number> = {};
    for (const [attr, n] of Object.entries(next)) {
      const want = Math.max(0, Math.floor(Number(n) || 0));
      if (readPoolCurrent(target, attr) !== want) {
        patch[`system.stonePools.${attr}.current`] = want;
      }
    }
    if (!Object.keys(patch).length) continue;
    try {
      await target.update?.(patch);
    } catch (err) {
      console.warn('Mastery System | resealStoneCombatReady mirror failed', target?.name, err);
    }
  }
}

/**
 * Set remaining Ready for one pool: update ledger + mirror `current` onto every
 * sync document so world/token copies cannot diverge again.
 */
export async function setCombatPoolCurrent(
  actor: any,
  attr: string,
  current: number,
  combat?: LedgerCombatLike,
): Promise<void> {
  const next = Math.max(0, Math.floor(Number(current) || 0));
  const liveCombat =
    combat ??
    (() => {
      try {
        return (globalThis as any).game?.combat ?? null;
      } catch {
        return null;
      }
    })();

  const cid = stoneLedgerCombatId(liveCombat);
  if (cid) {
    const ledger =
      (await ensureStoneCombatReady(actor, liveCombat)) ??
      ({ combatId: cid, pools: snapshotStoneCombatReadyPools(actor) } as StoneCombatReadyLedger);
    ledger.pools[attr] = next;
    await writeStoneCombatReady(actor, ledger);
  }

  const path = `system.stonePools.${attr}.current`;
  for (const target of listStonePoolSyncActors(actor)) {
    const cur = readPoolCurrent(target, attr);
    if (cur === next) continue;
    try {
      await target.update?.({ [path]: next });
    } catch (err) {
      console.warn('Mastery System | setCombatPoolCurrent mirror failed for', target?.name, err);
    }
  }
}

/**
 * Add recovered stones into ledger + pools (capped by caller before call).
 */
export async function addCombatPoolCurrent(
  actor: any,
  attr: string,
  add: number,
  combat?: LedgerCombatLike,
): Promise<number> {
  const delta = Math.max(0, Math.floor(Number(add) || 0));
  if (!delta) return combatReadyRemaining(actor, attr) ?? minLivePoolCurrent(actor, attr);
  const before = combatReadyRemaining(actor, attr) ?? minLivePoolCurrent(actor, attr);
  const next = before + delta;
  await setCombatPoolCurrent(actor, attr, next, combat);
  return next;
}
