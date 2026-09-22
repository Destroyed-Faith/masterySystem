/**
 * Destroyed Faith DF Core v0.9.9.0 — compressed Attributes, Lifetime XP Stones,
 * Guaranteed Eight, Target Numbers, Martial Damage, and Stone Ability tier cap.
 *
 * Skill XP costs stay on the existing 1–32 band table. Do not route Skills
 * through `attributeBandCost`.
 */
export declare const V099_SCHEMA_VERSION = "0.9.9.0";
export declare const ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export type AttributeKeyName = (typeof ATTRIBUTE_KEYS)[number];
export declare const ATTRIBUTE_ABBREV: Record<AttributeKeyName, string>;
/** Old free starting package 8/8/6/6/4/4/2, valued on the old 1-XP band. */
export declare const OLD_STARTING_ATTRIBUTE_XP = 38;
/** New free starting package. */
export declare const NEW_STARTING_PACKAGE: readonly [4, 4, 3, 3, 2, 2, 2];
export declare const NEW_STARTING_COUNTS: Record<number, number>;
export declare const STONE_ABILITY_MAX_TIER = 4;
export declare const PRINT_LIFETIME_XP_SPAN = 400;
/** Old Attribute step cost to reach `nextValue` (1–80 bands of 8). */
export declare function oldAttributeStepCost(nextValue: number): number;
/** Cumulative old-table XP to raise one Attribute from 0 to `value`. */
export declare function cumulativeOldAttributeXp(value: number): number;
export declare function readAttributeValues(source: Record<string, any> | null | undefined): Record<AttributeKeyName, number>;
/**
 * Post-creation Attribute XP on the old cost table.
 * Uses the creation snapshot when it exists (exact purchased increases).
 * Otherwise cumulative current value minus the free 38 XP package.
 */
export declare function earnedAttributeXpInvestment(current: Record<string, number>, snapshot: Record<string, number> | null | undefined): {
    xp: number;
    source: 'snapshot' | 'package';
};
export declare function startingPackageIsValid(values: Record<string, number>): boolean;
/** New compressed Attribute cost to reach `nextValue` (1–40). */
export declare function compressedAttributeStepCost(nextValue: number): number;
/** XP to raise Attributes from `base` to `target` on the compressed table. */
export declare function compressedAttributeXpBetween(base: Record<string, number>, target: Record<string, number>): number;
export type LifetimeXpDerivation = {
    lifetimeXp: number | null;
    source: 'stored' | 'earnedCounters' | 'spentPlusUnspent' | 'unknown';
};
/**
 * Lifetime XP never decreases. Prefer an already stored value, then the
 * system's earned counters, then spent + unspent. Never invent a number.
 */
export declare function deriveLifetimeXp(system: any): LifetimeXpDerivation;
export declare function nextLifetimeXp(system: any, amount: number): number | null;
/** Permanent Stones = 2 + floor(Lifetime XP / 20). */
export declare function permanentStonesFromLifetimeXp(lifetimeXp: number): number;
/** MR × 2. Resolve Mastery Rank from the stone total first. */
export declare function stoneConcentrationCap(totalPermanentStones: number, storedRank?: number): number;
export declare function emptyAssignments(): Record<AttributeKeyName, number>;
export declare function readAssignments(source: any): Record<AttributeKeyName, number>;
export declare function sumAssignments(assignments: Record<string, number>): number;
export declare function canPlacePermanentStone(args: {
    attribute: string;
    assignments: Record<string, number>;
    totalPermanent: number;
    storedRank?: number;
}): {
    ok: boolean;
    cap: number;
    masteryRank: number;
    reason?: string;
};
export declare function assignmentsAreLegal(assignments: Record<string, number>, totalPermanent: number, storedRank?: number): {
    ok: boolean;
    reason?: string;
};
export interface StoneProgressSlot {
    index: number;
    kind: 'start' | 'milestone';
    label: string;
    milestoneXp: number | null;
    unlocked: boolean;
    assigned: boolean;
    attribute: string | null;
    abbrev: string;
}
export declare function buildStoneProgressionSlots(lifetimeXp: number, assignments: Record<string, number>, throughXp?: number): StoneProgressSlot[];
export declare function chunkSlots<T>(slots: T[], size: number): T[][];
/** v0.9.9 characters store assignments. Older actors still derive Stones from Attributes until respec. */
export declare function usesV099Stones(system: any): boolean;
export declare function resolvedStonePoolMax(system: any, attr: string, attributeValue: number): number;
export declare function resolvedPermanentStoneTotal(system: any, attributeDerivedTotal: number): number;
/** Standard / Spell Base / Attribute Check / Death / Stress / Ritual base TN. */
export declare function standardTnForMasteryRank(masteryRank: number): number;
export declare function maxGuaranteedEights(finalDicePool: number, masteryRank: number): number;
export declare function applyGuaranteedEightExchange(finalDicePool: number, masteryRank: number, requested: number): {
    ok: boolean;
    rolledDice: number;
    guaranteedEights: number;
    reason?: string;
};
/** A Guaranteed Eight starts at natural 8 and explodes; it is not auto-kept. */
export declare function rollGuaranteedEightChain(rollD8: () => number): {
    faces: number[];
    total: number;
};
export declare function highestKeptIndices(totals: number[], keep: number): number[];
export declare function martialDamageApplies(opts: {
    powerIsSpell?: boolean;
    npcIsSpell?: boolean;
    attackKind?: string;
}): boolean;
export declare function maxStoneCommitment(startsAtTier: 1 | 2): number;
/** Passive Skill Value on the compressed scale. */
export declare function passiveSkillValue(attributeValue: number): number;
//# sourceMappingURL=v099-rules.d.ts.map