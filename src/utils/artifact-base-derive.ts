/**
 * Artifact Base Value derivation — turns a Base Profile + Base Value type +
 * Artifact Level into the concrete value, using the canonical scaling tables
 * from `D:\DestroyedFaith\Powers\Artefacts.md`.
 *
 * The Edit Artifact Node dialog uses these helpers so the GM never types a
 * raw value like "4d8 + 4". Damage / Armor / Evade / Movement / etc. are
 * derived automatically; only the *choice* (which Special, which type) is
 * manual. A small override is still allowed for fairness tuning.
 *
 * Pure data + pure helpers. No Foundry, no DOM.
 */

import type { ArtifactBaseValueType } from './artifact-rules.js';

/** Clamp an artifact level into the legal 1..10 range. */
function clampLevel(level: number): number {
  return Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
}

/** Stage index used by the per-stage Special tables (0=Basic..3=Ultimate). */
function stageIndex(level: number): number {
  const l = clampLevel(level);
  if (l <= 3) return 0;
  if (l <= 6) return 1;
  if (l <= 9) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Weapon Special baseline (value-based Specials). Breakpoints: L1 / L4 / L7 / L10.
// Qualitative Specials (Finesse, Light, Reach, Thrown, Returning, Spell Focus,
// Ignite, …) do not scale by number and are intentionally absent here.
// ---------------------------------------------------------------------------

const WEAPON_SPECIAL_BASELINE: Record<string, [number, number, number, number]> = {
  penetration: [2, 4, 6, 8],
  expose: [2, 4, 6, 8],
  corrode: [2, 4, 6, 8],
  push: [2, 4, 6, 8],
  freeze: [2, 4, 6, 8],
  shock: [2, 4, 6, 8],
  mark: [2, 4, 6, 8],
  precision: [1, 2, 3, 4],
  prone: [1, 2, 3, 4],
  brutalimpact: [3, 5, 7, 9],
};

/** Normalize a Special label/id so "Brutal Impact" / "brutal-impact" all match. */
function normalizeSpecialKey(idOrLabel: string): string {
  return String(idOrLabel || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Derived value for a value-based Weapon Special at the given level, or `null`
 * if the Special is qualitative (no numeric value).
 */
export function scaleWeaponSpecial(idOrLabel: string, level: number): number | null {
  const key = normalizeSpecialKey(idOrLabel);
  const table = WEAPON_SPECIAL_BASELINE[key];
  if (!table) return null;
  return table[stageIndex(level)];
}

/** Is this Special value-based (scales) vs qualitative (no number)? */
export function isScalingWeaponSpecial(idOrLabel: string): boolean {
  return WEAPON_SPECIAL_BASELINE[normalizeSpecialKey(idOrLabel)] !== undefined;
}

// ---------------------------------------------------------------------------
// Per-type derivation (Damage / Armor / Evade / Movement / Range / Sense …)
// ---------------------------------------------------------------------------

export interface DerivedBaseValue {
  /** Human-readable derived value, e.g. "4d8", "+7 Armor", "+14 Evade". */
  display: string;
  /** Whether this type derives a value at all (false ⇒ free-form qualitative). */
  derivable: boolean;
}

/** Body Armor: Artifact Armor Bonus. L1=+4 … L9=+12, L10=+14. */
export function bodyArmorBonusForLevel(level: number): number {
  const l = clampLevel(level);
  return l <= 9 ? l + 3 : 14;
}

/** No-Armor Body Evade. L1=+8 … L9=+24, L10=+26. */
export function noArmorEvadeForLevel(level: number): number {
  const l = clampLevel(level);
  return l <= 9 ? 6 + 2 * l : 26;
}

/** Feet Evade (Base Value A). L1=+2 … L9=+10, L10=+12. */
export function feetEvadeForLevel(level: number): number {
  const l = clampLevel(level);
  return l <= 9 ? l + 1 : 12;
}

/** Minor Armor (Head / Feet). L1-2=+1, L3-4=+2 … L9-10=+5. */
export function minorArmorForLevel(level: number): number {
  return Math.min(5, Math.ceil(clampLevel(level) / 2));
}

/** Feet movement bonus. L1-2=+1, L3-4=+2 … L9-10=+5. */
export function feetMovementForLevel(level: number): number {
  return Math.min(5, Math.ceil(clampLevel(level) / 2));
}

/**
 * Base weapon dice from the physical Base Profile (before the per-level
 * artifact bonus):
 *   • One-handed (melee or ranged) → 2d8
 *   • Two-handed (melee or ranged) → 4d8
 *   • anything else (natural weapon / unknown) → 0 (pure per-level scaling)
 */
export function baseProfileWeaponDice(profile?: string | null): number {
  const p = String(profile || '').toLowerCase();
  if (p.includes('twohanded')) return 4;
  if (p.includes('onehanded')) return 2;
  return 0;
}

/**
 * Weapon Damage. A weapon deals its Base Profile dice (2d8 one-handed / 4d8
 * two-handed) plus +1d8 per artifact level. So a two-handed artifact at L2 is
 * 4 + 2 = 6d8; a one-handed at L2 is 2 + 2 = 4d8.
 */
export function weaponDamageForLevel(level: number, profile?: string | null): string {
  return `${baseProfileWeaponDice(profile) + clampLevel(level)}d8`;
}

/**
 * Spell Focus baseline — 1:1 the same value as Weapon Damage for the profile,
 * but the dice boost Spell damage instead of dealing weapon damage.
 */
export function spellFocusForLevel(level: number, profile?: string | null): string {
  return `+${baseProfileWeaponDice(profile) + clampLevel(level)}d8`;
}

/** Thrown Range baseline. L1=6 m … L10=15 m. */
export function thrownRangeForLevel(level: number): number {
  return clampLevel(level) + 5;
}

/** Sense depth tier word. L1-3 Detect, L4-6 Locate, L7-9 Identify, L10 Target. */
export function senseTierForLevel(level: number): string {
  return ['Detect', 'Locate', 'Identify', 'Target'][stageIndex(level)];
}

/**
 * Derive the read-only display string for a non-Special Base Value type at the
 * given level. `profile` disambiguates `evade` (body no-armor vs feet) and
 * `bodyArmor`/`headArmor` minor-vs-full armor.
 */
export function deriveBaseValueDisplay(
  type: ArtifactBaseValueType,
  level: number,
  profile?: string,
): DerivedBaseValue {
  switch (type) {
    case 'weaponDamage':
      return { display: weaponDamageForLevel(level, profile), derivable: true };
    case 'spellFocus':
      return { display: `${spellFocusForLevel(level, profile)} to Spells`, derivable: true };
    case 'thrownRange':
      return { display: `${thrownRangeForLevel(level)} m`, derivable: true };
    case 'bodyArmor':
      return { display: `+${bodyArmorBonusForLevel(level)} Armor`, derivable: true };
    case 'headArmor':
      return { display: `+${minorArmorForLevel(level)} Armor`, derivable: true };
    case 'shieldValue':
      // Shield Value is per shield type (Parry +1 / Medium +4 / Tower +8); no
      // generic level scaling in the spec. Default to Medium; override allowed.
      return { display: '+4 Armor', derivable: true };
    case 'evade': {
      const feet = profile === 'feet';
      const val = feet ? feetEvadeForLevel(level) : noArmorEvadeForLevel(level);
      return { display: `+${val} Evade`, derivable: true };
    }
    case 'movement':
      return { display: `+${feetMovementForLevel(level)} m`, derivable: true };
    case 'sense':
      return { display: senseTierForLevel(level), derivable: true };
    case 'weaponSpecial':
      // Handled via the Special picker, not this generic path.
      return { display: '', derivable: false };
    case 'minorFeature':
    default:
      return { display: '', derivable: false };
  }
}
