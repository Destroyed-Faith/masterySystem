/**
 * K8 Profession mapping. Copies legacy Specialization rows forward.
 * Never invents a new occupation (Stealth stays Stealth until someone edits the name).
 */
import { type SpecializationRecord } from '../rules/specializations.js';
export declare const K8_PROFESSIONS_REVIEWED_FLAG = "k8ProfessionsReviewedAt";
export interface ProfessionMappingDraft {
    legacyId: string;
    keep: boolean;
    name: string;
    origin: string;
    scope: string;
    rank: number;
}
export interface ProfessionMappingPlan {
    needsReview: boolean;
    legacy: Array<{
        id: string;
        name: string;
        field?: string;
        scope: string;
        rank: number;
    }>;
    /** Same names and ranks as the stored rows. Not catalogue substitutions. */
    drafts: ProfessionMappingDraft[];
}
export declare function planProfessionMapping(system: any): ProfessionMappingPlan;
export declare function applyProfessionMappingDrafts(system: any, drafts: ProfessionMappingDraft[]): {
    ok: boolean;
    error?: string;
    specializations: SpecializationRecord[];
};
//# sourceMappingURL=profession-mapping-plan.d.ts.map