/**
 * Destroyed Faith DF Core. Schema stays v0.9.9.0 so the attribute migration
 * does not replay. The live rules label is DF Core v0.9.9.1.
 * Guaranteed Eight, Target Numbers, Martial Damage, and Stone Ability tier cap.
 *
 * Skill XP costs stay on the existing 1–32 band table. Do not route Skills
 * through `attributeBandCost`.
 */
export declare const V099_SCHEMA_VERSION = "0.9.9.0";
/** Rules text currently implemented. Does not replay the 0.9.9.0 migration. */
export declare const DF_CORE_RULES_VERSION = "0.9.9.1";
export declare const ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export type AttributeKeyName = (typeof ATTRIBUTE_KEYS)[number];
export declare const ATTRIBUTE_ABBREV: Record<AttributeKeyName, string>;
/** Old free starting package 8/8/6/6/4/4/2, valued on the old 1-XP band. */
export declare const OLD_STARTING_ATTRIBUTE_XP = 38;
/** New free starting package. */
export declare const NEW_STARTING_PACKAGE: readonly [4, 4, 3, 3, 2, 2, 2];
export declare const NEW_STARTING_COUNTS: Record<number, number>;
export declare const STONE_ABILITY_MAX_TIER = 4;
/** First Lifetime XP line on the sheet and the print. Further XP continues on the next line. */
export declare const PRINT_LIFETIME_XP_SPAN = 660;
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
/**
 * Mastery Rank for Stone caps. Lifetime XP wins. Without it, the earned
 * permanent Stone total implies the XP that produced it. A stored sheet
 * rank does not change the cap, and allocated Stones are not a rank.
 */
export declare function masteryRankForStoneLimits(totalPermanentStones: number, lifetimeXp?: number | null): number;
/**
 * MR × 2 Stones on one Attribute.
 * `storedRank` remains in the signature for existing callers and is ignored.
 */
export declare function stoneConcentrationCap(totalPermanentStones: number, storedRank?: number, lifetimeXp?: number | null): number;
export declare function emptyAssignments(): Record<AttributeKeyName, number>;
export declare function readAssignments(source: any): Record<AttributeKeyName, number>;
export declare function sumAssignments(assignments: Record<string, number>): number;
/** Permanent Colorless Stones owned by this character (2:1 conversion of unassigned Stones). */
export declare function permanentColorlessCount(system: any): number;
/** A character may possess at most Mastery Rank Permanent Colorless Stones. */
export declare function permanentColorlessCap(masteryRank: number): number;
/**
 * Unassigned permanent progression Stones: earned total minus assigned minus
 * the two consumed by each Permanent Colorless Stone conversion.
 */
export declare function unassignedPermanentStones(args: {
    assignments: Record<string, number>;
    totalPermanent: number;
    permanentColorless?: number;
}): number;
/**
 * Convert 2 unassigned permanent Stones into 1 Permanent Colorless Stone.
 * The conversion is permanent. The cap is the Lifetime-XP Mastery Rank.
 * Temporary Colorless Stones are a different pool and do not change this cap.
 */
export declare function canConvertToPermanentColorless(args: {
    assignments: Record<string, number>;
    totalPermanent: number;
    permanentColorless: number;
    storedRank?: number;
    lifetimeXp?: number | null;
}): {
    ok: boolean;
    masteryRank: number;
    cap: number;
    reason?: string;
};
export declare function canPlacePermanentStone(args: {
    attribute: string;
    assignments: Record<string, number>;
    totalPermanent: number;
    storedRank?: number;
    permanentColorless?: number;
    lifetimeXp?: number | null;
}): {
    ok: boolean;
    cap: number;
    masteryRank: number;
    reason?: string;
};
export declare function assignmentsAreLegal(assignments: Record<string, number>, totalPermanent: number, storedRank?: number, permanentColorless?: number, lifetimeXp?: number | null): {
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
/** Stone milestones are every 20 Lifetime XP. The full track still runs to {@link PRINT_LIFETIME_XP_SPAN}. */
export declare const STONE_MILESTONE_XP = 20;
/**
 * First milestone strictly above `lifetimeXp`.
 * 0 and 1 show 20; 84 shows 100; 100 shows 120.
 */
export declare function nextProgressionMilestoneXp(lifetimeXp: number): number;
export declare function buildStoneProgressionSlots(lifetimeXp: number, assignments: Record<string, number>, throughXp?: number, permanentColorless?: number, slotOrder?: readonly (string | null)[] | null, 
/** `visible` draws reached milestones plus the one upcoming breakpoint. `full` keeps the canonical track. */
spanMode?: 'full' | 'visible'): StoneProgressSlot[];
export declare function chunkSlots<T>(slots: T[], size: number): T[][];
/** Boxes on one Lifetime XP line: two Start Stones, then one box every 20 XP through `span`. */
export declare function lifetimeLineSlotCount(span?: number): number;
/**
 * First line runs through 660 Lifetime XP. XP past that adds boxes on the
 * next line; a full line starts another one instead of reshuffling the first.
 */
export declare function chunkLifetimeSlots<T>(slots: T[], lineSize?: number): T[][];
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
/** Total Stones for Rank 4: Normal 1+2+4+8 = 15, Premium 2+4+6+8 = 20. */
export declare function maxStoneCommitment(premium: boolean): number;
/** Passive Skill Value on the compressed scale. */
export declare function passiveSkillValue(attributeValue: number): number;
//# sourceMappingURL=v099-rules.d.ts.map