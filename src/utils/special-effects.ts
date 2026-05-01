/**
 * Special Effects Reference for Mastery System
 *
 * All canonical Special Conditions and Effects that can appear during play.
 * Mirrors the SRD "Special Effect Cost Chapters" behaviour model:
 *   - diminishing   : decay X by 1 per round (X → 0)
 *   - timed         : fixed duration, refresh + keep higher X
 *   - untilUsed     : persist until consumed or internal counter reaches 0
 *   - instant       : resolve immediately, no tracking
 *   - support       : remove / reduce / end other effects
 *   - multiAttack   : structural multi-strike riders (Charged)
 *
 * Powers should store only the specialId and value, not the full name string.
 * Example: { specialId: "bleeding", value: 3 } instead of "Bleeding(3)"
 */

export type EffectCategory =
  | 'diminishing'
  | 'timed'
  | 'untilUsed'
  | 'instant'
  | 'support'
  | 'multiAttack';

export interface SpecialEffect {
  id: string; // Unique identifier (e.g., "bleeding", "ignite", "freeze")
  name: string; // Display name (e.g., "Bleeding(X)")
  category: EffectCategory;
  description: string;
  duration: string; // e.g., "Diminishing (X→0)", "Mastery Rank Rounds + X", "1 Round", "Until used"
  stacking: 'Yes' | 'No' | 'Additive';
  removal: string; // How to end/remove the effect
  hasValue: boolean; // Whether the effect has a numeric value (X)
  /** Optional saving throw type: 'Body' | 'Mind' | 'Spirit' | combinations, or '—' */
  save?: string;
  /** Optional dedicated Remove Action skill (e.g. 'Medicine', 'Athletics', 'Meditation', 'Crafting') */
  removeAction?: string;
  /** Whether Cleanse / Dispel Magic can remove/reduce this effect */
  dispellable?: boolean;
  /** PP pricing formula as a compact reference (Start PP for diminishing, base formula otherwise) */
  pricing?: string;
  /** Starting PP for diminishing effects — used with T(X) = X*(X+1)/2 */
  startPP?: number;
  /** True if the effect uses the Charged tag by default (multi-attack riders) */
  charged?: boolean;
}

/**
 * Special Effect Reference (what Powers should store)
 */
export interface SpecialEffectReference {
  specialId: string; // Reference to SpecialEffect.id
  value?: number; // The X value (optional, only if hasValue is true)
}

/**
 * Display label without (X) suffix (e.g. "Bleeding(X)" → "Bleeding")
 */
export function getEffectBaseName(name: string): string {
  return name.replace(/\(X\)/gi, '').trim();
}

/**
 * Helper function to generate ID from name
 */
function generateId(name: string): string {
  return getEffectBaseName(name).toLowerCase().replace(/\s+/g, '-');
}

/**
 * Diminishing Effects — decay X by 1 per round at start of affected creature's turn.
 * Pricing: PP = startPP × T(X), with T(X) = X*(X+1)/2.
 */
export const DIMINISHING_EFFECTS: SpecialEffect[] = [
  {
    id: 'bleeding',
    name: 'Bleeding(X)',
    category: 'diminishing',
    description:
      'The first time each turn you move more than 0 m, take X damage. If you move more than half your Speed that turn, take +X damage again. If you Sprint / Dash / otherwise exceed your normal Speed, take +X damage again.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Medicine Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Medicine',
    dispellable: true,
    pricing: '4 × T(X)',
    startPP: 4
  },
  {
    id: 'corrode',
    name: 'Corrode(X)',
    category: 'diminishing',
    description: 'Your Armor is reduced by X.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Crafting Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Crafting',
    dispellable: true,
    pricing: '6 × T(X)',
    startPP: 6
  },
  {
    id: 'expose',
    name: 'Expose(X)',
    category: 'diminishing',
    description: 'Suffer −X Evade.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Athletics Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Athletics',
    dispellable: true,
    pricing: '8 × T(X)',
    startPP: 8
  },
  {
    id: 'freeze',
    name: 'Freeze(X)',
    category: 'diminishing',
    description:
      'Your Speed is reduced by X m. At Tick, take ceil(X/2) cold damage.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Athletics Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Athletics',
    dispellable: true,
    pricing: '4 × T(X)',
    startPP: 4
  },
  {
    id: 'ignite',
    name: 'Ignite(X)',
    category: 'diminishing',
    description: 'At Tick, take X fire damage.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Medicine Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Medicine',
    dispellable: true,
    pricing: '4 × T(X)',
    startPP: 4
  },
  {
    id: 'mark',
    name: 'Mark(X)',
    category: 'diminishing',
    description:
      'Suffer −X dice on attacks unless attacking the creature that applied the Mark. The effect ends immediately after you make an attack against that creature.',
    duration: 'Diminishing (X→0); ends on attack vs. marker',
    stacking: 'Yes',
    removal: 'Mind Save (end of turn), Concealment Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Mind',
    removeAction: 'Concealment',
    dispellable: true,
    pricing: '4 × T(X)',
    startPP: 4
  },
  {
    id: 'poisoned',
    name: 'Poisoned(X)',
    category: 'diminishing',
    description:
      'Healing you receive is reduced by X. At Tick, take X stress (this stress ignores Stress Armor).',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Medicine Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Medicine',
    dispellable: true,
    pricing: '3 × T(X)',
    startPP: 3
  },
  {
    id: 'regeneration',
    name: 'Regeneration(X)',
    category: 'diminishing',
    description: 'At Tick, heal X HP.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: '—',
    hasValue: true,
    save: '—',
    dispellable: true,
    pricing: '3 × T(X)',
    startPP: 3
  },
  {
    id: 'shock',
    name: 'Shock(X)',
    category: 'diminishing',
    description:
      'Lose X dice from your next attack pool. After that attack is resolved, Shock ends immediately.',
    duration: 'Diminishing (X→0); ends after next attack',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Athletics Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Athletics',
    dispellable: true,
    pricing: '6 × T(X)',
    startPP: 6
  },
  {
    id: 'soulburn',
    name: 'Soulburn(X)',
    category: 'diminishing',
    description: 'Suffer −X dice to Body, Mind, and Spirit Saves.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Spirit Save (end of turn), Occultism Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Spirit',
    removeAction: 'Occultism',
    dispellable: true,
    pricing: '6 × T(X)',
    startPP: 6
  },
  {
    id: 'weaken',
    name: 'Weaken(X)',
    category: 'diminishing',
    description:
      'Choose one when applied: Body, Mind, or Spirit. Suffer −X dice to that Save type.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Spirit Save (end of turn), Medicine Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Spirit',
    removeAction: 'Medicine',
    dispellable: true,
    pricing: '5 × T(X)',
    startPP: 5
  },
  {
    id: 'hex',
    name: 'Hex(X)',
    category: 'diminishing',
    description: 'When hit by a Spell, take +Xd8 bonus damage.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Mind Save (end of turn), Meditation Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Mind',
    removeAction: 'Meditation',
    dispellable: true,
    pricing: '6 × T(X)',
    startPP: 6
  },
  {
    id: 'sundered',
    name: 'Sundered(X)',
    category: 'diminishing',
    description: 'When hit by a non-Spell attack, take +Xd8 bonus damage.',
    duration: 'Diminishing (X→0)',
    stacking: 'Yes',
    removal: 'Body Save (end of turn), Athletics Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Athletics',
    dispellable: true,
    pricing: '6 × T(X)',
    startPP: 6
  },
  {
    id: 'root',
    name: 'Root(X)',
    category: 'diminishing',
    description:
      'Your Speed becomes 0 m. You may spend an Attack Action on your turn to make a Break Strength check (TN = 8 × X) — on a success, Root ends; otherwise, Root persists. Diminishing: at the end of each round, X decreases by 1.',
    duration: 'Diminishing (X→0)',
    stacking: 'No',
    removal:
      'Body Save (end of turn), Break Strength check (TN = 8 × X) on your turn, Athletics Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body',
    removeAction: 'Athletics',
    dispellable: true,
    pricing: '6 × T(X)',
    startPP: 6
  }
];

/**
 * Timed Effects — fixed duration, refresh on reapply, keep higher X.
 */
export const TIMED_EFFECTS: SpecialEffect[] = [
  {
    id: 'blinded',
    name: 'Blinded(X)',
    category: 'timed',
    description:
      'You cannot see. You automatically fail sight-based checks, and suffer −X Attack Dice on sight-based attacks.',
    duration: 'Mastery Rank Rounds + X',
    stacking: 'No',
    removal: 'Body or Spirit Save, Medicine Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Body / Spirit',
    removeAction: 'Medicine',
    dispellable: true,
    pricing: '15 × X'
  },
  {
    id: 'frightened',
    name: 'Frightened(X)',
    category: 'timed',
    description:
      'You cannot willingly move closer to the source of your fear. If already adjacent, you must move away, hold position, or spend your Attack Action to steady yourself. While Frightened, suffer −X dice on attacks against the source.',
    duration: 'Mastery Rank Rounds',
    stacking: 'No',
    removal: 'Mind Save, Leadership Remove Action, or Cleanse.',
    hasValue: true,
    save: 'Mind',
    removeAction: 'Leadership',
    dispellable: true,
    pricing: '15 × X'
  },
  {
    id: 'brace',
    name: 'Brace(X)',
    category: 'timed',
    description:
      'Your Speed becomes 0 m. While Braced, your Shield value is doubled for Armor calculation. Brace is Timed (Mastery Rank rounds + X) and ends early if you move, drop your shield, or are knocked Prone.',
    duration: 'Mastery Rank Rounds + X',
    stacking: 'No',
    removal: 'Ends when the duration expires, you move, drop your shield, or are knocked Prone.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '15 × X'
  },
  {
    id: 'prone',
    name: 'Prone(X)',
    category: 'timed',
    description:
      'You are knocked down; attacks against you gain +X Attack Dice. Standing up ends the effect.',
    duration: '1 Round',
    stacking: 'No',
    removal: 'Spend 1 Attack Action to stand up (you may still move normally).',
    hasValue: true,
    save: 'Body',
    dispellable: false,
    pricing: '20 × X'
  },
  {
    id: 'stunned',
    name: 'Stunned(X)',
    category: 'timed',
    description: 'Lose X Attack Actions this turn.',
    duration: '1 Round',
    stacking: 'No',
    removal: 'Body Save negates on apply.',
    hasValue: true,
    save: 'Body',
    dispellable: false,
    pricing: '45 × X'
  }
];

/**
 * Until Broken / Until Used Effects — persist until consumed or internal counter reaches 0.
 */
export const UNTIL_USED_EFFECTS: SpecialEffect[] = [
  {
    id: 'bulwark',
    name: 'Bulwark(X)',
    category: 'untilUsed',
    description:
      'As a Reaction when hit by an attack you can perceive, reduce the attack\'s final damage by 50% and consume 1 Bulwark.',
    duration: 'Until used (charges)',
    stacking: 'Yes',
    removal: 'Charges end when X reaches 0.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '20 × X'
  },
  {
    id: 'crit',
    name: 'Crit(X)',
    category: 'untilUsed',
    description: 'For your next X attack rolls, all dice explode on 7–8.',
    duration: 'Until used',
    stacking: 'No',
    removal: 'Consumed as the affected attacks are made.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '25 × X'
  },
  {
    id: 'immovable',
    name: 'Immovable',
    category: 'untilUsed',
    description: 'You are immune to Push and Prone while the effect lasts.',
    duration: 'Buff Duration',
    stacking: 'No',
    removal: 'Ends when the buff expires.',
    hasValue: false,
    save: '—',
    dispellable: false,
    pricing: '20 PP'
  }
];

/**
 * Instant Effects — resolve immediately, no ongoing tracking.
 */
export const INSTANT_EFFECTS: SpecialEffect[] = [
  {
    id: 'brutal-impact',
    name: 'Brutal Impact(X)',
    category: 'instant',
    description: 'Each damage die rolled counts as at least X.',
    duration: 'Instant',
    stacking: 'No',
    removal: 'Resolves with the attack.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '10 × X'
  },
  {
    id: 'knockback',
    name: 'Knockback(X)',
    category: 'instant',
    description: 'The target is knocked back X meters immediately.',
    duration: 'Instant',
    stacking: 'No',
    removal: 'Resolves immediately.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '2 × X'
  },
  {
    id: 'penetration',
    name: 'Penetration(X)',
    category: 'instant',
    description: 'The attack ignores X Armor.',
    duration: 'Instant',
    stacking: 'No',
    removal: 'Resolves with the attack.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '7.5 × X'
  },
  {
    id: 'precision',
    name: 'Precision(X)',
    category: 'instant',
    description: 'On hit, add +Xd8 bonus damage.',
    duration: 'Instant',
    stacking: 'No',
    removal: 'Resolves with the attack.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '15 × X'
  },
  {
    id: 'pull',
    name: 'Pull(X)',
    category: 'instant',
    description: 'Pull the target X m immediately.',
    duration: 'Instant',
    stacking: 'No',
    removal: 'Resolves immediately.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '2 × X'
  },
  {
    id: 'push',
    name: 'Push(X)',
    category: 'instant',
    description: 'Push the target X m immediately.',
    duration: 'Instant',
    stacking: 'No',
    removal: 'Resolves immediately.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '2 × X'
  },
  {
    id: 'disarm',
    name: 'Disarm',
    category: 'instant',
    description:
      "Force the target to drop one held item. The item lands at the target's feet (or up to X meters away if the Power scales the throw distance). The target may pick it up next turn for a Movement action.",
    duration: 'Instant',
    stacking: 'No',
    removal: 'Body Save negates on apply.',
    hasValue: false,
    save: 'Body',
    dispellable: false,
    pricing: 'special'
  },
  {
    id: 'smite',
    name: 'Smite(X)',
    category: 'instant',
    description: 'Add +Xd8 bonus damage vs. Undead / Fiends.',
    duration: 'Instant',
    stacking: 'Yes',
    removal: 'Resolves with the attack.',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '7.5 × X'
  },
  {
    id: 'stun',
    name: 'Stun',
    category: 'instant',
    description:
      'The target is Stunned for 1 Round (loses 1 Attack Action). For scaling Stun use the Timed effect Stunned(X) instead.',
    duration: '1 Round',
    stacking: 'No',
    removal: 'Body Save negates on apply.',
    hasValue: false,
    save: 'Body',
    dispellable: false,
    pricing: 'special'
  }
];

/**
 * Support / Removal Effects — remove, reduce, or end ongoing effects.
 */
export const SUPPORT_EFFECTS: SpecialEffect[] = [
  {
    id: 'cleanse',
    name: 'Cleanse',
    category: 'support',
    description:
      'Reduce a single eligible ongoing effect on one target by 4 (X → X−4, minimum 0). Stacks per cast: a Power may explicitly buy multiple cleanses, but each one targets a different ongoing effect (or the same effect on a different creature).',
    duration: 'Instant',
    stacking: 'No',
    removal: '—',
    hasValue: false,
    save: '—',
    dispellable: false,
    pricing: '15 PP per cleanse'
  },
  {
    id: 'dispel-magic',
    name: 'Dispel Magic',
    category: 'support',
    description: 'End one ongoing effect with the Spell tag immediately.',
    duration: 'Instant',
    stacking: 'No',
    removal: '—',
    hasValue: false,
    save: '—',
    dispellable: false,
    pricing: 'special / spell-specific'
  }
];

/**
 * Multi-Attack Structures — structural Charged riders that create additional strikes.
 */
export const MULTI_ATTACK_EFFECTS: SpecialEffect[] = [
  // NOTE: `Autofire` and `Split-Attack` are attack *modes*, not Specials.
  // They are declared via `mechanics.autofire` / `mechanics.splitAttack` on
  // the power itself and must NOT appear as selectable Raise-Specials in the
  // damage dialog. Previously listed here — removed in v0.5.9.
  {
    id: 'extra-attack',
    name: 'Extra Attack',
    category: 'multiAttack',
    description:
      'Make 1 additional full attack after your first attack. Bought bonus damage and Specials are divided across all attacks unless explicitly priced otherwise.',
    duration: 'Instant',
    stacking: 'No',
    removal: '—',
    hasValue: true,
    save: '—',
    dispellable: false,
    pricing: '30 × L PP (L = Power Level 1–4)',
    charged: true
  }
];

/**
 * All special effects combined
 */
export const ALL_SPECIAL_EFFECTS: SpecialEffect[] = [
  ...DIMINISHING_EFFECTS,
  ...TIMED_EFFECTS,
  ...UNTIL_USED_EFFECTS,
  ...INSTANT_EFFECTS,
  ...SUPPORT_EFFECTS,
  ...MULTI_ATTACK_EFFECTS
];

/**
 * Map of all special effects by ID for quick lookup
 */
export const SPECIAL_EFFECTS_BY_ID: Map<string, SpecialEffect> = new Map(
  ALL_SPECIAL_EFFECTS.map(effect => [effect.id, effect])
);

/**
 * Get all effects by category
 */
export function getEffectsByCategory(category: EffectCategory): SpecialEffect[] {
  return ALL_SPECIAL_EFFECTS.filter(effect => effect.category === category);
}

/**
 * Get an effect by ID (preferred method)
 */
export function getEffectById(id: string): SpecialEffect | undefined {
  return SPECIAL_EFFECTS_BY_ID.get(id);
}

/**
 * Get an effect by name (legacy support)
 */
export function getEffect(name: string): SpecialEffect | undefined {
  const id = generateId(name);
  const byId = getEffectById(id);
  if (byId) return byId;

  return ALL_SPECIAL_EFFECTS.find(effect =>
    effect.name.toLowerCase().replace(/\(x\)/gi, '').trim() ===
    name.toLowerCase().replace(/\(x\)/gi, '').trim()
  );
}

/**
 * Format a SpecialEffectReference to display string (e.g., { specialId: "bleeding", value: 3 } -> "Bleeding(3)")
 */
export function formatEffectReference(ref: SpecialEffectReference): string {
  const effect = getEffectById(ref.specialId);
  if (!effect) {
    return ref.value !== undefined ? `${ref.specialId}(${ref.value})` : ref.specialId;
  }

  if (effect.hasValue && ref.value !== undefined) {
    return `${getEffectBaseName(effect.name)}(${ref.value})`;
  }
  return getEffectBaseName(effect.name);
}

/**
 * Parse effect string to SpecialEffectReference (e.g., "Bleeding(3)" -> { specialId: "bleeding", value: 3 })
 */
export function parseEffectString(effectString: string): SpecialEffectReference | null {
  const match = effectString.match(/^([^(]+)(?:\((\d+)\))?$/);
  if (!match) return null;

  const name = match[1].trim();
  const value = match[2] ? parseInt(match[2], 10) : undefined;

  const effect = getEffect(name);
  if (!effect) return null;

  return {
    specialId: effect.id,
    value: value
  };
}

/**
 * Parse effect value from effect string (e.g., "Bleeding(3)" -> 3) - legacy function
 */
export function parseEffectValue(effectString: string): number | null {
  const match = effectString.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Format effect with value (e.g., "Bleeding", 3 -> "Bleeding(3)") - legacy function
 */
export function formatEffectWithValue(effectName: string, value: number): string {
  const baseName = effectName.replace(/\(.*?\)/g, '').trim();
  return `${baseName}(${value})`;
}

/**
 * Convert array of SpecialEffectReference to array of display strings
 */
export function formatEffectReferences(refs: SpecialEffectReference[]): string[] {
  return refs.map(ref => formatEffectReference(ref));
}

/**
 * Convert array of effect strings to array of SpecialEffectReference
 */
export function parseEffectStrings(effectStrings: string[]): SpecialEffectReference[] {
  return effectStrings
    .map(str => parseEffectString(str))
    .filter((ref): ref is SpecialEffectReference => ref !== null);
}
