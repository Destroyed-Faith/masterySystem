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
 * (e.g. "Ruin", "Lacerate", "Sundered", …).
 */

import type { ActiveSpecialTier } from '../../../types/item.js';

/** Start PP 3 — Blight Group only (agent.md §10.15). */
export const TIER_3_SPECIALS: readonly string[] = [
    'blight',
] as const;

/** Tier 4 eligibility per Actives.md ~374–407 (Blinded folded into Disoriented). */
export const TIER_4_SPECIALS: readonly string[] = [
    'lacerate',
    'expose',
    'slow',
    'ruin',
    'mark',
    'disoriented',
] as const;

/** Tier 5 eligibility per Actives.md ~623–629 (Frightened folded into Dread). */
export const TIER_5_SPECIALS: readonly string[] = [
    'weaken',
    'dread',
] as const;

/** Tier 6 eligibility per Actives.md ~800–807; includes Root(X) (Shock folded into Disrupt). */
export const TIER_6_SPECIALS: readonly string[] = [
    'corrode',
    'disrupt',
    'soulburn',
    'hex',
    'sundered',
    'root',
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

/** All eligible specials across all tiers, flat (deduplicated). */
export const ALL_TIER_ELIGIBLE_SPECIALS: readonly string[] = Array.from(
    new Set([
        ...TIER_3_SPECIALS,
        ...TIER_4_SPECIALS,
        ...TIER_5_SPECIALS,
        ...TIER_6_SPECIALS,
    ]),
);
