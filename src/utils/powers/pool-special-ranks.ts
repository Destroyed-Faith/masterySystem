/**
 * v0.9.9.0 printed ranks for Specials that remove Attack / Attribute Pool dice.
 *
 * Shared Active tables stay on the non-pool column (Corrode, Hex, Sundered,
 * Expose, Root, and the rest). These overrides apply only when the chosen
 * Special is Challenge, Disoriented, Soulburn, or Weaken.
 *
 * Source: docs/Rules/Canonical/Actives.md, active-buffs.md, reactions.md. Do not halve
 * a rank at runtime — the arrays below are the catalogue.
 */

import {
  aoeSpecialRadiusM,
  aoeSpecialRank,
  instantSpecialRank,
  zoneRadiusM,
  zoneSpecialRank,
} from './instant-special-ranks.js';

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

const MELEE_AOE_CHALLENGE: RankRow = [1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4];
const RANGED_AOE_CHALLENGE: RankRow = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3];
const MELEE_AOE_POOL6: RankRow = [1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4];
const RANGED_AOE_POOL6: RankRow = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3];
const ZONE_CHALLENGE: RankRow = [null, null, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2];
const ZONE_POOL6: RankRow = [null, null, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2];

const POOL6 = new Set(['disoriented', 'soulburn', 'weaken']);

function rowFor(templateId: string, key: string): RankRow | undefined {
  switch (templateId) {
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

/** Instant Single-Special templates use per-Special printed ranks from docs/Rules/Canonical/Actives.md. */
function instantSpecialTemplateOverride(
  templateId: string | null | undefined,
  specialKey: string | null | undefined,
  level: number,
): number | undefined {
  const id = String(templateId ?? '').trim();
  const m = id.match(/^active-(melee|ranged)-instant-special-t[3-6]$/);
  if (!m) return undefined;
  return instantSpecialRank(m[1] as 'melee' | 'ranged', specialKey, level);
}

/**
 * AoE Special templates (`active-*-aoe-damage-t*`, special-only) use the
 * printed Melee/Ranged AoE Special table of the chosen Special (rank + radius).
 */
function aoeSpecialTemplateOverride(
  templateId: string | null | undefined,
  specialKey: string | null | undefined,
  level: number,
): { rank?: number; radiusM?: number } | undefined {
  const m = String(templateId ?? '').trim().match(/^active-(melee|ranged)-aoe-damage-t[3-6]$/);
  if (!m) return undefined;
  const flavour = m[1] as 'melee' | 'ranged';
  const rank = aoeSpecialRank(flavour, specialKey, level);
  const radiusM = aoeSpecialRadiusM(flavour, specialKey, level);
  if (rank === undefined && radiusM === undefined) return undefined;
  return { rank, radiusM };
}

/**
 * Ranged Persistent Special Zones use the printed Zone table of their tier.
 * Specials without a printed Zone row (Root) keep the template value.
 */
function zoneTemplateOverride(
  templateId: string | null | undefined,
  specialKey: string | null | undefined,
  level: number,
): { rank?: number; radiusM?: number } | undefined {
  const m = String(templateId ?? '').trim().match(/^active-ranged-zone-t([3-6])$/);
  if (!m) return undefined;
  const tier = Number(m[1]) as 3 | 4 | 5 | 6;
  const rank = zoneSpecialRank(tier, specialKey, level);
  if (rank === undefined) return undefined;
  return { rank, radiusM: zoneRadiusM(tier, level) || undefined };
}
/**
 * Bind a `SPECIAL` placeholder and replace the shared-table rank with the
 * printed rank of the chosen Special (Single Target Special, AoE Special,
 * Persistent Zone, or a pool-reducing override). AoE Special and Zone rows also take the printed Radius. Root
 * still cannot print below Root(2).
 */
export function bindPoolSpecialsOnRow<
  T extends {
    specials?: SpecialRow[];
    effect?: { text?: string };
    aoe?: { shape?: string; radiusM?: number; center?: string; targetFilter?: string } | null;
  },
>(row: T, chosenKey: string | null | undefined, templateId: string | null | undefined, level: number): T {
  const key = String(chosenKey ?? '').trim();
  if (!key || !Array.isArray(row?.specials)) return row;
  if (!row.specials.some((s) => s?.key === 'SPECIAL')) return row;
  const table = aoeSpecialTemplateOverride(templateId, key, level) ?? zoneTemplateOverride(templateId, key, level);
  const override =
    instantSpecialTemplateOverride(templateId, key, level) ??
    table?.rank ??
    poolSpecialRankOverride(templateId, key, level);
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
  let aoe = row.aoe;
  const radiusOverride = table?.radiusM;
  if (typeof radiusOverride === 'number' && aoe && typeof aoe === 'object') {
    if (effect?.text && typeof aoe.radiusM === 'number') {
      effect = { ...effect, text: effect.text.replace(`**${aoe.radiusM} m**`, `**${radiusOverride} m**`) };
    }
    aoe = { ...aoe, radiusM: radiusOverride };
  }
  return {
    ...row,
    specials,
    ...(effect ? { effect } : {}),
    ...(aoe ? { aoe } : {}),
  };
}
