/**
 * DF 2026-10-23 migration review — pure planning / update helpers (no Foundry globals).
 *
 * The review dialog (`df-2026-migration-review-dialog.ts`) is a thin UI on top
 * of these functions so the rules stay unit-testable:
 *
 * - Legacy Skills (name + rating) are listed for reference; names can be copied
 *   into five new Specializations. Every saved Spec is forced to Rank 2
 *   (starting budget: five × Rank 2). Legacy ratings are never converted.
 * - Minor Expressions with no exact Echo Imprint mapping are listed as
 *   "unmapped" so the GM can pick an Imprint by hand.
 * - Imprint proposals exceeding Mastery Rank are flagged for trimming.
 * - Saving writes ONLY `system.specializations`, `system.echoImprints` and a
 *   review-stamp flag. XP / Stones / Powers / Artifacts are never touched.
 */
import { type EchoImprintAttribute, type SkillField, type SpecializationRecord } from '../rules/index.js';
/** Flag key stamped on an actor once the GM saved its review. */
export declare const DF_2026_REVIEWED_FLAG = "df2026ReviewedAt";
/** One rated legacy Skill from the migration snapshot (display / copy only). */
export interface LegacySkillRow {
    skillKey: string;
    name: string;
    field: SkillField;
    /** Legacy rating — never converted to a Specialization Rank. */
    rating: number;
    categoryLabel: string;
}
export interface SpecSuggestion {
    /** Legacy skill key (e.g. `stealth`). */
    skillKey: string;
    /** Suggested free name — the legacy skill's display name. */
    suggestedName: string;
    suggestedField: SkillField;
    /** Legacy rating, shown for context only. It is NEVER converted to a Rank. */
    legacyRating: number;
}
export interface UnmappedExpression {
    id: string;
    name: string;
    attribute: string;
}
export interface Df2026ReviewPlan {
    actorId: string;
    actorName: string;
    masteryRank: number;
    /** All rated legacy Skills from the snapshot (always shown in the review UI). */
    legacySkills: LegacySkillRow[];
    /** Copy-as-Spec chips; excludes names the character already has as a Specialization. */
    specSuggestions: SpecSuggestion[];
    currentSpecializations: SpecializationRecord[];
    unmappedExpressions: UnmappedExpression[];
    /** Imprint ids that map 1:1 from legacy Minor Expressions. */
    mappedImprintIds: string[];
    currentImprintIds: string[];
    /** current ∪ mapped, in order, before trimming. */
    proposedImprintIds: string[];
    /** Imprints beyond Mastery Rank that must be dropped. */
    trimmedImprintIds: string[];
    /** Set when proposed Imprints exceed Mastery Rank. */
    imprintTrimWarning: string | null;
    warnings: string[];
    alreadyReviewed: boolean;
    /** True when there is something for the GM to decide. */
    needsReview: boolean;
}
export interface Df2026ReviewInput {
    specializations: Array<Partial<SpecializationRecord>>;
    echoImprints: string[];
}
export interface Df2026ReviewUpdateResult {
    ok: boolean;
    errors: string[];
    /** Foundry update payload — only Spec / Imprint / review-stamp keys. */
    update: Record<string, unknown> | null;
    specializations: SpecializationRecord[];
    echoImprints: string[];
}
/** Build the per-character review plan. Never mutates the actor. */
export declare function buildDf2026ReviewPlan(actor: any): Df2026ReviewPlan;
/** Review plans for every character; by default only those with open decisions. */
export declare function listDf2026ReviewPlans(actors: Iterable<any> | null | undefined, opts?: {
    includeReviewed?: boolean;
    onlyIds?: string[];
}): Df2026ReviewPlan[];
/**
 * Normalize one GM-entered Specialization row.
 * Migration starter Specs are always Rank 2 (starting budget) — legacy ratings
 * and any typed Rank are ignored.
 */
export declare function normalizeReviewSpecialization(raw: Partial<SpecializationRecord>): SpecializationRecord | null;
/**
 * Validate GM input and build the actor update. Touches ONLY
 * `system.specializations`, `system.echoImprints` and the review stamp flag.
 * Specializations must be exactly five at Rank 2 (same as character creation).
 */
export declare function buildDf2026ReviewUpdate(actor: any, input: Df2026ReviewInput, now?: Date): Df2026ReviewUpdateResult;
/** Validate and write one character's review. */
export declare function applyDf2026Review(actor: any, input: Df2026ReviewInput): Promise<Df2026ReviewUpdateResult>;
/** Catalogue helper for the dialog: Imprints grouped by attribute. */
export declare function imprintsByAttribute(): Array<{
    attribute: EchoImprintAttribute;
    imprints: Array<{
        id: string;
        name: string;
    }>;
}>;
//# sourceMappingURL=df-2026-migration-review-plan.d.ts.map