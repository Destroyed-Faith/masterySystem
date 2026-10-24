/**
 * Ordinary Skill Check helpers (DF 2026-10-24 — GM-defined checks).
 *
 * GM defines: task, Attribute, Specialization/Untrained, Base TN.
 * Player declares only Paid Raises before rolling.
 * Free Raises unlock on success; effects allocate on the result chat card.
 */
import { type SkillRaiseAllowance, type SkillRaiseEffectAllocation } from './skill-raises.js';
import { type SpecAttributeKey } from './specialization-roll.js';
import type { SpecializationRecord } from './specializations.js';
/** Universal free starting Perception acts as Rank 2 when no Spec is present. */
export declare const UNIVERSAL_PERCEPTION_RANK = 2;
export type SkillCheckSkillRef = {
    kind: 'specialization';
    id: string;
} | {
    kind: 'perception';
} | {
    kind: 'untrained';
}
/** NPC/Summon situational pool entry (system.situationalSkills). */
 | {
    kind: 'npc-situational';
    id: string;
};
/**
 * Source of the check definition.
 * - `gm-request`: server-verified chat request; Attribute/Skill/TN locked from payload.
 * - `sheet-verbal`: locally recorded GM-announced values (not server-verified).
 */
export type SkillRollSource = {
    kind: 'gm-request';
    requestId: string;
    requestMessageId?: string;
    gmVerified: true;
    taskDescription: string;
    attributeKey: string;
    baseTn: number;
    skill: SkillCheckSkillRef;
    /** Limited GM-approved alternatives (optional). */
    allowedSkills?: SkillCheckSkillRef[];
} | {
    kind: 'sheet-verbal';
    gmVerified: false;
    taskDescription: string;
    attributeKey: string;
    baseTn: number;
    skill: SkillCheckSkillRef;
};
export type SkillCheckAllocationStatus = 'pending' | 'finalized' | 'not-applicable';
export interface SkillCheckDraft {
    actorId: string;
    /** Only player-chosen pre-roll value. */
    paidRaises: number;
    /**
     * Skill / Attribute / Base TN / task — mirrored for convenience; authoritative
     * values always come from `source` via `authoritativeCheckContext`.
     */
    skill: SkillCheckSkillRef;
    attributeKey: SpecAttributeKey | string;
    baseTn: number;
    taskDescription?: string;
    source: SkillRollSource;
    /**
     * When set (NPC situational skill), pool = poolDice keep MR and Rank comes
     * from this snapshot — Attribute does not size the pool.
     */
    npcSituational?: {
        skillId: string;
        skillName: string;
        poolDice: number;
        skillRank: number;
    };
}
export interface AuthoritativeCheckContext {
    taskDescription: string;
    attributeKey: string;
    baseTn: number;
    skill: SkillCheckSkillRef;
    gmVerified: boolean;
    sourceKind: 'gm-request' | 'sheet-verbal';
    requestId?: string;
    allowedSkills?: SkillCheckSkillRef[];
}
export interface SkillCheckResolvedSnapshot {
    actorId: string;
    requestId?: string;
    taskDescription: string;
    skillName: string;
    skillRankAtRoll: number;
    attributeKey: string;
    attributeValue: number;
    masteryRank: number;
    numDice: number;
    keepDice: number;
    baseTn: number;
    paidRaisesDeclared: number;
    freeRaisesAvailableAtSuccess: number;
    finalTn: number;
    rollTotal: number;
    success: boolean;
    allocationStatus: SkillCheckAllocationStatus;
    effectAllocation: SkillRaiseEffectAllocation;
    proposedBenefit: string;
    sourceKind: 'gm-request' | 'sheet-verbal';
    gmVerified: boolean;
}
export interface SkillCheckPlan {
    ok: boolean;
    error?: string;
    missing?: string[];
    trained: boolean;
    skillName: string;
    rank: number;
    allowance: SkillRaiseAllowance;
    attributeKey: string;
    attributeValue: number;
    masteryRank: number;
    baseTn: number;
    taskDescription: string;
    paidRaises: number;
    freeRaisesOnSuccess: number;
    finalTn: number;
    numDice: number;
    keepDice: number;
    rollDisadvantage: boolean;
    paidOptions: Array<{
        paid: number;
        finalTn: number;
        label: string;
    }>;
    showFreeBanner: boolean;
    gmVerified: boolean;
    sourceKind: 'gm-request' | 'sheet-verbal';
}
export declare function isSpecAttributeKey(value: string): value is SpecAttributeKey;
export declare function taskLevelFromBaseTn(baseTn: number): number;
export declare function baseTnPresets(): number[];
export declare function skillRefKey(ref: SkillCheckSkillRef): string;
export declare function skillRefsEqual(a: SkillCheckSkillRef, b: SkillCheckSkillRef): boolean;
/** Resolve Perception Rank: Spec named Perception if present, else universal Rank 2. */
export declare function resolvePerceptionRank(system: any): number;
export declare function resolveSkillForDraft(system: any, skill: SkillCheckSkillRef, npcSituational?: SkillCheckDraft['npcSituational']): {
    name: string;
    rank: number;
    spec: SpecializationRecord | null;
    trained: boolean;
};
/** Pull immutable GM-defined fields from the source — never trust mutable draft mirrors. */
export declare function authoritativeCheckContext(draft: SkillCheckDraft): AuthoritativeCheckContext;
/** Apply a GM request assignment onto a draft (Paid Raises preserved). */
export declare function bindDraftToGmRequest(draft: SkillCheckDraft, assignment: {
    requestId: string;
    requestMessageId?: string;
    taskDescription: string;
    attributeKey: string;
    baseTn: number;
    skill: SkillCheckSkillRef;
    allowedSkills?: SkillCheckSkillRef[];
}): SkillCheckDraft;
/**
 * Reject client-side overrides of GM-locked fields.
 * Only `paidRaises` may differ from the authoritative assignment.
 */
export declare function validateAgainstGmAssignment(draft: SkillCheckDraft, assignment: {
    attributeKey: string;
    baseTn: number;
    skill: SkillCheckSkillRef;
    allowedSkills?: SkillCheckSkillRef[];
}): {
    ok: boolean;
    error?: string;
};
export declare function missingGmContextFields(input: {
    taskDescription?: string;
    attributeKey?: string;
    baseTn?: number | null;
    /** NPC situational pools: Attribute is flavor only — not required. */
    npcSituational?: boolean;
}): string[];
/** Plan a Skill Check from a draft (pure; does not roll). */
export declare function planSkillCheckDraft(input: {
    system: any;
    draft: SkillCheckDraft;
    /** When true, reject unknown specialization ids. */
    requireKnownSkill?: boolean;
}): SkillCheckPlan;
/** Build the post-roll snapshot payload stored on chat flags. */
export declare function buildSkillCheckResolvedSnapshot(input: {
    plan: SkillCheckPlan;
    actorId: string;
    source: SkillRollSource;
    rollTotal: number;
    success: boolean;
}): SkillCheckResolvedSnapshot;
export declare function finalizeSkillCheckAllocation(snapshot: SkillCheckResolvedSnapshot, allocation: Partial<SkillRaiseEffectAllocation>, proposedBenefit: string, opts?: {
    allowZero?: boolean;
}): {
    ok: boolean;
    error?: string;
    snapshot: SkillCheckResolvedSnapshot;
};
/** @deprecated Use authoritativeCheckContext — kept for older call sites. */
export declare function authoritativeBaseTn(draft: SkillCheckDraft): number;
//# sourceMappingURL=skill-check.d.ts.map