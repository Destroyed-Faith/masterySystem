/**
 * Eligible Special keys per Active damage tier.
 *
 * Source: `Actives.md` tier eligibility tables (T3 ~250–290, T4 ~374–407,
 * T5 ~623–629, T6 ~800–807). Keys match `ALL_SPECIAL_EFFECTS[i].id` in
 * `src/utils/special-effects.ts`.
 *
 * The catalog (see `power-catalog.ts`) uses these lists to expand every
 * damage Active template × eligible Special into one CatalogEntry per
 * variant, so the user can search directly by the target Special
 * (e.g. "Ignite", "Bleeding", "Sundered", …).
 */
/** Start PP 3 — Poison Group only (agent.md §10.15). */
export const TIER_3_SPECIALS = [
    'poisoned',
];
/** Tier 4 eligibility per Actives.md ~374–407. */
export const TIER_4_SPECIALS = [
    'bleeding',
    'freeze',
    'ignite',
    'mark',
    'blinded',
];
/** Tier 5 eligibility per Actives.md ~623–629. */
export const TIER_5_SPECIALS = [
    'weaken',
    'frightened',
];
/** Tier 6 eligibility per Actives.md ~800–807; includes Root(X). */
export const TIER_6_SPECIALS = [
    'corrode',
    'shock',
    'soulburn',
    'hex',
    'sundered',
    'root',
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
/** All eligible specials across all tiers, flat (deduplicated). */
export const ALL_TIER_ELIGIBLE_SPECIALS = Array.from(new Set([
    ...TIER_3_SPECIALS,
    ...TIER_4_SPECIALS,
    ...TIER_5_SPECIALS,
    ...TIER_6_SPECIALS,
]));
//# sourceMappingURL=_specials.js.map