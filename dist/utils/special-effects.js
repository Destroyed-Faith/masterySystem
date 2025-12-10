/**
 * Special Effects Reference for Mastery System
 *
 * All Special Conditions, Effects, and ongoing statuses that can appear during play.
 * Each entry lists what it does, how long it lasts, how it stacks, and how it can be removed.
 */
/**
 * Physical Effects
 */
export const PHYSICAL_EFFECTS = [
    {
        name: 'Bleeding(X)',
        category: 'physical',
        description: 'Take damage equal to X at the start of your turn. The value decreases by 1 each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Medicine Check (TN 15 + damage) or spend 1 Attack Action to stabilize.',
        hasValue: true
    },
    {
        name: 'Blinded(X)',
        category: 'physical',
        description: 'You cannot see, automatically fail vision checks, and suffer −X Attack Dice on all sight-based attacks. At X ≥ 3, you cannot target creatures beyond 2 m and effectively fight in darkness.',
        duration: 'Mastery Rank Rounds + X',
        stacking: 'No',
        removal: 'Ends on a Body or Spirit Save at the end of your turn, through Cleanse(1), or by exposure to bright light.',
        hasValue: true
    },
    {
        name: 'Corrode(X)',
        category: 'physical',
        description: 'Your Armor is reduced by X; protection restores gradually.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Attack Action to scrape off corrosion or use Cleanse(1).',
        hasValue: true
    },
    {
        name: 'Freeze(X)',
        category: 'physical',
        description: 'Movement reduced by X m, take Xd8 flat damage once.',
        duration: 'Until broken',
        stacking: 'No',
        removal: 'Body Save or 1 Attack Action to break free; Fire ends instantly.',
        hasValue: true
    },
    {
        name: 'Grappled(X)',
        category: 'physical',
        description: 'You are restrained; Speed 0, grappler gains +X dice on control rolls.',
        duration: 'Until broken',
        stacking: 'No',
        removal: 'Body Save to escape or until grappler releases you.',
        hasValue: true
    },
    {
        name: 'Ignite(X)',
        category: 'physical',
        description: 'Take X fire damage each round; intensity fades as flames die.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Attack Action or Drop Prone to extinguish; Rain ends instantly.',
        hasValue: true
    },
    {
        name: 'Poisoned(X)',
        category: 'physical',
        description: 'You have Disadvantage on attacks and checks; fades over time.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Full Action to purge toxins or use an Antidote.',
        hasValue: true
    },
    {
        name: 'Prone(X)',
        category: 'physical',
        description: 'You are knocked down; attacks against you gain +X Attack Dice.',
        duration: '1 Round',
        stacking: 'No',
        removal: 'Spend 1 Attack Action to stand up (you may still move normally).',
        hasValue: true
    },
    {
        name: 'Push(X)',
        category: 'physical',
        description: 'You are pushed X m backward by force.',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves immediately.',
        hasValue: true
    },
    {
        name: 'Regeneration(X)',
        category: 'physical',
        description: 'Heal X HP at end of your turn. Value decreases by 1 each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Ends if you take Fire or Necrotic damage.',
        hasValue: true
    },
    {
        name: 'Shock(X)',
        category: 'physical',
        description: 'Lose X dice from your next attack pool; fades each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Attack Action to re-steady or succeed on Body Save.',
        hasValue: true
    },
    {
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
        name: 'Charmed(X)',
        category: 'mental',
        description: 'On failed Mind Save −X, cannot attack the charmer or their allies.',
        duration: 'Mastery Rank Rounds',
        stacking: 'No',
        removal: 'Ends on Save, Cleanse, or Dispel Magic.',
        hasValue: true
    },
    {
        name: 'Curse(X)',
        category: 'mental',
        description: 'Suffer −X to all attack rolls; weakens each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Full Action in Prayer or receive a Cleanse Spell.',
        hasValue: true
    },
    {
        name: 'Disoriented(X)',
        category: 'mental',
        description: 'Suffer −X dice on Mind/Spirit Saves while affected.',
        duration: 'Mastery Rank Rounds',
        stacking: 'No',
        removal: 'Ends automatically or on Mind Save.',
        hasValue: true
    },
    {
        name: 'Frightened(X)',
        category: 'mental',
        description: 'On failed Mind Save −X, must flee or avoid the source.',
        duration: 'Mastery Rank Rounds',
        stacking: 'No',
        removal: 'Ends on Save or when the source is gone.',
        hasValue: true
    },
    {
        name: 'Mark(X)',
        category: 'mental',
        description: 'Suffer −X dice on attacks unless attacking the one who marked you.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Ends automatically after attacking the marker once.',
        hasValue: true
    },
    {
        name: 'Soulburn(X)',
        category: 'mental',
        description: 'Take −X to Body, Mind, and Spirit Saves; weakens each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Spend 1 Full Action to meditate or use Cleanse(1).',
        hasValue: true
    },
    {
        name: 'Torment(X)',
        category: 'mental',
        description: 'Gain X Stress instantly; value fades by 1 each round.',
        duration: 'Diminishing (X→0)',
        stacking: 'Yes',
        removal: 'Fades naturally or via Calm/Resolve powers.',
        hasValue: true
    },
    {
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
        name: 'Crit(X)',
        category: 'damage',
        description: 'Expands critical range by 1 for X attacks.',
        duration: 'Until used',
        stacking: 'No',
        removal: 'Consumed when those attacks are made.',
        hasValue: true
    },
    {
        name: 'Penetration(X)',
        category: 'damage',
        description: 'Attack ignores X Armor.',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves with the attack.',
        hasValue: true
    },
    {
        name: 'Smite(X)',
        category: 'damage',
        description: 'Adds +Xd8 bonus damage vs Undead/Fiends.',
        duration: 'Instant',
        stacking: 'Yes',
        removal: 'Ends immediately after the attack.',
        hasValue: true
    },
    {
        name: 'Precision(X)',
        category: 'damage',
        description: 'On hit, add +X d8 bonus damage',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves immediately after a confirmed hit.',
        hasValue: true
    },
    {
        name: 'Brutal Impact(X)',
        category: 'damage',
        description: 'Each damage die rolled counts as at least X.',
        duration: 'Instant',
        stacking: 'No',
        removal: 'Resolves with the attack; cannot combine with rerolls or Advantage.',
        hasValue: true
    },
    {
        name: 'Expose(X)',
        category: 'damage',
        description: 'Reduce target\'s Evade by X until end of its next turn.',
        duration: '1 Round',
        stacking: 'Yes',
        removal: 'Ends automatically at end of target\'s next turn.',
        hasValue: true
    },
    {
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
        name: 'Cleanse(X)',
        category: 'support',
        description: 'Remove up to X active Specials from a target.',
        duration: 'Instant',
        stacking: 'No',
        removal: '—',
        hasValue: true
    },
    {
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
 * Get all effects by category
 */
export function getEffectsByCategory(category) {
    return ALL_SPECIAL_EFFECTS.filter(effect => effect.category === category);
}
/**
 * Get an effect by name
 */
export function getEffect(name) {
    return ALL_SPECIAL_EFFECTS.find(effect => effect.name.toLowerCase().replace(/\(x\)/gi, '').trim() ===
        name.toLowerCase().replace(/\(x\)/gi, '').trim());
}
/**
 * Parse effect value from effect string (e.g., "Bleeding(3)" -> 3)
 */
export function parseEffectValue(effectString) {
    const match = effectString.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
}
/**
 * Format effect with value (e.g., "Bleeding", 3 -> "Bleeding(3)")
 */
export function formatEffectWithValue(effectName, value) {
    // Remove existing value if present
    const baseName = effectName.replace(/\(.*?\)/g, '').trim();
    return `${baseName}(${value})`;
}
//# sourceMappingURL=special-effects.js.map