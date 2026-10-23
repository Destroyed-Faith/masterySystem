/**
 * Free-named Specializations organized into seven Fields.
 * Replaces the fixed purchasable Skill catalog.
 */
export declare const SKILL_FIELDS: readonly ["physical", "finesse", "survival", "science-craft", "occult", "social", "investigation"];
export type SkillField = (typeof SKILL_FIELDS)[number];
export declare const SKILL_FIELD_LABELS: Record<SkillField, string>;
export interface SpecializationRecord {
    /** Stable identity key (normalized name + field). */
    id: string;
    name: string;
    field: SkillField;
    /** One-sentence scope. */
    scope: string;
    rank: number;
}
export declare function normalizeSpecializationName(name: string): string;
export declare function specializationIdentityKey(name: string, field: SkillField): string;
export declare function isSkillField(value: string | null | undefined): value is SkillField;
export interface SpecializationValidation {
    ok: boolean;
    errors: string[];
}
export declare function validateSpecializationList(specs: Array<Partial<SpecializationRecord>>, opts?: {
    requireStartingBudget?: boolean;
}): SpecializationValidation;
/** Read an actor's Specialization list tolerant of array / keyed-object shapes. */
export declare function readActorSpecializations(system: any): Array<Partial<SpecializationRecord>>;
/**
 * Highest Rank among Medicine-like Specializations: name or scope mentions
 * medicine / medic / healing, or a Science & Craft Spec named Medicine.
 */
export declare function medicineSpecializationRank(system: any): number;
/** Closed Summon task list (owner mapping). */
export declare const SUMMON_TASKS: readonly ["perception", "tracking", "navigation", "weather-sense", "stealth", "concealment", "athletics", "acrobatics", "search", "survival"];
export type SummonTask = (typeof SUMMON_TASKS)[number];
export declare function summonTaskSlotCount(boundStones: number): number;
/** Dice cap for a Summon task: Perception uses 2×owner MR; others 2×one matching Spec Rank. */
export declare function summonSkillDiceCap(opts: {
    task: SummonTask;
    ownerMasteryRank: number;
    matchingSpecializationRank?: number;
}): number;
/** Task → owner Specialization id mapping stored on a Summon Bond. */
export type SummonTaskSpecMap = Partial<Record<SummonTask, string>>;
export declare function isSummonTask(value: string): value is SummonTask;
/** Drop unknown tasks / blank ids from a stored map. */
export declare function normalizeSummonTaskSpecMap(raw: unknown): SummonTaskSpecMap;
/**
 * Validate a Summon Bond's task mapping. Summons never receive Free Raises;
 * the task list is capped by `summonTaskSlotCount(boundStones)`.
 */
export declare function validateSummonTaskSpecMap(opts: {
    map: SummonTaskSpecMap;
    boundStones: number;
    ownerSpecs: Array<Partial<SpecializationRecord>>;
}): string[];
/** Dice cap per mapped task using the mapped owner Spec Rank (Perception: owner MR). */
export declare function summonTaskDiceCaps(opts: {
    map: SummonTaskSpecMap;
    ownerSpecs: Array<Partial<SpecializationRecord>>;
    ownerMasteryRank: number;
}): Partial<Record<SummonTask, number>>;
/** Summons never receive Free Raises (DF 2026). */
export declare const SUMMON_FREE_RAISES = 0;
//# sourceMappingURL=specializations.d.ts.map