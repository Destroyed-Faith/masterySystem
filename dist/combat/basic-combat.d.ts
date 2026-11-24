/**
 * Basic Combat Maneuvers helpers (universal options for every combatant).
 *
 * There is no automatic Basic Attack (Actives v0.9.9.6): damage attacks come
 * from learned or granted Attack Powers.
 * Basic Reactions (Core v0.9.9.6): only Dive for Cover (AoE). There is no Basic
 * Evade or Guard; Reaction: Evade / Reaction: Armor are purchased Powers.
 * Counterattack is not a Basic Reaction; legacy Counterattack items are never offered.
 */
export declare function getMasteryRank(actor: any): number;
/** MR × 2 — Dive for Cover distance (legacy Basic Guard used the same value). */
export declare function basicCombatMrTimesTwo(actor: any): number;
export declare const BASIC_REACTION_IDS: {
    /** @deprecated Not injected; Armor comes from Reaction: Armor. */
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