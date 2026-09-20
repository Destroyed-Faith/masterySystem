/**
 * Pure rules behind the Stone Powers dialog: which stone a click-fill takes,
 * when a wave may be charged, and why a visible pool is unusable. Kept free of
 * Foundry globals so the behaviour can be unit tested.
 */

import { COLORLESS_STONE_ATTR } from './colorless-stones.js';

/**
 * Attribute a click-fill should draw the next stone from. Colorless Stones are
 * the last resort: they only get picked when no attribute pool has a free stone
 * left, so a player never burns them while coloured stones are still available.
 */
export function pickStoneFillAttribute(
  attributes: readonly string[],
  isUsable: (attr: string) => boolean,
  spendable: (attr: string) => number
): string | null {
  for (const attr of attributes) {
    if (attr === COLORLESS_STONE_ATTR) continue;
    if (!isUsable(attr)) continue;
    if (spendable(attr) > 0) return attr;
  }
  if (isUsable(COLORLESS_STONE_ATTR) && spendable(COLORLESS_STONE_ATTR) > 0) {
    return COLORLESS_STONE_ATTR;
  }
  return null;
}

/**
 * Guard against paying a wave twice. `currentUses === usesInKey` alone is not
 * enough: `stoneUsage` is wiped on turn change and combat start, so a restored
 * snapshot of an already paid wave would line up again and charge empty pools.
 */
export function shouldSettleStoneWave(args: {
  reviewMode: boolean;
  paidAccKeys: Iterable<string>;
  accKey: string;
  currentUses: number;
  usesInKey: number;
}): boolean {
  if (args.reviewMode) return false;
  for (const paid of args.paidAccKeys) {
    if (paid === args.accKey) return false;
  }
  return Number(args.currentUses) === Number(args.usesInKey);
}

/**
 * Card order inside a power row. Every row holds exactly one T2-start power
 * (Tier 1 does not exist). Its first activation costs 2 stones and the
 * unused Anchor lane is omitted. It leads the row so the shorter cluster
 * sits first. The remaining cards keep their order.
 */
export function orderPowersRampFirst<T>(
  powers: readonly T[],
  skipsFirstTier: (power: T) => boolean
): T[] {
  const lead: T[] = [];
  const rest: T[] = [];
  for (const power of powers) {
    (skipsFirstTier(power) ? lead : rest).push(power);
  }
  return [...lead, ...rest];
}

/**
 * Whether an attribute (or General) section starts expanded in the Stone
 * Powers dialog. Sections with freely spendable stones of that attribute
 * open; empty ones stay collapsed. The player can still toggle them.
 * A stored override (this dialog session) always wins.
 */
export function stoneDialogSectionStartsOpen(args: {
  sectionHasSpendable: boolean;
  sectionHasAssigned?: boolean;
  userOverride?: boolean;
}): boolean {
  if (typeof args.userOverride === 'boolean') return args.userOverride;
  return !!args.sectionHasSpendable || !!args.sectionHasAssigned;
}

export interface PendingStoneActivation {
  name: string;
  placed: number;
  needed: number;
  missing: number;
}

/**
 * Stones sitting in a power that has not reached the next full wave.
 * Placing them does not turn the power on — Extra Attack and Crit start at
 * 2 stones, so one stone in each looks assigned and does nothing.
 */
export function pendingStoneActivation(args: {
  name: string;
  placed: number;
  needed: number;
}): PendingStoneActivation | null {
  const placed = Math.max(0, Math.floor(Number(args.placed) || 0));
  const needed = Math.max(0, Math.floor(Number(args.needed) || 0));
  if (placed <= 0 || needed <= 0 || placed >= needed) return null;
  return {
    name: String(args.name || 'Steinmacht').trim() || 'Steinmacht',
    placed,
    needed,
    missing: needed - placed,
  };
}

export function pendingStoneActivationLabel(row: PendingStoneActivation): string {
  const still = row.missing === 1 ? 'noch 1 Stein' : `noch ${row.missing} Steine`;
  return `Nicht aktiviert — ${row.placed} von ${row.needed}, ${still}.`;
}

export function formatPendingStoneActivationWarning(rows: readonly PendingStoneActivation[]): string {
  if (!rows.length) return '';
  const bits = rows.map((row) => `${row.name} (${row.placed} von ${row.needed})`);
  return `Nicht aktiviert: ${bits.join(', ')}. Ablegen schaltet die Macht nicht ein — die Welle muss voll sein.`;
}

/** Why a visible pool has nothing to drag right now (empty string = usable). */
export function stonePoolBlockedReason(pool: {
  max: number;
  available: number;
  sustained: number;
  artifactBound: number;
}): string {
  if (pool.max <= 0) return 'Attribute below 8 — no stone pool';
  if (pool.available > 0) return '';
  if (pool.sustained > 0) return 'bound by Sustain';
  return 'spent this round';
}

/**
 * Green card ring after a Stone Power has been charged. Unused cards stay
 * white. First activation is a thin 1px green edge; each further wave adds
 * 1px, capped at 5px so the compact card still fits.
 */
export function stonePowerActivationRing(activationCount: number): {
  activationCount: number;
  activated: boolean;
  ringPx: number;
} {
  const n = Math.max(0, Math.min(8, Math.floor(Number(activationCount) || 0)));
  return {
    activationCount: n,
    activated: n > 0,
    ringPx: n <= 0 ? 1 : Math.min(5, n),
  };
}
