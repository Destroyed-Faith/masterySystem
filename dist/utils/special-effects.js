/**
 * Special Effects Reference for Mastery System
 *
 * All Special Conditions, Effects, and ongoing statuses that can appear during play.
 * Each entry lists what it does, how long it lasts, how it stacks, and how it can be removed.
 *
 * Powers should store only the specialId and value, not the full name string.
 * Example: { specialId: "bleeding", value: 3 } instead of "Bleeding(3)"
 */
/**
 * Helper function to get the base name without (X) suffix
 */
function getBaseName(name) {
    return name.replace(/\(X\)/gi, '').trim();
}
/**
 * Helper function to generate ID from name
 */
function generateId(name) {
    return getBaseName(name).toLowerCase().replace(/\s+/g, '-');
}
/**
 * Physical Effects
 */
export const PHYSICAL_EFFECTS = [
    {
        id: 'bleeding',
        name: 'Bleeding(X)',
        category: 'physical',
        description: 'Take damage equal to X at the start of your turn. The value decreases by 1 each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Medicine Check (TN 15 + damage) or spend 1 Attack Action to stabilize.',
        hasValue: true
    },
    {
        id: 'blinded',
        name: 'Blinded(X)',
        category: 'physical',
        description: 'You cannot see, automatically fail vision checks, and suffer −X Attack Dice on all sight-based attacks. At X ≥ 3, you cannot target creatures beyond 2 m and effectively fight in darkness.',
        duration: 'Mastery Rank Rounds + X',
        stacking: 'No',
        removal: 'Ends on a Body or Spirit Save at the end of your turn, through Cleanse(1), or by exposure to bright light.',
        hasValue: true
    },
    {
        id: 'corrode',
        name: 'Corrode(X)',
        category: 'physical',
        description: 'Your Armor is reduced by X; protection restores gradually.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Attack Action to scrape off corrosion or use Cleanse(1).',
        hasValue: true
    },
    {
        id: 'freeze',
        name: 'Freeze(X)',
        category: 'physical',
        description: 'Movement reduced by X m, take Xd8 flat damage once.',
        duration: 'Until broken',
        stacking: 'No',
        removal: 'Body Save or 1 Attack Action to break free; Fire ends instantly.',
        hasValue: true
    },
    {
        id: 'grappled',
        name: 'Grappled(X)',
        category: 'physical',
        description: 'You are restrained; Speed 0, grappler gains +X dice on control rolls.',
        duration: 'Until broken',
        stacking: 'No',
        removal: 'Body Save to escape or until grappler releases you.',
        hasValue: true
    },
    {
        id: 'ignite',
        name: 'Ignite(X)',
        category: 'physical',
        description: 'Take X fire damage each round; intensity fades as flames die.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Attack Action or Drop Prone to extinguish; Rain ends instantly.',
        hasValue: true
    },
    {
        id: 'poisoned',
        name: 'Poisoned(X)',
        category: 'physical',
        description: 'You have Disadvantage on attacks and checks; fades over time.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Full Action to purge toxins or use an Antidote.',
        hasValue: true
    },
    {
        id: 'prone',
        name: 'Prone(X)',
        category: 'physical',
        description: 'You are knocked down; attacks against you gain +X Attack Dice.',
        duration: '1 Round',
        stacking: 'No',
        removal: 'Spend 1 Attack Action to stand up (you may still move normally).',
        hasValue: true
    },
    {
        id: 'push',
        name: 'Push(X)',
        category: 'physical',
        description: 'You are pushed X m backward by force.',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves immediately.',
        hasValue: true
    },
    {
        id: 'regeneration',
        name: 'Regeneration(X)',
        category: 'physical',
        description: 'Heal X HP at end of your turn. Value decreases by 1 each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Ends if you take Fire or Necrotic damage.',
        hasValue: true
    },
    {
        id: 'shock',
        name: 'Shock(X)',
        category: 'physical',
        description: 'Lose X dice from your next attack pool; fades each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Attack Action to re-steady or succeed on Body Save.',
        hasValue: true
    },
    {
        id: 'stunned',
        name: 'Stunned(X)',
        category: 'physical',
        description: 'Lose X Attack Actions this turn; may still move or use non-attack abilities.',
        duration: '1 Round',
        stacking: 'No',
        removal: 'Ends at end of next turn or on Body/Mind Save.',
        hasValue: true
    }
];
/**
 * Mental Effects
 */
export const MENTAL_EFFECTS = [
    {
        id: 'charmed',
        name: 'Charmed(X)',
        category: 'mental',
        description: 'On failed Mind Save −X, cannot attack the charmer or their allies.',
        duration: 'Mastery Rank Rounds',
        stacking: 'No',
        removal: 'Ends on Save, Cleanse, or Dispel Magic.',
        hasValue: true
    },
    {
        id: 'curse',
        name: 'Curse(X)',
        category: 'mental',
        description: 'Suffer −X to all attack rolls; weakens each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Full Action in Prayer or receive a Cleanse Spell.',
        hasValue: true
    },
    {
        id: 'disoriented',
        name: 'Disoriented(X)',
        category: 'mental',
        description: 'Suffer −X dice on Mind/Spirit Saves while affected.',
        duration: 'Mastery Rank Rounds',
        stacking: 'No',
        removal: 'Ends automatically or on Mind Save.',
        hasValue: true
    },
    {
        id: 'frightened',
        name: 'Frightened(X)',
        category: 'mental',
        description: 'On failed Mind Save −X, must flee or avoid the source.',
        duration: 'Mastery Rank Rounds',
        stacking: 'No',
        removal: 'Ends on Save or when the source is gone.',
        hasValue: true
    },
    {
        id: 'mark',
        name: 'Mark(X)',
        category: 'mental',
        description: 'Suffer −X dice on attacks unless attacking the one who marked you.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Ends automatically after attacking the marker once.',
        hasValue: true
    },
    {
        id: 'soulburn',
        name: 'Soulburn(X)',
        category: 'mental',
        description: 'Take −X to Body, Mind, and Spirit Saves; weakens each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Full Action to meditate or use Cleanse(1).',
        hasValue: true
    },
    {
        id: 'torment',
        name: 'Torment(X)',
        category: 'mental',
        description: 'Gain X Stress instantly; value fades by 1 each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Fades naturally or via Calm/Resolve powers.',
        hasValue: true
    },
    {
        id: 'hex',
        name: 'Hex(X)',
        category: 'mental',
        description: 'Take Xd8 damage additional damage when you are hit by a power with the Spell Tag.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Ends naturally, Cleanse(1) or Dispel Magic.',
        hasValue: true
    }
];
/**
 * Damage & Combat Modifiers
 */
export const DAMAGE_EFFECTS = [
    {
        id: 'crit',
        name: 'Crit(X)',
        category: 'damage',
        description: 'Expands critical range by 1 for X attacks.',
        duration: 'Until used',
        stacking: 'No',
        removal: 'Consumed when those attacks are made.',
        hasValue: true
    },
    {
        id: 'penetration',
        name: 'Penetration(X)',
        category: 'damage',
        description: 'Attack ignores X Armor.',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves with the attack.',
        hasValue: true
    },
    {
        id: 'smite',
        name: 'Smite(X)',
        category: 'damage',
        description: 'Adds +Xd8 bonus damage vs Undead/Fiends.',
        duration: 'Instant',
        stacking: 'Yes',
        removal: 'Ends immediately after the attack.',
        hasValue: true
    },
    {
        id: 'precision',
        name: 'Precision(X)',
        category: 'damage',
        description: 'On hit, add +X d8 bonus damage',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves immediately after a confirmed hit.',
        hasValue: true
    },
    {
        id: 'brutal-impact',
        name: 'Brutal Impact(X)',
        category: 'damage',
        description: 'Each damage die rolled counts as at least X.',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves with the attack; cannot combine with rerolls or Advantage.',
        hasValue: true
    },
    {
        id: 'expose',
        name: 'Expose(X)',
        category: 'damage',
        description: 'Reduce target\'s Evade by X until end of its next turn.',
        duration: '1 Round',
        stacking: 'Yes',
        removal: 'Ends automatically at end of target\'s next turn.',
        hasValue: true
    },
    {
        id: 'weaken',
        name: 'Weaken(X)',
        category: 'damage',
        description: 'The target suffers −X dice on all Body, Mind, or Spirit Saves (choose one when applying). The penalty fades by 1 each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Ends naturally as X decreases, or immediately via Cleanse(1) or 1 Full Action spent to recover composure.',
        hasValue: true
    }
];
/**
 * Support & Cleansing Effects
 */
export const SUPPORT_EFFECTS = [
    {
        id: 'cleanse',
        name: 'Cleanse(X)',
        category: 'support',
        description: 'Remove up to X active Specials from a target.',
        duration: 'Instant',
        stacking: 'No',
        removal: '—',
        hasValue: true
    },
    {
        id: 'immovable',
        name: 'Immovable',
        category: 'support',
        description: 'Immune to Push, Prone.',
        duration: 'Buff Duration',
        stacking: 'No',
        removal: 'Ends when stance/buff expires.',
        hasValue: false
    }
];
/**
 * All special effects combined
 */
export const ALL_SPECIAL_EFFECTS = [
    ...PHYSICAL_EFFECTS,
    ...MENTAL_EFFECTS,
    ...DAMAGE_EFFECTS,
    ...SUPPORT_EFFECTS
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
 * Get an effect by ID (preferred method)
 */
export function getEffectById(id) {
    return SPECIAL_EFFECTS_BY_ID.get(id);
}
/**
 * Get an effect by name (legacy support)
 */
export function getEffect(name) {
    // Try to match by ID first
    const id = generateId(name);
    const byId = getEffectById(id);
    if (byId)
        return byId;
    // Fallback to name matching
    return ALL_SPECIAL_EFFECTS.find(effect => effect.name.toLowerCase().replace(/\(x\)/gi, '').trim() ===
        name.toLowerCase().replace(/\(x\)/gi, '').trim());
}
/**
 * Format a SpecialEffectReference to display string (e.g., { specialId: "bleeding", value: 3 } -> "Bleeding(3)")
 */
export function formatEffectReference(ref) {
    const effect = getEffectById(ref.specialId);
    if (!effect) {
        // Fallback if effect not found
        return ref.value !== undefined ? `${ref.specialId}(${ref.value})` : ref.specialId;
    }
    if (effect.hasValue && ref.value !== undefined) {
        return `${getBaseName(effect.name)}(${ref.value})`;
    }
    return getBaseName(effect.name);
}
/**
 * Parse effect string to SpecialEffectReference (e.g., "Bleeding(3)" -> { specialId: "bleeding", value: 3 })
 */
export function parseEffectString(effectString) {
    const match = effectString.match(/^([^(]+)(?:\((\d+)\))?$/);
    if (!match)
        return null;
    const name = match[1].trim();
    const value = match[2] ? parseInt(match[2], 10) : undefined;
    // Try to find effect by name
    const effect = getEffect(name);
    if (!effect)
        return null;
    return {
        specialId: effect.id,
        value: value
    };
}
/**
 * Parse effect value from effect string (e.g., "Bleeding(3)" -> 3) - legacy function
 */
export function parseEffectValue(effectString) {
    const match = effectString.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
}
/**
 * Format effect with value (e.g., "Bleeding", 3 -> "Bleeding(3)") - legacy function
 */
export function formatEffectWithValue(effectName, value) {
    // Remove existing value if present
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