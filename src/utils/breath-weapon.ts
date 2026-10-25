/**
 * Dragon Head Breath Weapon (Players Guide / Core).
 *
 * Damage Breath = Melee AoE Attack (catalogue length / power dice) **plus** this
 * Artifact's Bite Weapon Damage (Dragon Head-only exception to no-Weapon-Damage-on-AoE).
 * Ruin Breath = Melee AoE Special: Ruin (catalogue Ruin ranks / lengths; no damage, no Bite).
 *
 * Geometry specialty: **Cone** (apex on the caster, aimed by facing) — still a Martial
 * Melee Instant AoE (one shared Attack Roll vs each Evade, equal payload; no Primary Target).
 * Both modes share the Breath Weapon use counter (ceil(MR/2) per Safe Haven Rest
 * and once per Combat). Attack Attribute: Might or Agility (choose before the roll).
 * Do not add Dragon Claws or other weapons to Damage Breath.
 */

import { weaponDamageForLevel } from './artifact-base-derive.js';

export type DragonBreathMode = 'damage' | 'ruin';

export function isBreathWeaponName(name: string | null | undefined): boolean {
  const n = String(name || '');
  return /breath\s*weapon/i.test(n) || /damage\s*breath/i.test(n) || /ruin\s*breath/i.test(n);
}

export function isDragonBreathDamageMode(name: string | null | undefined): boolean {
  return /damage\s*breath/i.test(String(name || ''));
}

export function isDragonBreathRuinMode(name: string | null | undefined): boolean {
  return /ruin\s*breath/i.test(String(name || ''));
}

/** Damage Breath cone length (m) at artifact stages → PL 4 / 10 / 16. */
export function breathDamageConeMeters(artifactLevel: number): number {
  const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
  if (level <= 3) return 3;
  if (level <= 6) return 6;
  return 8;
}

/** Ruin Breath cone length (m) at artifact stages → PL 4 / 10 / 16. */
export function breathRuinConeMeters(artifactLevel: number): number {
  const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
  if (level <= 3) return 3;
  if (level <= 6) return 5;
  return 7;
}

/** @deprecated Prefer `breathDamageConeMeters` (Breath is Cone, not a radius burst). */
export function breathDamageRadiusMeters(artifactLevel: number): number {
  return breathDamageConeMeters(artifactLevel);
}

/** @deprecated Prefer `breathRuinConeMeters`. */
export function breathRuinRadiusMeters(artifactLevel: number): number {
  return breathRuinConeMeters(artifactLevel);
}

/** Printed Melee AoE Attack Power Dice at Breath stages (PL 4 / 10 / 16). */
export function breathPowerDamageDice(artifactLevel: number): number {
  const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
  if (level <= 3) return 4;
  if (level <= 6) return 7;
  return 13;
}

/** Printed Melee AoE Special: Ruin(X) at Breath stages (PL 4 / 10 / 16). */
export function breathRuinValue(artifactLevel: number): number {
  const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
  if (level <= 3) return 5;
  if (level <= 6) return 9;
  return 10;
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
 * Cone length for a Breath mode. Same catalogue numbers as the printed AoE column.
 */
export function breathConeMeters(
  artifactLevel: number,
  mode: DragonBreathMode = 'damage',
): number {
  return mode === 'ruin'
    ? breathRuinConeMeters(artifactLevel)
    : breathDamageConeMeters(artifactLevel);
}

/**
 * Sheet / dialog AoE text for a Breath Weapon row: dual Damage / Ruin cone lengths.
 */
export function breathWeaponRowDisplay(artifactLevel: number): { range: string; aoe: string } {
  const d = breathDamageConeMeters(artifactLevel);
  const r = breathRuinConeMeters(artifactLevel);
  return {
    range: 'Self',
    aoe: `Damage: Cone ${d} m / Ruin: Cone ${r} m`,
  };
}

/** Range / AoE text for any progression row, with Breath Weapon dual cones applied. */
export function progressionRowRangeAoe(
  row: { name?: string; level?: number; range?: string; aoe?: string } | null | undefined,
  fallbackLevel?: number,
): { range: string; aoe: string } {
  if (!row) return { range: '', aoe: '' };
  if (isBreathWeaponName(row.name)) {
    return breathWeaponRowDisplay(Number(row.level) || Number(fallbackLevel) || 1);
  }
  return { range: String(row.range || ''), aoe: String(row.aoe || '') };
}
