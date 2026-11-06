/**
 * Beta Profession Respec — optional GM World Setting.
 *
 * When enabled, a player may replace one of their original four starting
 * Professions (catalogue or custom) while keeping Rank and invested XP.
 * Perception is never touched. Disabling the setting blocks free replacement
 * but leaves normal XP advancement alone.
 */
import { paidSpecializations, type SpecializationRecord } from './specializations.js';
export declare const PROFESSION_RESPEC_SETTING: "allowProfessionRespecBeta";
export declare function isProfessionRespecEnabled(settings?: {
    get?: (scope: string, key: string) => unknown;
} | null | undefined): boolean;
/**
 * Mark the first four paid Professions as starting slots when none are stamped yet.
 * Safe and repeatable for pre-update characters.
 */
export declare function ensureStartingProfessionSlots(specs: SpecializationRecord[]): SpecializationRecord[];
export declare function isRespecableProfession(specs: SpecializationRecord[], id: string): boolean;
export interface ProfessionRespecInput {
    replaceId: string;
    name: string;
    /** Optional legacy fluff; no longer required. */
    origin?: string;
    scope: string;
    category?: string;
}
export interface ProfessionRespecPlan {
    ok: boolean;
    error?: string;
    specializations: SpecializationRecord[];
    preservedRank: number;
    previousName: string;
    nextName: string;
}
/**
 * Replace one starting Profession in place. Rank and startingSlot stay;
 * XP is never refunded or charged. Perception is refused.
 */
export declare function planProfessionRespec(specs: SpecializationRecord[], input: ProfessionRespecInput): ProfessionRespecPlan;
/** Count paid starting slots (for tests / UI). */
export declare function countStartingProfessionSlots(specs: SpecializationRecord[]): number;
export declare function listRespecableProfessions(specs: SpecializationRecord[]): SpecializationRecord[];
/** Re-export helper used by UI to confirm paid-only lists. */
export { paidSpecializations };
//# sourceMappingURL=profession-respec.d.ts.map