/**
 * Dragon Head Breath Weapon (Players Guide / Core).
 *
 * Damage Breath = Melee AoE Attack (catalogue length / power dice) **plus** this
 * Artifact's Bite Weapon Damage (Dragon Head-only exception to no-Weapon-Damage-on-AoE).
 * Ruin Breath = Melee AoE Special: Ruin (catalogue Ruin ranks / lengths; no damage, no Bite).
 *
 * Both modes are self-centered Martial Melee Instant AoEs using the catalogue radii
 * (one shared Attack Roll vs each Evade, equal payload; no Primary Target, no Cone).
 * Both modes share the Breath Weapon use counter (ceil(MR/2) per Safe Haven Rest).
 * Do not add Dragon Claws or other weapons to Damage Breath.
 */

import { weaponDamageForLevel } from './artifact-base-derive.js';
import { aoeSpecialRadiusM, aoeSpecialRank } from './powers/instant-special-ranks.js';
import { getTemplate } from './powers/templates/index.js';

export type DragonBreathMode = 'damage' | 'ruin';

/** Breath Weapon stage I / II / III (Artifact Level 1–3 / 4–6 / 7–10) → Power Level 4 / 10 / 16. */
export function breathPowerLevel(artifactLevel: number): 4 | 10 | 16 {
  const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
  if (level <= 3) return 4;
  if (level <= 6) return 10;
  return 16;
}

const DAMAGE_BREATH_TEMPLATE_ID = 'active-melee-weapon-aoe';

function damageBreathRow(artifactLevel: number):
  | { aoe?: { radiusM?: number }; mechanics?: { damageRider?: { flat?: string } } }
  | undefined {
  const tpl = getTemplate(DAMAGE_BREATH_TEMPLATE_ID) as
    | { levels?: Record<string, { aoe?: { radiusM?: number }; mechanics?: { damageRider?: { flat?: string } } }> }
    | undefined;
  return tpl?.levels?.[String(breathPowerLevel(artifactLevel))];
}

/** Damage Breath radius (m): Melee AoE Attack radius at the stage Power Level. */
export function breathDamageRadiusMeters(artifactLevel: number): number {
  return Number(damageBreathRow(artifactLevel)?.aoe?.radiusM) || 0;
}

/** Ruin Breath radius (m): Melee AoE Special: Ruin radius at the stage Power Level. */
export function breathRuinRadiusMeters(artifactLevel: number): number {
  return aoeSpecialRadiusM('melee', 'ruin', breathPowerLevel(artifactLevel)) ?? 0;
}

/** Melee AoE Attack Power Dice (d8 count) at the stage Power Level. */
export function breathPowerDamageDice(artifactLevel: number): number {
  const flat = String(damageBreathRow(artifactLevel)?.mechanics?.damageRider?.flat || '');
  const m = flat.match(/(\d+)d8/i);
  return m ? Number(m[1]) : 0;
}

/** Melee AoE Special: Ruin(X) at the stage Power Level. */
export function breathRuinValue(artifactLevel: number): number {
  return aoeSpecialRank('melee', 'ruin', breathPowerLevel(artifactLevel)) ?? 0;
}

/** Dragon Head Bite Weapon Damage at Artifact Level (1d8…10d8). */
export function dragonHeadBiteDamage(artifactLevel: number): string {
  return weaponDamageForLevel(Math.max(1, Math.min(10, Math.floor(Number(artifactLevel) || 1))));
}

/**
 * Shared Damage Breath pool preview: Bite + printed Power Dice.
 * Actual combat applies eligible bonuses once to this shared pool.
 */
export function damageBreathSharedPoolFormula(artifactLevel: number): string {
  const bite = dragonHeadBiteDamage(artifactLevel);
  const power = breathPowerDamageDice(artifactLevel);
  return `${bite}+${power}d8`;
}

/**
 * Radius for a Breath mode. Same catalogue numbers as the printed AoE column.
 */
export function breathRadiusMeters(
  artifactLevel: number,
  mode: DragonBreathMode = 'damage',
): number {
  return mode === 'ruin'
    ? breathRuinRadiusMeters(artifactLevel)
    : breathDamageRadiusMeters(artifactLevel);
}

/**
 * Sheet / dialog AoE text for a Breath Weapon row: dual Damage / Ruin radii.
 */
export function breathWeaponRowDisplay(artifactLevel: number): { range: string; aoe: string } {
  const d = breathDamageRadiusMeters(artifactLevel);
  const r = breathRuinRadiusMeters(artifactLevel);
  return {
    range: 'Self',
    aoe: `Damage: radius ${d} m / Ruin: radius ${r} m`,
  };
}

/** Range / AoE text for any progression row, with Breath Weapon dual radii applied. */
export function progressionRowRangeAoe(
  row:
    | {
        name?: string;
        level?: number;
        range?: string;
        aoe?: string;
        artifactFunctionId?: string | null;
      }
    | null
    | undefined,
  fallbackLevel?: number,
): { range: string; aoe: string } {
  if (!row) return { range: '', aoe: '' };
  if (row.artifactFunctionId === 'dragon-breath') {
    return breathWeaponRowDisplay(Number(row.level) || Number(fallbackLevel) || 1);
  }
  return { range: String(row.range || ''), aoe: String(row.aoe || '') };
}
