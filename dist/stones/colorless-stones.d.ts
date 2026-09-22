/**
 * Temporary Colorless Stones — Initiative Exchange and item grants (Absorption).
 *
 * Initiative Exchange: convert remaining Initiative into Temporary Colorless
 * Stones at `4 × Mastery Rank` Initiative per Stone. They may pay any part of
 * an unlocked Stone Ability's normal cost. When spent they disappear (they
 * are never Exhausted, burned, sealed, or bound). Unused leftovers vanish at
 * the end of combat — use them or lose them.
 *
 * Item-granted stones stay on the actor and follow that item's own combat
 * rule (Absorption: gone at the end of the next turn). Combat cleanup must
 * not treat them as leftover Initiative.
 */
export declare const COLORLESS_STONE_ATTR = "colorless";
export declare const COLORLESS_GEM_STYLE: {
    fill: string;
    stroke: string;
};
export declare function getMasteryRank(actor: any): number;
/** Initiative spent to buy one Temporary Colorless Stone. */
export declare function colorlessStoneInitiativeCost(masteryRank: number): number;
export declare function getTempColorlessStones(actor: any): number;
/** How many of the current pile were bought with Initiative Exchange. */
export declare function getInitiativeColorlessStones(actor: any): number;
/** Colorless Stones that did not come from Initiative (Absorption / items). */
export declare function getItemColorlessStones(actor: any): number;
export declare function setTempColorlessStones(actor: any, count: number): Promise<void>;
/** Item / Absorption grant — does not count as leftover Initiative. */
export declare function addTempColorlessStones(actor: any, amount: number): Promise<number>;
/** Initiative Exchange grant — these vanish after combat if still unused. */
export declare function addInitiativeColorlessStones(actor: any, amount: number): Promise<number>;
/** Spend Initiative leftovers first — they disappear at combat end anyway. */
export declare function spendTempColorlessStones(actor: any, amount: number): Promise<boolean>;
/** Drop item-granted stones without touching the Initiative leftover count. */
export declare function dropItemColorlessStones(actor: any, amount: number): Promise<number>;
export declare function clearTempColorlessStones(actor: any): Promise<void>;
/**
 * Drop leftover Initiative Colorless Stones. Item-granted stones stay.
 * Untagged leftovers from before source tracking count as Initiative, minus
 * any Absorption expiry still on the actor.
 */
export declare function clearInitiativeColorlessStones(actor: any): Promise<void>;
export declare function isInitiativeBoostUsedThisCombat(combatant: any): boolean;
export declare function markInitiativeBoostUsedThisCombat(combatant: any): Promise<void>;
export declare function isPhasingStoneUsedThisCombat(combatant: any): boolean;
export declare function markPhasingStoneUsedThisCombat(combatant: any): Promise<void>;
export declare function isTempHpStoneUsedThisCombat(combatant: any): boolean;
export declare function markTempHpStoneUsedThisCombat(combatant: any): Promise<void>;
export declare function oncePerCombatFlagForPower(powerId: string): string | null;
export declare function isOncePerCombatPowerUsed(combatant: any, powerId: string): boolean;
export declare function markOncePerCombatPowerUsed(combatant: any, powerId: string): Promise<void>;
/** Initiative Boost tier scale: 1 / 2 / 4 / 8 × Mastery Rank. Tier 4 is the last tier. */
export declare function initiativeBoostAmount(tier: number, masteryRank: number): number;
export declare function maxConvertibleColorlessStones(initiative: number, masteryRank: number): number;
export declare function convertInitiativeToColorlessPreview(initiative: number, stones: number, masteryRank: number): {
    stones: number;
    initiativeCost: number;
    remainingInitiative: number;
};
export declare function convertInitiativeToColorlessStones(actor: any, combatant: any, stones: number): Promise<{
    stones: number;
    remainingInitiative: number;
} | null>;
export declare function clearColorlessStonesForCombat(combat: any): Promise<void>;
//# sourceMappingURL=colorless-stones.d.ts.map