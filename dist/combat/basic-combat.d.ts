/**
 * Basic Combat Maneuvers helpers (universal options for every combatant).
 *
 * There is no automatic Basic Attack (Actives v0.9.9.6): damage attacks come
 * from learned or granted Attack Powers.
 * Basic Reactions (Core v0.9.9.6): Guard (+MR×2 Armor) and Dive for Cover (AoE) only.
 * There is no Basic Evade; Reaction: Evade is a purchased Power.
 * Counterattack is not a Basic Reaction; legacy Counterattack items are never offered.
 */
export declare function getMasteryRank(actor: any): number;
/** MR × 2 — Guard bonus and Dive for Cover distance. */
export declare function basicCombatMrTimesTwo(actor: any): number;
export declare const BASIC_REACTION_IDS: {
    readonly guard: "basic-reaction-guard";
    readonly diveForCover: "basic-reaction-dive-for-cover";
    /** @deprecated Not injected as a universal Basic Reaction. */
    readonly counterattack: "basic-reaction-counterattack";
};
/** Synthetic power-like items injected into the Reaction Window. */
export declare function buildBasicReactionItems(actor: any): any[];
/**
 * @deprecated Legacy Counterattack item (old NPC configs / chat cards). Never
 * offered: reaction eligibility hides every `basicReaction: 'counterattack'`.
 */
export declare function buildCounterattackReactionItem(_actor: any): any;
export declare function isBasicReactionItem(item: any): boolean;
//# sourceMappingURL=basic-combat.d.ts.map