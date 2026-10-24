/**
 * Shared execution path for ordinary Skill Checks (sheet + GM request).
 * Authoritative Attribute / Skill / Base TN come from the draft source.
 */
import { type SkillCheckDraft, type SkillCheckResolvedSnapshot, type SkillCheckSkillRef } from '../rules/index.js';
export interface ExecuteSkillCheckOptions {
    actor: any;
    draft: SkillCheckDraft;
    flavorExtra?: string;
    /**
     * When rolling from a GM request, pass the authoritative assignment so
     * client-forged Skill / Attribute / TN overrides are rejected.
     */
    gmAssignment?: {
        attributeKey: string;
        baseTn: number;
        skill: SkillCheckSkillRef;
        allowedSkills?: SkillCheckSkillRef[];
    };
}
export interface ExecuteSkillCheckResult {
    ok: boolean;
    error?: string;
    snapshot?: SkillCheckResolvedSnapshot;
}
export declare function executeSkillCheck(opts: ExecuteSkillCheckOptions): Promise<ExecuteSkillCheckResult>;
//# sourceMappingURL=skill-check-execute.d.ts.map