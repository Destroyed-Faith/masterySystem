/**
 * Pure Specialization roll planning + list helpers (DF Players Guide 2026-10-24).
 *
 * - Trained roll: Attribute dice, Keep = Mastery Rank, Raises from Spec Rank.
 * - Untrained roll (no matching Spec): full Attribute pool with Disadvantage, 0 Raises.
 * - Task Level × 4 = Base TN; each Paid Raise adds +4 TN.
 * - Free Raises are NOT chosen pre-roll; they unlock automatically on success.
 */
import { type SkillRaiseAllowance } from './skill-raises.js';
import { type SkillField, type SpecializationRecord } from './specializations.js';
export declare const SPECIALIZATION_MAX_RANK = 8;
export declare const SPEC_ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export type SpecAttributeKey = (typeof SPEC_ATTRIBUTE_KEYS)[number];
export interface SpecializationRollPlanInput {
    /** Spec Rank; 0 / undefined / null = untrained. */
    rank?: number | null;
    attributeValue: number;
    masteryRank: number;
    /** Prefer `baseTn` when the GM sets an explicit TN (e.g. opposed). */
    taskLevel?: number;
    baseTn?: number;
    paidRaises?: number;
    /**
     * @deprecated Free Raises are automatic on success — ignored for TN / pre-roll validation.
     * Retained so older callers compile; output `freeRaises` is the Rank free allowance.
     */
    freeRaises?: number;
}
export interface SpecializationRollPlan {
    ok: boolean;
    error?: string;
    trained: boolean;
    rank: number;
    allowance: SkillRaiseAllowance;
    taskLevel: number;
    baseTn: number;
    paidRaises: number;
    /** Free Raises available after a successful check (not chosen pre-roll). */
    freeRaises: number;
    finalTn: number;
    numDice: number;
    keepDice: number;
    rollDisadvantage: boolean;
}
/** Validate Paid Raises BEFORE the roll and compute pool / TN. Free = Rank allowance on success. */
export declare function planSpecializationRoll(input: SpecializationRollPlanInput): SpecializationRollPlan;
/** Normalized read of `system.specializations` (array or keyed object). */
export declare function readSpecializations(system: any): SpecializationRecord[];
export declare function findSpecializationById(specs: SpecializationRecord[], id: string | null | undefined): SpecializationRecord | null;
/** Match a Spec by free name (case/diacritics-insensitive). */
export declare function findSpecializationByName(specs: SpecializationRecord[], name: string): SpecializationRecord | null;
export declare function upsertSpecialization(specs: SpecializationRecord[], record: SpecializationRecord, replaceId?: string): SpecializationRecord[];
export declare function removeSpecialization(specs: SpecializationRecord[], id: string): SpecializationRecord[];
/** XP cost to advance one Spec Rank (flat). */
export declare function specializationRankUpCost(currentRank: number): number;
export declare function canRankUpSpecialization(spec: Pick<SpecializationRecord, 'rank'>): boolean;
/** Return a new list with Spec `id` raised one Rank; null if impossible. */
export declare function rankUpSpecialization(specs: SpecializationRecord[], id: string): SpecializationRecord[] | null;
export interface SpecializationSheetRow {
    id: string;
    name: string;
    field: SkillField;
    fieldLabel: string;
    scope: string;
    rank: number;
    maxPaid: number;
    maxFree: number;
    maxTotal: number;
    allowanceLabel: string;
    /** Passive Skill Value with the character's best Attribute (2 × Attribute). */
    passiveBest: number;
    passiveBestAttribute: string;
    passiveHint: string;
}
/** Sheet-ready rows: Field label, raise allowance, passive hint. */
export declare function buildSpecializationSheetRows(specs: SpecializationRecord[], attributeValues: Partial<Record<string, number>>): SpecializationSheetRow[];
//# sourceMappingURL=specialization-roll.d.ts.map