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
        removeAction: 'Meditation',
        dispellable: true,
        pricing: '8 × T(X)',
        startPP: 8
    },
    {
        id: 'challenge',
        name: 'Challenge(X)',
        category: 'diminishing',
        description: 'Challenge is bound to the creature that applied it (the challenger). Whenever you build an Attack Pool for an attack that does not include the challenger as a target, remove X dice from that pool, to a minimum of your Mastery Rank. If the attack includes the challenger, Challenge does not reduce the pool. Challenge never forces you to attack, move toward, or remain near the challenger. A creature can have only one challenger at a time: reapplying from the same challenger adds stacks; Challenge from a different source replaces the current value only if the new value is higher. At the start of your turn, Challenge decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Cleanse, or normal decay.',
        hasValue: true,
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
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
        dispellable: false,
        pricing: '3 × T(X)',
        startPP: 3
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
        removeAction: 'Athletics',
        dispellable: true,
        pricing: '4 × T(X)',
        startPP: 4
    },
    {
        id: 'exorcism',
        name: 'Exorcism(X)',
        category: 'diminishing',
        description: 'Can be applied only to a creature with the Fiend tag. At the start of the affected creature\'s turn, take X damage (ignores Armor unless a rule says otherwise), then reduce X by 1. Cleanse: Yes.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Cleanse.',
        hasValue: true,
        dispellable: true,
        pricing: '2 × T(X)',
        startPP: 2
    },
    {
        id: 'requiem',
        name: 'Requiem(X)',
        category: 'diminishing',
        description: 'Can be applied only to a creature with the Undead tag. At the start of the affected creature\'s turn, take X damage (ignores Armor unless a rule says otherwise), then reduce X by 1. Cleanse: Yes.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Cleanse.',
        hasValue: true,
        dispellable: true,
        pricing: '2 × T(X)',
        startPP: 2
    },
    {
        id: 'soulburn',
        name: 'Soulburn(X)',
        category: 'diminishing',
        description: 'Whenever you build a dice pool based on Wits, Influence, or Resolve, remove X dice from that pool. Soulburn reduces rolled dice pools only — never the Attribute itself, Keep, Damage Pools, Health, derived values, or resource maximums. Apply it with other flat pool changes before the percentage-based Health Penalty; the final pool cannot drop below your Mastery Rank. At the start of your turn, Soulburn decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Occultism Remove Action, or Cleanse.',
        hasValue: true,
        removeAction: 'Occultism',
        dispellable: true,
        pricing: '8 × T(X)',
        startPP: 8
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
        removeAction: 'Athletics',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
    },
    {
        id: 'weaken',
        name: 'Weaken(X)',
        category: 'diminishing',
        description: 'Whenever you build a dice pool based on Might, Agility, or Intellect, remove X dice from that pool. Weaken reduces rolled dice pools only — never the Attribute itself, Keep, Damage Pools, Health, derived values, or resource maximums. Apply it with other flat pool changes before the percentage-based Health Penalty; the final pool cannot drop below your Mastery Rank. At the start of your turn, Weaken decays by 1.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Medicine Remove Action, or Cleanse.',
        hasValue: true,
        removeAction: 'Medicine',
        dispellable: true,
        pricing: '8 × T(X)',
        startPP: 8
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
        description: 'Your Speed becomes 0 m. While Braced, your Shield value is doubled for Armor calculation. At the end of each of your turns, reduce Brace by 1; the effect ends when X reaches 0.',
        duration: 'Until X reaches 0',
        stacking: 'No',
        removal: 'Ends when X reaches 0 at the end of your turns.',
        hasValue: true,
        dispellable: false,
        pricing: '15 × X'
    },
    {
        id: 'prone',
        name: 'Prone',
        category: 'timed',
        description: 'You are knocked down. Standing up requires the normal Movement Action or Action cost and ends the effect.',
        duration: 'Until you stand',
        stacking: 'No',
        removal: 'Stand up (normal Movement Action or Action cost).',
        hasValue: false,
        dispellable: false,
        pricing: '60 PP'
    },
    {
        id: 'stunned',
        name: 'Stunned',
        category: 'timed',
        description: 'You lose your next Attack Action and cannot use Reactions until the start of your next turn. Stunned does not remove Movement.',
        duration: 'Until the start of your next turn',
        stacking: 'No',
        removal: 'Ends at the start of your next turn.',
        hasValue: false,
        dispellable: false,
        pricing: '120 PP'
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
        dispellable: false,
        pricing: '25 × X'
    },
    {
        id: 'immovable',
        name: 'Immovable',
        category: 'untilUsed',
        description: 'You are immune to Push, Pull, Prone, and forced movement while the effect lasts.',
        duration: 'Buff Duration',
        stacking: 'No',
        removal: 'Ends when the buff expires.',
        hasValue: false,
        dispellable: false,
        pricing: '80 PP'
    },
    {
        id: 'root',
        name: 'Root(X)',
        category: 'untilUsed',
        description: 'While Rooted, your Speed becomes 0 m and you cannot move voluntarily. At the start of your Turn, reduce Root by your Mastery Rank. You may also spend an Action, Movement Action, or Reaction on a Vitality Attribute Check against TN 8 × source Mastery Rank; success reduces Root by 1, plus 1 per Raise.',
        duration: 'Until broken',
        stacking: 'Yes',
        removal: 'Start-of-turn −MR, Break attempt (Vitality Attribute Check), or Cleanse.',
        hasValue: true,
        removeAction: 'Athletics',
        dispellable: true,
        pricing: '6 × T(X)',
        startPP: 6
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
        dispellable: false,
        pricing: '2 × X'
    },
    {
        id: 'disarm',
        name: 'Disarm',
        category: 'instant',
        description: 'On hit, the target loses grip on one visible held item; the item falls to the ground. Recovering it requires a Movement Action or an Action.',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves with the attack.',
        hasValue: false,
        dispellable: false,
        pricing: 'special'
    },
    {
        id: 'stun',
        name: 'Stun',
        category: 'instant',
        description: 'The target is Stunned: it loses its next Attack Action and cannot use Reactions until the start of its next turn. Alias of the Timed effect Stunned.',
        duration: 'Until the start of the target\'s next turn',
        stacking: 'No',
        removal: 'Ends at the start of the target\'s next turn.',
        hasValue: false,
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
        name: 'Cleanse(X)',
        category: 'support',
        description: 'Choose exactly one eligible ongoing Special on one target and reduce its current value by X. The Cleanse value cannot be divided between multiple Specials; any excess is lost. If X equals or exceeds the current value, the Special is removed. Cleanse can only reduce Specials that are dispellable, and does not remove battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, or Persistent Zones.',
        duration: 'Instant',
        stacking: 'No',
        removal: '—',
        hasValue: true,
        dispellable: false,
        pricing: '4 × T(X)'
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
    shock: 'disoriented',
    disrupt: 'challenge',
    disrupted: 'challenge',
};
/**
 * Special ids removed from the rules entirely (no canonical replacement).
 * The data migration deletes stored entries with these ids and logs them;
 * runtime code must never resolve them to an effect.
 */
export const REMOVED_SPECIAL_IDS = [
    'dread',
    'frightened',
    'disrupt',
    'shock'
];
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