/**
 * Eligible Special keys per Active damage tier.
 *
 * Source: `Rules/actives.md` Start PP group tables:
 *   T3 / Start PP 3 — Blight
 *   T4 / Start PP 4 — Lacerate, Slow, Ruin, Mark
 *   T5 / Start PP 6 — Challenge, Corrode, Hex, Sundered (+ Root)
 *   T6 / Start PP 8 — Disoriented, Expose, Soulburn, Weaken
 *
 * Keys match `ALL_SPECIAL_EFFECTS[i].id` in `src/utils/special-effects.ts`.
 */
import type { ActiveSpecialTier } from '../../../types/item.js';
/** Start PP 3 — Blight Group. */
export declare const TIER_3_SPECIALS: readonly string[];
/** Start PP 4 — standard diminishing Specials. */
export declare const TIER_4_SPECIALS: readonly string[];
/** Start PP 6 — heavy Specials (Challenge / Corrode / Hex / Sundered / Root). */
export declare const TIER_5_SPECIALS: readonly string[];
/** Start PP 8 — Disoriented / Expose / Soulburn / Weaken. */
export declare const TIER_6_SPECIALS: readonly string[];
/** Return the eligible special keys for a given damage tier. */
export declare function getEligibleSpecialsForTier(tier: ActiveSpecialTier): readonly string[];
/** All eligible specials across all tiers, flat (deduplicated). */
export declare const ALL_TIER_ELIGIBLE_SPECIALS: readonly string[];
//# sourceMappingURL=_specials.d.ts.map