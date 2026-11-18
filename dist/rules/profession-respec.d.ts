/**
 * Profession Respec — replace a free starting Profession in place.
 *
 * GM may always replace an uninvested Rank-2 starting Profession (no XP change).
 * Players may do the same only when World Setting `allowProfessionRespecBeta` is on.
 * Once XP is invested (or Rank rises past 2), the starting Profession is locked.
 * Perception is never touched.
 */
import { paidSpecializations, type SpecializationRecord } from './specializations.js';
export declare const PROFESSION_RESPEC_SETTING: "allowProfessionRespecBeta";
export declare function isProfessionRespecEnabled(settings?: {
    get?: (scope: string, key: string) => unknown;
} | null | undefined): boolean;
/**
 * Mark the first four paid Professions as starting slots when none are stamped yet.
 * Used for legacy / migrated characters. Does not convert later XP-learned rows when
 * any startingSlot already exists (GM Grant restores missing slots explicitly).
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
 * Replace one uninvested Rank-2 starting Profession in place.
 * Rank and startingSlot stay; XP is never refunded or charged.
 */
export declare function planProfessionRespec(specs: SpecializationRecord[], input: ProfessionRespecInput): ProfessionRespecPlan;
/** Count paid starting slots (for tests / UI). */
export declare function countStartingProfessionSlots(specs: SpecializationRecord[]): number;
export declare function listRespecableProfessions(specs: SpecializationRecord[]): SpecializationRecord[];
/** Re-export helper used by UI to confirm paid-only lists. */
export { paidSpecializations };
//# sourceMappingURL=profession-respec.d.ts.map