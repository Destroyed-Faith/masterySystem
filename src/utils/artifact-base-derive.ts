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
// Ruin, …) do not scale by number and are intentionally absent here.
// ---------------------------------------------------------------------------

const WEAPON_SPECIAL_BASELINE: Record<string, [number, number, number, number]> = {
  // Instant / qualitative-value Specials
  penetration: [2, 4, 6, 8],
  push: [2, 4, 6, 8],
  precision: [1, 2, 3, 4],
  prone: [1, 2, 3, 4],
  brutalimpact: [3, 5, 7, 9],
  // Start PP 4
  lacerate: [2, 4, 6, 8],
  mark: [2, 4, 6, 8],
  ruin: [2, 4, 6, 8],
  slow: [2, 4, 6, 8],
  // Start PP 6
  challenge: [1, 3, 4, 6],
  corrode: [1, 3, 4, 6],
  hex: [1, 3, 4, 6],
  sundered: [1, 3, 4, 6],
  // Start PP 8
  disoriented: [1, 2, 4, 5],
  expose: [1, 2, 4, 5],
  soulburn: [1, 2, 4, 5],
  weaken: [1, 2, 4, 5],
  blight: [2, 4, 7, 9],
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
  /** Human-readable or parseable derived value (stored when no override). */
  display: string;
  /** Optional richer label for UI (e.g. "Armor 4 (Light)"); falls back to display. */
  label?: string;
  /** Whether this type derives a value at all (false ⇒ free-form qualitative). */
  derivable: boolean;
}

export type ArtifactArmorWeightClass = 'light' | 'medium' | 'heavy';

/** Mundane armor base (Light 4 / Medium 8 / Heavy 12). */
export const ARTIFACT_ARMOR_MUNDANE_BASE: Record<ArtifactArmorWeightClass, number> = {
  light: 4,
  medium: 8,
  heavy: 12,
};

/**
 * Artifact Body Armor — absolute Armor totals by weight class and level.
 * Both Armor and Evade live on Base Value slot A (two modifiers).
 */
const ARTIFACT_ARMOR_TOTAL_TABLE: Record<ArtifactArmorWeightClass, readonly number[]> = {
  // Light: strongest Evade path, modest Armor layer
  light: [4, 4, 5, 5, 6, 6, 7, 7, 8, 8],
  // Medium: balanced Armor, slower Evade recovery
  medium: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12],
  // Heavy: strongest Armor path
  heavy: [12, 12, 13, 13, 14, 14, 15, 15, 16, 16],
};

/**
 * Final Evade Modifier contributed by an Artifact Body Armor (slot A).
 * Medium/Heavy values already include the mundane −2 / −4 Evade drawbacks.
 */
const ARTIFACT_ARMOR_EVADE_TABLE: Record<ArtifactArmorWeightClass, readonly number[]> = {
  light: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  medium: [-1, -1, 0, 0, 1, 1, 2, 2, 3, 3],
  heavy: [-4, -4, -4, -4, -4, -2, -2, -2, -2, -2],
};

export function normalizeArtifactArmorWeight(
  raw: string | null | undefined,
): ArtifactArmorWeightClass | null {
  const t = String(raw || '')
    .toLowerCase()
    .trim();
  if (t === 'light' || t === 'medium' || t === 'heavy') return t;
  if (t.includes('heavy')) return 'heavy';
  if (t.includes('medium')) return 'medium';
  if (t.includes('light') || t.includes('hybrid') || t.includes('robe') || t.includes('noarmor')) {
    return 'light';
  }
  return null;
}

/** Absolute Armor total for an Artifact Body Armor at the given level. */
export function artifactArmorTotalForLevel(
  weight: ArtifactArmorWeightClass,
  level: number,
): number {
  return ARTIFACT_ARMOR_TOTAL_TABLE[weight][clampLevel(level) - 1]!;
}

/**
 * Artifact Armor Bonus stored on the `bodyArmor` Base Value
 * (absolute total minus mundane Light/Medium/Heavy base).
 */
export function artifactArmorBonusForLevel(
  weight: ArtifactArmorWeightClass,
  level: number,
): number {
  return artifactArmorTotalForLevel(weight, level) - ARTIFACT_ARMOR_MUNDANE_BASE[weight];
}

/** Final Evade Modifier for an Artifact Body Armor at the given level. */
export function artifactArmorEvadeForLevel(
  weight: ArtifactArmorWeightClass,
  level: number,
): number {
  return ARTIFACT_ARMOR_EVADE_TABLE[weight][clampLevel(level) - 1]!;
}

/**
 * @deprecated Old shared +4…+14 Artifact Armor Bonus. All Artifact Body Armors
 * now use `artifactArmorBonusForLevel(weight, level)` instead.
 */
export function bodyArmorBonusForLevel(level: number): number {
  return artifactArmorBonusForLevel('light', level);
}

/** @deprecated Alias of Light Armor Artifact Evade (`artifactArmorEvadeForLevel('light', …)`). */
export function noArmorEvadeForLevel(level: number): number {
  return artifactArmorEvadeForLevel('light', level);
}

/** @deprecated Alias of Light Armor Artifact bonus. */
export function soulSigilArmorForLevel(level: number): number {
  return artifactArmorBonusForLevel('light', level);
}

/** @deprecated Alias of Light Armor Artifact total. */
export function soulSigilArmorTotalForLevel(level: number): number {
  return artifactArmorTotalForLevel('light', level);
}

/** Feet Evade (Elorian Stride). L1–2=+1, L3–4=+2, … L9–10=+5. */
export function feetEvadeForLevel(level: number): number {
  return Math.ceil(clampLevel(level) / 2);
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

/**
 * Canonical weapon damage for a standard one/two-handed (melee or ranged)
 * Artifact Weapon, derived live from its physical Base Profile + Artifact
 * level: 2d8 (one-handed) / 4d8 (two-handed) base + 1d8 per level.
 *
 * Returns `null` for non-weapon / custom / natural / Spell-Focus profiles
 * (base dice 0) so callers fall back to the value stored on the item. Deriving
 * live means existing artifacts always reflect the current rule even when their
 * baked `artifactWeapon.damage` predates the base-profile scaling fix.
 */
export function deriveArtifactWeaponDamage(profile: string | null | undefined, level: number): string | null {
  const base = baseProfileWeaponDice(profile);
  if (base <= 0) return null;
  return `${base + clampLevel(level)}d8`;
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
    case 'bodyArmor': {
      const weight =
        normalizeArtifactArmorWeight(profile) ||
        (profile === 'bodyArmor' || profile === 'robe' || profile === 'noArmorBody'
          ? 'light'
          : null);
      if (weight) {
        const total = artifactArmorTotalForLevel(weight, level);
        const bonus = artifactArmorBonusForLevel(weight, level);
        // data-derived must parse as the stored bonus; visible text is richer.
        return {
          display: String(bonus),
          label: `Armor ${total} (${weight[0]!.toUpperCase()}${weight.slice(1)})`,
          derivable: true,
        };
      }
      return { display: String(artifactArmorBonusForLevel('light', level)), derivable: true };
    }
    case 'headArmor':
      return { display: `+${minorArmorForLevel(level)} Armor`, derivable: true };
    case 'shieldValue':
      // Shield Value is per shield type (Parry +1 / Medium +4 / Tower +8); no
      // generic level scaling in the spec. Default to Medium; override allowed.
      return { display: '+4 Armor', derivable: true };
    case 'evade': {
      if (profile === 'feet') {
        return { display: `+${feetEvadeForLevel(level)} Evade`, derivable: true };
      }
      if (profile === 'headArmor') {
        return { display: `+${minorArmorForLevel(level)} Evade`, derivable: true };
      }
      const weight =
        normalizeArtifactArmorWeight(profile) ||
        (profile === 'bodyArmor' || profile === 'robe' || profile === 'noArmorBody'
          ? 'light'
          : null);
      if (weight) {
        const val = artifactArmorEvadeForLevel(weight, level);
        const signed = val > 0 ? `+${val}` : String(val);
        return { display: String(val), label: `${signed} Evade`, derivable: true };
      }
      const val = artifactArmorEvadeForLevel('light', level);
      const signed = val > 0 ? `+${val}` : String(val);
      return { display: signed + ' Evade', derivable: true };
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
