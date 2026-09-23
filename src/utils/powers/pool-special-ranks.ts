/**
 * v0.9.9.0 printed ranks for Specials that remove Attack / Attribute Pool dice.
 *
 * Shared Active tables stay on the non-pool column (Corrode, Hex, Sundered,
 * Expose, Root, and the rest). These overrides apply only when the chosen
 * Special is Challenge, Disoriented, Soulburn, or Weaken.
 *
 * Source: docs/Rules/actives.md, active-buffs.md, reactions.md. Do not halve
 * a rank at runtime — the arrays below are the catalogue.
 */

export const POOL_REDUCING_SPECIAL_KEYS = ['challenge', 'disoriented', 'soulburn', 'weaken'] as const;

export type PoolReducingSpecialKey = (typeof POOL_REDUCING_SPECIAL_KEYS)[number];

const POOL_REDUCING = new Set<string>(POOL_REDUCING_SPECIAL_KEYS);

export function isPoolReducingSpecial(key: string | null | undefined): boolean {
  return POOL_REDUCING.has(String(key ?? '').trim().toLowerCase());
}

function clampLevel(level: number): number {
  const n = Math.floor(Number(level) || 0);
  return Math.max(1, Math.min(16, n));
}

/** null = that Power Level prints no Special (persistent zones at L1–L2). */
type RankRow = readonly (number | null)[];

const MELEE_SINGLE_CHALLENGE: RankRow = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5];
const RANGED_SINGLE_CHALLENGE: RankRow = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5];
const MELEE_SINGLE_POOL6: RankRow = [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5];
const RANGED_SINGLE_POOL6: RankRow = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4];
const MELEE_AOE_CHALLENGE: RankRow = [1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4];
const RANGED_AOE_CHALLENGE: RankRow = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3];
const MELEE_AOE_POOL6: RankRow = [1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4];
const RANGED_AOE_POOL6: RankRow = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3];
const ZONE_CHALLENGE: RankRow = [null, null, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2];
const ZONE_POOL6: RankRow = [null, null, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2];

const POOL6 = new Set(['disoriented', 'soulburn', 'weaken']);

function rowFor(templateId: string, key: string): RankRow | undefined {
  switch (templateId) {
    case 'active-melee-damage-t5':
      return key === 'challenge' ? MELEE_SINGLE_CHALLENGE : undefined;
    case 'active-ranged-damage-t5':
      return key === 'challenge' ? RANGED_SINGLE_CHALLENGE : undefined;
    case 'active-melee-damage-t6':
      return POOL6.has(key) ? MELEE_SINGLE_POOL6 : undefined;
    case 'active-ranged-damage-t6':
      return POOL6.has(key) ? RANGED_SINGLE_POOL6 : undefined;
    case 'active-melee-aoe-damage-t5':
      return key === 'challenge' ? MELEE_AOE_CHALLENGE : undefined;
    case 'active-ranged-aoe-damage-t5':
      return key === 'challenge' ? RANGED_AOE_CHALLENGE : undefined;
    case 'active-melee-aoe-damage-t6':
      return POOL6.has(key) ? MELEE_AOE_POOL6 : undefined;
    case 'active-ranged-aoe-damage-t6':
      return POOL6.has(key) ? RANGED_AOE_POOL6 : undefined;
    case 'active-ranged-zone-t5':
      return key === 'challenge' ? ZONE_CHALLENGE : undefined;
    case 'active-ranged-zone-t6':
      return POOL6.has(key) ? ZONE_POOL6 : undefined;
    default:
      return undefined;
  }
}

/**
 * Printed rank for a pool-reducing Special on a known template.
 * `undefined` means "keep the shared non-pool table".
 * `null` means this level prints no Special.
 */
export function poolSpecialRankOverride(
  templateId: string | null | undefined,
  specialKey: string | null | undefined,
  level: number,
): number | null | undefined {
  const id = String(templateId ?? '').trim();
  const key = String(specialKey ?? '').trim().toLowerCase();
  if (!id || !isPoolReducingSpecial(key)) return undefined;
  const row = rowFor(id, key);
  if (!row) return undefined;
  const lvl = clampLevel(level);
  return row[lvl - 1];
}

/** Active Buff: Special Increase. Non-pool curve, or the pool-special curve when `key` is one. */
export function activeBuffSpecialIncrease(level: number, key?: string | null): number {
  const lvl = clampLevel(level);
  const normal = lvl >= 15 ? 4 : lvl >= 12 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
  if (!isPoolReducingSpecial(key)) return normal;
  if (lvl >= 12) return 2;
  if (lvl >= 8) return 1;
  return normal;
}

/** Reaction: Special Increase. Narrower than the Active Buff curve. */
export function reactionSpecialIncrease(level: number, key?: string | null): number {
  const lvl = clampLevel(level);
  const normal = lvl >= 16 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
  if (!isPoolReducingSpecial(key)) return normal;
  if (lvl >= 16) return 2;
  if (lvl >= 8) return 1;
  return normal;
}

export function specialIncreasePair(
  templateId: string | null | undefined,
  level: number,
): { amount: number; poolAmount: number } | null {
  if (templateId === 'ab-special-overdrive') {
    return {
      amount: activeBuffSpecialIncrease(level),
      poolAmount: activeBuffSpecialIncrease(level, 'challenge'),
    };
  }
  if (templateId === 'reaction-special-increase') {
    return {
      amount: reactionSpecialIncrease(level),
      poolAmount: reactionSpecialIncrease(level, 'challenge'),
    };
  }
  return null;
}

type SpecialRow = { key: string; rank?: number; note?: string };

/**
 * Bind a `SPECIAL` placeholder and, when the chosen Special is pool-reducing,
 * replace the shared-table rank with the printed v0.9.9.0 rank.
 * Root still cannot print below Root(2).
 */
export function bindPoolSpecialsOnRow<T extends { specials?: SpecialRow[]; effect?: { text?: string } }>(
  row: T,
  chosenKey: string | null | undefined,
  templateId: string | null | undefined,
  level: number,
): T {
  const key = String(chosenKey ?? '').trim();
  if (!key || !Array.isArray(row?.specials)) return row;
  if (!row.specials.some((s) => s?.key === 'SPECIAL')) return row;
  const override = poolSpecialRankOverride(templateId, key, level);
  const specials = row.specials.map((s) => {
    if (s?.key !== 'SPECIAL') return s;
    const bound: SpecialRow = { ...s, key };
    if (typeof override === 'number') bound.rank = override;
    if (key === 'root' && (bound.rank ?? 0) > 0 && (bound.rank ?? 0) < 2) bound.rank = 2;
    return bound;
  });
  let effect = row.effect;
  if (typeof override === 'number' && effect?.text && /rank \d+/.test(effect.text)) {
    effect = { ...effect, text: effect.text.replace(/rank \d+/, `rank ${override}`) };
  }
  return { ...row, specials, ...(effect ? { effect } : {}) };
}
