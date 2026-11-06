/**
 * Summon natural noncombat tasks — owner Profession / Perception Training Rolls.
 *
 * There is no Summon Skill list and no Summon Skill Dice pool. A plausible
 * animal-like task uses the owner's Attribute Pool, MR Keep, and one eligible
 * Profession (or free Perception), with Training Advantage / Crit unchanged.
 */
import { type SpecializationRecord } from '../rules/specializations.js';
declare const ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export type SummonNaturalAttribute = (typeof ATTRIBUTE_KEYS)[number];
/** Categories the GM may reject as non-transferable humanoid professional work. */
export declare const SUMMON_FORBIDDEN_TASK_KINDS: readonly ["social", "craft", "scholarship", "language", "medical", "ritual", "negotiation", "persuasion", "forging", "alchemy", "surgery", "documents"];
export type SummonForbiddenTaskKind = (typeof SUMMON_FORBIDDEN_TASK_KINDS)[number];
/** Stable one-check key for a Bond natural task (Profession + description slug). */
export declare function buildSummonNaturalTaskKey(description: string, professionId: string): string;
export interface SummonNaturalTaskInput {
    /** Free-text description of the creature's natural method. */
    taskDescription: string;
    /** Optional GM/policy classification used by acceptance helpers. */
    taskKind?: string;
    attributeKey: SummonNaturalAttribute | string;
    /** Profession id, Perception id, or empty for Perception-only independent observation. */
    professionId?: string | null;
    /** Player explanation of why the owner's training applies to this creature. */
    transferExplanation?: string;
    /** GM must approve a non-Perception Profession transfer. */
    gmApproved?: boolean;
    declareTrainingCrit?: boolean;
    /** When true, this is independent natural Perception (owner Perception Rank). */
    independentPerception?: boolean;
    /** Owner viewing through a purchased Shared Sense (still uses owner Perception). */
    sharedSenseActive?: boolean;
    /** Body actually has the named Shared Sense purchased. */
    bodyHasSharedSense?: boolean;
    /** Required purchased Power id, if the fiction needs one. */
    requiredPowerId?: string | null;
    /** Powers present on the acting Body. */
    bodyPowerIds?: string[];
    /** Bond id — one check per task per Bond (caller tracks). */
    bondId?: string;
    /** Already-resolved task keys for this Bond this scene (caller-supplied). */
    resolvedTaskKeys?: string[];
    taskKey?: string;
}
export interface SummonNaturalTaskPlan {
    ok: boolean;
    error?: string;
    /** Soft rejection the UI/GM can show without rolling. */
    rejected?: boolean;
    rejectReason?: string;
    attributeKey: SummonNaturalAttribute;
    poolDice: number;
    keepDice: number;
    profession: SpecializationRecord | null;
    skillAdvantageRerollMax: number;
    rollDisadvantage: false;
    canDeclareTrainingCrit: boolean;
    trainingCritRemaining: number;
    usesPerception: boolean;
    flavor: string;
}
/**
 * Pure planner — no Foundry writes. GM rejection and forbidden-task heuristics
 * are explicit; the planner never invents eligibility from Profession titles alone.
 */
export declare function planSummonNaturalTask(owner: any, input: SummonNaturalTaskInput): SummonNaturalTaskPlan;
/** Acceptance helpers used by tests and GM tools. */
export declare function summonTaskAllowsProfessionTransfer(opts: {
    taskDescription: string;
    taskKind?: string;
}): {
    ok: boolean;
    reason?: string;
};
export declare function executeSummonNaturalTask(owner: any, input: SummonNaturalTaskInput, opts?: {
    skipChat?: boolean;
}): Promise<{
    ok: boolean;
    plan: SummonNaturalTaskPlan;
    total?: number;
    error?: string;
}>;
export {};
//# sourceMappingURL=summon-natural-task.d.ts.map