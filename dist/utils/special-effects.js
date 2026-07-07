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
 * Example: { specialId: "lacerate", value: 3 } instead of "Lacerate(3)"
 */
/**
 * Display label without (X) suffix (e.g. "Lacerate(X)" → "Lacerate")
 */
export function getEffectBaseName(name) {
    return name.replace(/\(X\)/gi, '').trim();
}
/**
 * Helper function to generate ID from name
 */
function generateId(name) {
    return getEffectBaseName(name).toLowerCase().replace(/\s+/g, '-');
}
/**
 * Diminishing Effects — decay X by 1 per round at start of affected creature's turn.
 * Pricing: PP = startPP × T(X), with T(X) = X*(X+1)/2.
 */
export const DIMINISHING_EFFECTS = [
    {
        id: 'blight',
        name: 'Blight(X)',
        category: 'diminishing',
        description: 'While affected by Blight, all healing you receive is reduced by X. At Tick, take X Stress. At the start of your turn, after the Tick, Blight decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Medicine Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Medicine',
        dispellable: true,
        pricing: '3 × T(X)',
        startPP: 3
    },
    {
        id: 'corrode',
        name: 'Corrode(X)',
        category: 'diminishing',
        description: 'Your Armor is reduced by X. At the start of your turn, Corrode decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Crafting Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Crafting',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
    },
    {
        id: 'disoriented',
        name: 'Disoriented(X)',
        category: 'diminishing',
        description: 'Your Attack Dice are reduced by X, to a minimum of your Mastery Rank. All dice pools used to notice, locate, track, or identify something are also reduced by X, to a minimum of your Mastery Rank. At the start of your turn, Disoriented decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Meditation Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Meditation',
        dispellable: true,
        pricing: '4 × T(X)',
        startPP: 4
    },
    {
        id: 'disrupt',
        name: 'Disrupt(X)',
        category: 'diminishing',
        description: 'When you use a Power, reduce Disrupt by X. If you cannot reduce Disrupt by the required amount, the Power fails and the action is lost. At the start of your turn, Disrupt decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Meditation Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Meditation',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
    },
    {
        id: 'dread',
        name: 'Dread(X)',
        category: 'diminishing',
        description: 'When Dread is applied, the Power states which Save is used: Body, Mind, or Spirit. Before you make an attack, make the listed Save with its DC increased by X. On a failure, the attack is lost. At the start of your turn, Dread decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Leadership Remove Action, or Cleanse.',
        hasValue: true,
        save: 'Body / Mind / Spirit',
        removeAction: 'Leadership',
        dispellable: true,
        pricing: '5 × T(X)',
        startPP: 5
    },
    {
        id: 'expose',
        name: 'Expose(X)',
        category: 'diminishing',
        description: 'Your Evade is reduced by X. At the start of your turn, Expose decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Athletics Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Athletics',
        dispellable: true,
        pricing: '8 × T(X)',
        startPP: 8
    },
    {
        id: 'hex',
        name: 'Hex(X)',
        category: 'diminishing',
        description: 'When you are hit by a Spell, take +1d8 bonus damage for every 2 Hex, rounded up. At the start of your turn, Hex decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Meditation Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Meditation',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
    },
    {
        id: 'lacerate',
        name: 'Lacerate(X)',
        category: 'diminishing',
        description: 'Lacerate punishes movement. The first time each turn you voluntarily move more than 0 m, take X damage. If you voluntarily move more than half your Speed that turn, take +X damage again. If you Dash / Sprint / otherwise voluntarily exceed your normal Speed, take +X damage again. Forced movement does not trigger Lacerate unless a Power explicitly says otherwise.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Medicine Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Medicine',
        dispellable: true,
        pricing: '4 × T(X)',
        startPP: 4
    },
    {
        id: 'mark',
        name: 'Mark(X)',
        category: 'diminishing',
        description: 'When a creature hits a target affected by Mark, it may spend any amount of Mark from that target before final damage is applied. The amount spent becomes the Damage Floor for that damage roll: each damage die that rolled lower than the spent value is treated as if it had rolled that value. After the roll is adjusted, reduce Mark by the amount spent. At the start of your turn, Mark decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Concealment Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Concealment',
        dispellable: true,
        pricing: '4 × T(X)',
        startPP: 4
    },
    {
        id: 'regeneration',
        name: 'Regeneration(X)',
        category: 'diminishing',
        description: 'At Tick, heal X HP. Regeneration cannot restore lost Health Levels unless a rule says otherwise. At the start of your turn, after the Tick, Regeneration decays by 1. Regeneration is a positive effect and cannot be removed by Cleanse.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: '—',
        hasValue: true,
        save: '—',
        dispellable: false,
        pricing: '3 × T(X)',
        startPP: 3
    },
    {
        id: 'root',
        name: 'Root(X)',
        category: 'diminishing',
        description: 'Root can only be applied with a minimum value of Root(2). While Rooted, your Speed is reduced to 0 m and you cannot move voluntarily. Root does not prevent attacking, casting, using Reactions, other non-movement actions, or being moved by forced movement. At the start of your turn, Root decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Athletics Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Athletics',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
    },
    {
        id: 'ruin',
        name: 'Ruin(X)',
        category: 'diminishing',
        description: 'At Tick, take X damage. Ruin damage ignores Armor unless a rule says otherwise. At the start of your turn, after the Tick, Ruin decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Medicine Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Medicine',
        dispellable: true,
        pricing: '4 × T(X)',
        startPP: 4
    },
    {
        id: 'slow',
        name: 'Slow(X)',
        category: 'diminishing',
        description: 'Your Speed is reduced by X m. If you do not voluntarily move at least 1 m during your turn, take X damage at the end of your turn. At the start of your turn, Slow decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Athletics Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Athletics',
        dispellable: true,
        pricing: '4 × T(X)',
        startPP: 4
    },
    {
        id: 'soulburn',
        name: 'Soulburn(X)',
        category: 'diminishing',
        description: 'Suffer −X dice to Body, Mind, and Spirit Saves, to a minimum of your Mastery Rank. At the start of your turn, Soulburn decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Occultism Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Occultism',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
    },
    {
        id: 'sundered',
        name: 'Sundered(X)',
        category: 'diminishing',
        description: 'When you are hit by a non-Spell attack, take +1d8 bonus damage for every 2 Sundered, rounded up. At the start of your turn, Sundered decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Athletics Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Athletics',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
    },
    {
        id: 'weaken',
        name: 'Weaken(X)',
        category: 'diminishing',
        description: 'Choose one when applied: Body, Mind, or Spirit. Suffer −X dice to that Save type, to a minimum of your Mastery Rank. At the start of your turn, Weaken decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Medicine Remove Action, or Cleanse.',
        hasValue: true,
        save: '—',
        removeAction: 'Medicine',
        dispellable: true,
        pricing: '5 × T(X)',
        startPP: 5
    }
];
/**
 * Timed Effects — fixed duration, refresh on reapply, keep higher X.
 */
export const TIMED_EFFECTS = [
    {
        id: 'brace',
        name: 'Brace(X)',
        category: 'timed',
        description: 'Your Speed becomes 0 m. While Braced, your Shield value is doubled for Armor calculation. Brace is Timed (Mastery Rank rounds + X) and ends early if you move, drop your shield, or are knocked Prone.',
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
        description: 'You are knocked down; attacks against you gain +X Attack Dice. Standing up ends the effect.',
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
export const UNTIL_USED_EFFECTS = [
    {
        id: 'bulwark',
        name: 'Bulwark(X)',
        category: 'untilUsed',
        description: 'As a Reaction when hit by an attack you can perceive, reduce the attack\'s final damage by 50% and consume 1 Bulwark.',
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
export const INSTANT_EFFECTS = [
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
        description: "Force the target to drop one held item. The item lands at the target's feet (or up to X meters away if the Power scales the throw distance). The target may pick it up next turn for a Movement action.",
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
        description: 'The target is Stunned for 1 Round (loses 1 Attack Action). For scaling Stun use the Timed effect Stunned(X) instead.',
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
export const SUPPORT_EFFECTS = [
    {
        id: 'cleanse',
        name: 'Cleanse',
        category: 'support',
        description: 'Reduce a single eligible ongoing effect on one target by 4 (X → X−4, minimum 0). Stacks per cast: a Power may explicitly buy multiple cleanses, but each one targets a different ongoing effect (or the same effect on a different creature).',
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
export const MULTI_ATTACK_EFFECTS = [
    // NOTE: `Autofire` and `Split-Attack` are attack *modes*, not Specials.
    // They are declared via `mechanics.autofire` / `mechanics.splitAttack` on
    // the power itself and must NOT appear as selectable Raise-Specials in the
    // damage dialog. Previously listed here — removed in v0.5.9.
    {
        id: 'extra-attack',
        name: 'Extra Attack',
        category: 'multiAttack',
        description: 'Make 1 additional full attack after your first attack. Bought bonus damage and Specials are divided across all attacks unless explicitly priced otherwise.',
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
export const ALL_SPECIAL_EFFECTS = [
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
export const SPECIAL_EFFECTS_BY_ID = new Map(ALL_SPECIAL_EFFECTS.map(effect => [effect.id, effect]));
/**
 * Get all effects by category
 */
export function getEffectsByCategory(category) {
    return ALL_SPECIAL_EFFECTS.filter(effect => effect.category === category);
}
/**
 * Legacy special-effect id aliases (pre-reconciliation → canonical).
 * Kept so un-migrated actor/item data still resolves to the correct effect.
 * The data migration rewrites stored ids to the canonical form.
 */
export const LEGACY_SPECIAL_ID_ALIASES = {
    bleeding: 'lacerate',
    ignite: 'ruin',
    freeze: 'slow',
    poisoned: 'blight',
    blinded: 'disoriented',
    frightened: 'dread',
    shock: 'disrupt'
};
/** Resolve a possibly-legacy special id to its canonical id. */
export function canonicalSpecialId(id) {
    return LEGACY_SPECIAL_ID_ALIASES[id] ?? id;
}
/**
 * Get an effect by ID (preferred method). Resolves legacy aliases.
 */
export function getEffectById(id) {
    const direct = SPECIAL_EFFECTS_BY_ID.get(id);
    if (direct)
        return direct;
    const alias = LEGACY_SPECIAL_ID_ALIASES[id];
    return alias ? SPECIAL_EFFECTS_BY_ID.get(alias) : undefined;
}
/**
 * Get an effect by name (legacy support)
 */
export function getEffect(name) {
    const id = generateId(name);
    const byId = getEffectById(id);
    if (byId)
        return byId;
    return ALL_SPECIAL_EFFECTS.find(effect => effect.name.toLowerCase().replace(/\(x\)/gi, '').trim() ===
        name.toLowerCase().replace(/\(x\)/gi, '').trim());
}
/**
 * Format a SpecialEffectReference to display string (e.g., { specialId: "lacerate", value: 3 } -> "Lacerate(3)")
 */
export function formatEffectReference(ref) {
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
 * Parse effect string to SpecialEffectReference (e.g., "Lacerate(3)" -> { specialId: "lacerate", value: 3 })
 */
export function parseEffectString(effectString) {
    const match = effectString.match(/^([^(]+)(?:\((\d+)\))?$/);
    if (!match)
        return null;
    const name = match[1].trim();
    const value = match[2] ? parseInt(match[2], 10) : undefined;
    const effect = getEffect(name);
    if (!effect)
        return null;
    return {
        specialId: effect.id,
        value: value
    };
}
/**
 * Parse effect value from effect string (e.g., "Lacerate(3)" -> 3) - legacy function
 */
export function parseEffectValue(effectString) {
    const match = effectString.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
}
/**
 * Format effect with value (e.g., "Lacerate", 3 -> "Lacerate(3)") - legacy function
 */
export function formatEffectWithValue(effectName, value) {
    const baseName = effectName.replace(/\(.*?\)/g, '').trim();
    return `${baseName}(${value})`;
}
/**
 * Convert array of SpecialEffectReference to array of display strings
 */
export function formatEffectReferences(refs) {
    return refs.map(ref => formatEffectReference(ref));
}
/**
 * Convert array of effect strings to array of SpecialEffectReference
 */
export function parseEffectStrings(effectStrings) {
    return effectStrings
        .map(str => parseEffectString(str))
        .filter((ref) => ref !== null);
}
//# sourceMappingURL=special-effects.js.map