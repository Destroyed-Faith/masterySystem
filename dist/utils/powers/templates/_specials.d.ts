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
import type { ActiveSpecialTier } from '../../../types/item.js';
/** Start PP 3 — Poison Group only (agent.md §10.15). */
export declare const TIER_3_SPECIALS: readonly string[];
/** Tier 4 eligibility per Actives.md ~374–407. */
export declare const TIER_4_SPECIALS: readonly string[];
/** Tier 5 eligibility per Actives.md ~623–629. */
export declare const TIER_5_SPECIALS: readonly string[];
/** Tier 6 eligibility per Actives.md ~800–807; includes Root(X). */
export declare const TIER_6_SPECIALS: readonly string[];
/** Return the eligible special keys for a given damage tier. */
export declare function getEligibleSpecialsForTier(tier: ActiveSpecialTier): readonly string[];
/** All eligible specials across all tiers, flat (deduplicated). */
export declare const ALL_TIER_ELIGIBLE_SPECIALS: readonly string[];
//# sourceMappingURL=_specials.d.ts.map