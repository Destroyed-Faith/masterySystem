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
/** Start PP 3 — Blight Group. */
export const TIER_3_SPECIALS = [
    'blight',
];
/** Start PP 4 — standard diminishing Specials. */
export const TIER_4_SPECIALS = [
    'lacerate',
    'slow',
    'ruin',
    'mark',
];
/** Start PP 6 — heavy Specials (Challenge / Corrode / Hex / Sundered / Root). */
export const TIER_5_SPECIALS = [
    'challenge',
    'corrode',
    'hex',
    'sundered',
    'root',
];
/** Start PP 8 — Disoriented / Expose / Soulburn / Weaken. */
export const TIER_6_SPECIALS = [
    'disoriented',
    'expose',
    'soulburn',
    'weaken',
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