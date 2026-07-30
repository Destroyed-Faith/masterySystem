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
export const TIER_3_SPECIALS: readonly string[] = [
    'blight',
] as const;

/** Start PP 4 — standard diminishing Specials. */
export const TIER_4_SPECIALS: readonly string[] = [
    'lacerate',
    'slow',
    'ruin',
    'mark',
] as const;

/** Start PP 6 — heavy Specials (Challenge / Corrode / Hex / Sundered / Root). */
export const TIER_5_SPECIALS: readonly string[] = [
    'challenge',
    'corrode',
    'hex',
    'sundered',
    'root',
] as const;

/** Start PP 8 — Disoriented / Expose / Soulburn / Weaken. */
export const TIER_6_SPECIALS: readonly string[] = [
    'disoriented',
    'expose',
    'soulburn',
    'weaken',
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
