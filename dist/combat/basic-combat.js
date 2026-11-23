/**
 * Basic Combat Maneuvers helpers (universal options for every combatant).
 *
 * There is no automatic Basic Attack (Actives v0.9.9.6): damage attacks come
 * from learned or granted Attack Powers.
 * Basic Reactions (Core v0.9.9.6): Guard (+MR×2 Armor) and Dive for Cover (AoE) only.
 * There is no Basic Evade; Reaction: Evade is a purchased Power.
 * Counterattack is not a Basic Reaction; legacy Counterattack items are never offered.
 */
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
export function getMasteryRank(actor) {
    return getRulesMasteryRank(actor);
}
/** MR × 2 — Guard bonus and Dive for Cover distance. */
export function basicCombatMrTimesTwo(actor) {
    return getMasteryRank(actor) * 2;
}
export const BASIC_REACTION_IDS = {
    guard: 'basic-reaction-guard',
    diveForCover: 'basic-reaction-dive-for-cover',
    /** @deprecated Not injected as a universal Basic Reaction. */
    counterattack: 'basic-reaction-counterattack',
};
/** Synthetic power-like items injected into the Reaction Window. */
export function buildBasicReactionItems(actor) {
    const mr2 = basicCombatMrTimesTwo(actor);
    const moveM = mr2;
    return [
        {
            id: BASIC_REACTION_IDS.guard,
            name: 'Guard',
            type: 'basic-reaction',
            system: {
                powerType: 'reaction',
                templateId: 'basic-guard',
                description: `Gain +${mr2} Armor (MR × 2) against the triggering attack or damage instance.`,
            },
            basicReaction: 'guard',
            mechanics: { armor: mr2 },
        },
        {
            id: BASIC_REACTION_IDS.diveForCover,
            name: 'Dive for Cover',
            type: 'basic-reaction',
            system: {
                powerType: 'reaction',
                templateId: 'basic-dive-for-cover',
                description: `Move up to ${moveM} m (2 × MR). If you leave the AoE completely, you are not affected.`,
            },
            basicReaction: 'dive-for-cover',
            mechanics: {},
        },
    ];
}
/**
 * @deprecated Legacy Counterattack item (old NPC configs / chat cards). Never
 * offered: reaction eligibility hides every `basicReaction: 'counterattack'`.
 */
export function buildCounterattackReactionItem(_actor) {
    return {
        id: BASIC_REACTION_IDS.counterattack,
        name: 'Counterattack',
        type: 'basic-reaction',
        system: {
            powerType: 'reaction',
            templateId: 'basic-counterattack',
            description: 'Retired: there is no Basic Attack (Actives v0.9.9.6).',
        },
        basicReaction: 'counterattack',
        mechanics: {},
    };
}
export function isBasicReactionItem(item) {
    return (item?.type === 'basic-reaction' ||
        String(item?.id ?? '').startsWith('basic-reaction-') ||
        !!item?.basicReaction);
}
//# sourceMappingURL=basic-combat.js.map