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

import type { ActiveSpecialTier } from '../../../types/item.js';

export const TIER_3_SPECIALS: readonly string[] = [
    'poisoned',
    'shock',
    'weaken',
    'freeze',
    'bleeding',
] as const;

export const TIER_4_SPECIALS: readonly string[] = [
    'ignite',
    'corrode',
    'expose',
    'mark',
] as const;

export const TIER_5_SPECIALS: readonly string[] = [
    'soulburn',
    'sundered',
    'regeneration',
] as const;

export const TIER_6_SPECIALS: readonly string[] = [
    'hex',
    'stunned',
    'prone',
    'frightened',
    'blinded',
] as const;

/** Return the eligible special keys for a given damage tier. */
export function getEligibleSpecialsForTier(tier: ActiveSpecialTier): readonly string[] {
    switch (tier) {
        case 3: return TIER_3_SPECIALS;
        case 4: return TIER_4_SPECIALS;
        case 5: return TIER_5_SPECIALS;
        case 6: return TIER_6_SPECIALS;
    }
}

/** All eligible specials across all tiers, flat. */
export const ALL_TIER_ELIGIBLE_SPECIALS: readonly string[] = [
    ...TIER_3_SPECIALS,
    ...TIER_4_SPECIALS,
    ...TIER_5_SPECIALS,
    ...TIER_6_SPECIALS,
];
