/**
 * Eligible Special keys per Active damage tier.
 *
 * Source: Actives.md tier buckets (Start PP 3/4/5/6). Keys match
 * `ALL_SPECIAL_EFFECTS[i].id` in `src/utils/special-effects.ts`.
 *
 * The catalog (see `power-catalog.ts`) uses these lists to expand every
 * damage Active template × eligible Special into one CatalogEntry per
 * variant, so the user can search directly by the target Special
 * (e.g. "Ignite", "Bleeding", "Sundered", …).
 */
export const TIER_3_SPECIALS = [
    'poisoned',
    'shock',
    'weaken',
    'freeze',
    'bleeding',
];
export const TIER_4_SPECIALS = [
    'ignite',
    'corrode',
    'expose',
    'mark',
];
export const TIER_5_SPECIALS = [
    'soulburn',
    'sundered',
    'regeneration',
];
export const TIER_6_SPECIALS = [
    'hex',
    'stunned',
    'prone',
    'frightened',
    'blinded',
];
/** Return the eligible special keys for a given damage tier. */
export function getEligibleSpecialsForTier(tier) {
    switch (tier) {
        case 3: return TIER_3_SPECIALS;
        case 4: return TIER_4_SPECIALS;
        case 5: return TIER_5_SPECIALS;
        case 6: return TIER_6_SPECIALS;
    }
}
/** All eligible specials across all tiers, flat. */
export const ALL_TIER_ELIGIBLE_SPECIALS = [
    ...TIER_3_SPECIALS,
    ...TIER_4_SPECIALS,
    ...TIER_5_SPECIALS,
    ...TIER_6_SPECIALS,
];
//# sourceMappingURL=_specials.js.map