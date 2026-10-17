/**
 * Colorless Stones from Initiative Exchange and item grants (Absorption).
 *
 * Initiative Exchange: convert remaining Initiative into Initiative Colorless
 * Stones at `4 × Mastery Rank` Initiative per Stone. They join the Colorless
 * Pool for the current combat and may pay any part of an unlocked Stone
 * Ability's normal cost. Spending one makes it Exhausted. Colorless Stones
 * are not recovered at the end of the Round unless Colorless Recovery has
 * designated them. They disappear when combat ends — Ready or Exhausted —
 * and can never be Burned, Sealed, or Bound.
 *
 * Item-granted stones stay on the actor and follow that item's own rule
 * (Absorption: vanish when spent, gone at the end of the next turn). Combat
 * cleanup must not treat them as leftover Initiative.
 *
 * Permanent Colorless Stones (progression, `system.stonePools.colorless`)
 * are 1:1 after the 2 starting Attribute Stones. Spent Colorless Stones stay
 * Exhausted unless Colorless Recovery designated them. Permanent Colorless
 * Stones return Ready at the end of combat unless Sealed or Bound.
 */
export declare const COLORLESS_STONE_ATTR = "colorless";
export declare const COLORLESS_RECOVERY_FLAG = "colorlessRecovery";
/**
 * Designated Colorless Stones that are Exhausted right now.
 * A numeric `remaining` budget does not make every Colorless Stone recoverable.
 */
export declare function colorlessRecoveryBudget(actor: any): number;
export declare const COLORLESS_GEM_STYLE: {
    fill: string;
    stroke: string;
};
export declare function getMasteryRank(actor: any): number;
/** Initiative spent to buy one Temporary Colorless Stone. */
export declare function colorlessStoneInitiativeCost(masteryRank: number): number;
export declare function getTempColorlessStones(actor: any): number;
/** Ready Initiative Colorless Stones (part of the spendable pile). */
export declare function getInitiativeColorlessStones(actor: any): number;
/** Exhausted Initiative Colorless Stones — spent, but still part of the combat. */
export declare function getExhaustedInitiativeColorlessStones(actor: any): number;
/** All Initiative Colorless Stones alive in this combat (Ready + Exhausted). */
export declare function getInitiativeColorlessTotal(actor: any): number;
/** Colorless Stones that did not come from Initiative (Absorption / items). */
export declare function getItemColorlessStones(actor: any): number;
export declare function setTempColorlessStones(actor: any, count: number): Promise<void>;
/**
 * Absorption Stones wait until the next Preparation Phase. They are not spendable yet.
 */
export declare function queueAbsorptionStones(actor: any, amount: number, combat: any): Promise<number>;
/** Move queued Absorption Stones into the spendable pile at the next Preparation Phase. */
export declare function releaseAbsorptionStonesForPreparation(actor: any, combat: any): Promise<number>;
/** Item / Absorption grant — does not count as leftover Initiative. */
export declare function addTempColorlessStones(actor: any, amount: number): Promise<number>;
/** Initiative Exchange grant — gained Ready, alive until the combat ends. */
export declare function addInitiativeColorlessStones(actor: any, amount: number): Promise<number>;
export declare function copyColorlessPile(from: any, to: any): Promise<void>;
/**
 * Permanent Colorless Stones live in `system.stonePools.colorless`.
 * They become Exhausted when spent and are not restored by Stone Recovery
 * unless Colorless Recovery designated them. They return Ready at combat end.
 */
export declare function getPermanentColorlessStones(actor: any): {
    current: number;
    max: number;
};
/**
 * Colorless Stones spendable right now: item-granted pile + Ready Initiative
 * Colorless + Ready Permanent Colorless.
 */
export declare function getSpendableColorlessStones(actor: any): number;
/**
 * Spend Colorless Stones. Deterministic, player-favorable source order:
 * item-granted first (they vanish on spend and expire soonest), then Ready
 * Initiative Colorless (combat-limited; they become Exhausted and may
 * regenerate), then Ready Permanent Colorless (they become Exhausted and
 * survive the combat).
 */
export declare function spendColorlessStones(actor: any, amount: number): Promise<boolean>;
/**
 * Spend from the temporary pile: item-granted stones first (source rule —
 * they vanish when spent), then Ready Initiative Colorless Stones, which
 * become Exhausted instead of disappearing.
 */
export declare function spendTempColorlessStones(actor: any, amount: number): Promise<boolean>;
/**
 * Normal Stone Regeneration on Initiative Colorless Stones: move up to
 * `amount` Exhausted Initiative Colorless Stones back to Ready. Returns how
 * many actually came back.
 */
export declare function restoreInitiativeColorlessStones(actor: any, amount: number): Promise<number>;
/** Drop item-granted stones without touching the Initiative leftover count. */
export declare function dropItemColorlessStones(actor: any, amount: number): Promise<number>;
export declare function clearTempColorlessStones(actor: any): Promise<void>;
/**
 * End of combat: all Initiative Colorless Stones disappear, Ready or
 * Exhausted. Item-granted stones stay. Untagged leftovers from before source
 * tracking count as Initiative, minus any Absorption expiry still on the
 * actor.
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