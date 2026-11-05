/**
 * Freely named Professions. Stored on `system.specializations` so existing
 * summon maps, export, and XP history keep their key. Legacy rows may still
 * carry a Field; new rows use `origin` and an id of `profession:<name>`.
 * The 90-entry catalogue is suggestion data only — never a whitelist.
 */
export declare const SKILL_FIELDS: readonly ["physical", "finesse", "survival", "science-craft", "occult", "social", "investigation", "perception"];
export type SkillField = (typeof SKILL_FIELDS)[number];
/** Fields a player may choose for paid Specializations (excludes universal Perception). */
export declare const PAID_SKILL_FIELDS: readonly SkillField[];
export declare const SKILL_FIELD_LABELS: Record<SkillField, string>;
export interface SpecializationRecord {
    /** Stable identity key. New rows: `profession:<name>`. Legacy rows may be `field:name`. */
    id: string;
    name: string;
    /** Legacy Field. Omitted on new Profession rows. */
    field?: SkillField;
    /** How the character acquired this Profession. */
    origin?: string;
    /** One-sentence agreed scope. */
    scope: string;
    /** Optional catalogue category (Trades / Wilderness / Society / Conflict / Knowledge). */
    category?: string;
    /**
     * True for one of the four free creation Professions.
     * Used by Beta Profession Respec; omitted on later XP-learned rows.
     */
    startingSlot?: boolean;
    rank: number;
}
export declare function normalizeSpecializationName(name: string): string;
export declare function specializationIdentityKey(name: string, field: SkillField): string;
/** Identity for a new Profession. Not derived from a Field. */
export declare function professionIdentityKey(name: string): string;
/** True when this row still uses the pre-K8 Field identity. */
export declare function isLegacyFieldSpecialization(spec: Pick<Partial<SpecializationRecord>, 'id' | 'field' | 'name'>): boolean;
export declare function isSkillField(value: string | null | undefined): value is SkillField;
export interface SpecializationValidation {
    ok: boolean;
    errors: string[];
}
/** Free universal Perception — not one of the four starting Professions. */
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
 * Highest Rank among medical Professions: name or scope covers practical wound
 * care (medicine, medic, physician, surgery, first aid). One healer only —
 * ranks are not added together. Legacy Science & Craft rows named like medicine
 * still qualify.
 */
export declare function medicineSpecializationRank(system: any): number;
/** Closed Summon task list (owner mapping). */
export declare const SUMMON_TASKS: readonly ["perception", "tracking", "navigation", "weather-sense", "stealth", "concealment", "athletics", "acrobatics", "search", "survival"];
export type SummonTask = (typeof SUMMON_TASKS)[number];
export declare function summonTaskSlotCount(boundStones: number): number;
/**
 * Dice cap for a Summon task: Perception uses 2×owner MR; others 2×one mapped Profession Rank.
 * An unrelated Profession (scope does not cover the task) contributes 0.
 */
export declare function summonSkillDiceCap(opts: {
    task: SummonTask;
    ownerMasteryRank: number;
    matchingSpecializationRank?: number;
    scopeCoversTask?: boolean;
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