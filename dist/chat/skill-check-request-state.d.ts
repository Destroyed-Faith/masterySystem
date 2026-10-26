/**
 * Pure state helpers for chat-driven Skill Check requests.
 * No Foundry globals — unit-testable.
 */
import type { SkillCheckSkillRef } from '../rules/index.js';
export declare const SKILL_CHECK_REQUEST_SCHEMA: "df-skill-check-request-chat-driven-2026-10-26";
export type SkillCheckRequestMode = 'standard' | 'comparative';
export type SkillCheckLifecycle = 'open' | 'rolling' | 'completed' | 'cancelled';
export type ParticipantStatus = 'declined' | 'proposed' | 'rejected' | 'approved' | 'rolled';
export interface SkillCheckComparativeMeta {
    source: 'npc' | 'virtual';
    npcActorId?: string;
    npcSkillKey?: string;
    npcAttributeKey?: string;
    virtual?: {
        name: string;
        skillName: string;
        poolDice: number;
        masteryRank: number;
        skillRank: number;
        attributeKey: string;
        allowSkillCrit: boolean;
    };
    groupAmbush?: boolean;
    ambushParticipantIds?: string[];
    stealthSpecialistId?: string;
}
export interface SkillCheckParticipant {
    actorId: string;
    status: ParticipantStatus;
    proposedSkill?: SkillCheckSkillRef;
    proposedAttributeKey?: string;
    explanation?: string;
    skill?: SkillCheckSkillRef;
    attributeKey?: string;
    baseTn?: number;
    paidRaises?: number;
    finalTn?: number;
    rollTotal?: number;
    success?: boolean;
    comparativeOutcome?: 'wins' | 'loses' | 'tie-defender';
}
export interface SkillCheckRequestPayload {
    schema: typeof SKILL_CHECK_REQUEST_SCHEMA;
    requestId: string;
    lifecycle: SkillCheckLifecycle;
    title: string;
    taskDescription: string;
    note: string;
    mode: SkillCheckRequestMode;
    /** Default Base TN for Standard checks (GM may override per participant). */
    baseTn: number;
    showTn: boolean;
    /**
     * Optional audience restriction. Empty = any eligible PC may join.
     * When non-empty, only listed actor ids may Participate.
     */
    invitedActorIds: string[];
    participants: Record<string, SkillCheckParticipant>;
    comparative?: SkillCheckComparativeMeta;
    opposition?: {
        rolled: boolean;
        total: number;
        label: string;
    };
    resultsPublished?: boolean;
    createdBy: string;
}
export declare function canActorJoinRequest(payload: SkillCheckRequestPayload, actorId: string): boolean;
export declare function applyDecline(payload: SkillCheckRequestPayload, actorId: string): SkillCheckRequestPayload;
export declare function applyProposal(payload: SkillCheckRequestPayload, actorId: string, proposal: {
    skill: SkillCheckSkillRef;
    attributeKey: string;
    explanation?: string;
}): SkillCheckRequestPayload;
export declare function applyReject(payload: SkillCheckRequestPayload, actorId: string): SkillCheckRequestPayload;
export declare function applyApprove(payload: SkillCheckRequestPayload, actorId: string, opts?: {
    skill?: SkillCheckSkillRef;
    attributeKey?: string;
    baseTn?: number;
}): SkillCheckRequestPayload;
export declare function applyRollResult(payload: SkillCheckRequestPayload, actorId: string, result: {
    paidRaises?: number;
    finalTn?: number;
    rollTotal?: number;
    success?: boolean;
    comparativeOutcome?: 'wins' | 'loses' | 'tie-defender';
}): SkillCheckRequestPayload;
export declare function approvedAssignment(payload: SkillCheckRequestPayload, actorId: string): {
    skill: SkillCheckSkillRef;
    attributeKey: string;
    baseTn: number;
    taskDescription: string;
    mode: SkillCheckRequestMode;
} | null;
/** True when every active (non-declined) participant has finished or none remain. */
export declare function readyToFinalize(payload: SkillCheckRequestPayload): boolean;
export declare function listJoinableActorIds(payload: SkillCheckRequestPayload, allPcIds: string[]): string[];
export declare function proposalFingerprint(p: SkillCheckParticipant): string;
export declare function skillsMatch(a: SkillCheckSkillRef | undefined, b: SkillCheckSkillRef | undefined): boolean;
//# sourceMappingURL=skill-check-request-state.d.ts.map