/**
 * Free-named Specializations organized into seven Fields.
 * Replaces the fixed purchasable Skill catalog.
 */
export declare const SKILL_FIELDS: readonly ["physical", "finesse", "survival", "science-craft", "occult", "social", "investigation", "perception"];
export type SkillField = (typeof SKILL_FIELDS)[number];
/** Fields a player may choose for paid Specializations (excludes universal Perception). */
export declare const PAID_SKILL_FIELDS: readonly SkillField[];
export declare const SKILL_FIELD_LABELS: Record<SkillField, string>;
/** Example free-named Specs per Field (inspiration only — not a closed list). */
export interface SpecializationFieldExample {
    name: string;
    /** One-sentence scope; often reads like a job vignette. */
    scope: string;
}
export declare const SPECIALIZATION_FIELD_EXAMPLES: Record<SkillField, SpecializationFieldExample[]>;
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
/** Free universal Perception Spec — not one of the five paid starting Specs. */
export declare const CHARACTER_PERCEPTION_FIELD: SkillField;
/** Legacy id when Perception was wrongly stored under Investigation. */
export declare const CHARACTER_PERCEPTION_LEGACY_SPEC_ID = "investigation:perception";
export declare const CHARACTER_PERCEPTION_SPEC_ID: string;
export declare const CHARACTER_PERCEPTION_SCOPE = "Notice, search, and read the scene";
/** Matches `UNIVERSAL_PERCEPTION_RANK` in skill-check.ts. */
export declare const CHARACTER_PERCEPTION_MIN_RANK = 2;
/** Attribute Focus options for every Perception Check (Core Skill rules). */
export declare const PERCEPTION_FOCUS_ATTRIBUTES: readonly ["wits", "intellect", "resolve"];
export type PerceptionFocusAttribute = (typeof PERCEPTION_FOCUS_ATTRIBUTES)[number];
export declare function isPerceptionFocusAttribute(value: string | null | undefined): value is PerceptionFocusAttribute;
export declare function isCharacterPerceptionSpec(spec: Pick<Partial<SpecializationRecord>, 'id' | 'name' | 'field'>): boolean;
/** Paid Specs only — free Perception never consumes a starting / review slot. */
export declare function paidSpecializations(specs: Array<Partial<SpecializationRecord>>): Array<Partial<SpecializationRecord>>;
/**
 * Every character has Perception at least Rank 2 (free). Adds the Spec when
 * missing; raises Rank when below the floor. Never lowers a higher Rank.
 */
export declare function ensureCharacterHasPerceptionSpec(system: any): {
    specializations: SpecializationRecord[];
    changed: boolean;
};
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