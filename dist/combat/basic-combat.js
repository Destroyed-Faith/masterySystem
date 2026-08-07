/**
 * Basic Combat Maneuvers helpers (universal options for every combatant).
 *
 * Basic Attack damage: Weapon Damage + MR × 2d8.
 * Basic Reactions: Guard (+MR×2 Armor), Evade (+MR×2 Evade), Counterattack.
 */
export function getMasteryRank(actor) {
    const mr = Math.floor(Number(actor?.system?.mastery?.rank) || 0);
    return Math.max(1, Math.min(16, mr || 2));
}
/** MR × 2 — used for Basic Attack bonus dice and Guard/Evade bonuses. */
export function basicCombatMrTimesTwo(actor) {
    return getMasteryRank(actor) * 2;
}
/** Dice formula for the Basic Attack MR bonus pool, e.g. `"8d8"`. */
export function basicAttackMrDamageFormula(actor) {
    const n = basicCombatMrTimesTwo(actor);
    return n > 0 ? `${n}d8` : '0';
}
export const BASIC_REACTION_IDS = {
    guard: 'basic-reaction-guard',
    evade: 'basic-reaction-evade',
    counterattack: 'basic-reaction-counterattack',
};
/** Synthetic power-like items injected into the Reaction Window. */
export function buildBasicReactionItems(actor) {
    const mr2 = basicCombatMrTimesTwo(actor);
    return [
        {
            id: BASIC_REACTION_IDS.guard,
            name: 'Guard',
            type: 'basic-reaction',
            system: {
                powerType: 'reaction',
                templateId: 'basic-guard',
                description: `Gain +${mr2} Armor (MR × 2) against the triggering attack or damage.`,
            },
            basicReaction: 'guard',
            mechanics: { armor: mr2 },
        },
        {
            id: BASIC_REACTION_IDS.evade,
            name: 'Evade',
            type: 'basic-reaction',
            system: {
                powerType: 'reaction',
                templateId: 'basic-evade',
                description: `Gain +${mr2} Evade (MR × 2) against the triggering attack.`,
            },
            basicReaction: 'evade',
            mechanics: { evade: mr2 },
        },
        {
            id: BASIC_REACTION_IDS.counterattack,
            name: 'Counterattack',
            type: 'basic-reaction',
            system: {
                powerType: 'reaction',
                templateId: 'basic-counterattack',
                description: `Make a Basic Attack (Weapon + ${mr2}d8) against the triggering creature.`,
            },
            basicReaction: 'counterattack',
            mechanics: {},
        },
    ];
}
export function isBasicReactionItem(item) {
    return (item?.type === 'basic-reaction' ||
        String(item?.id ?? '').startsWith('basic-reaction-') ||
        !!item?.basicReaction);
}
//# sourceMappingURL=basic-combat.js.map