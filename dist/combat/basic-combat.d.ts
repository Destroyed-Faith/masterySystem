/**
 * Basic Combat Maneuvers helpers (universal options for every combatant).
 *
 * Basic Attack damage: Weapon Damage + MR × 2d8.
 * Basic Reactions: Guard (+MR×2 Armor), Evade (+MR×2 Evade), Counterattack.
 */
export declare function getMasteryRank(actor: any): number;
/** MR × 2 — used for Basic Attack bonus dice and Guard/Evade bonuses. */
export declare function basicCombatMrTimesTwo(actor: any): number;
/** Dice formula for the Basic Attack MR bonus pool, e.g. `"8d8"`. */
export declare function basicAttackMrDamageFormula(actor: any): string;
export declare const BASIC_REACTION_IDS: {
    readonly guard: "basic-reaction-guard";
    readonly evade: "basic-reaction-evade";
    readonly counterattack: "basic-reaction-counterattack";
};
/** Synthetic power-like items injected into the Reaction Window. */
export declare function buildBasicReactionItems(actor: any): any[];
export declare function isBasicReactionItem(item: any): boolean;
//# sourceMappingURL=basic-combat.d.ts.map