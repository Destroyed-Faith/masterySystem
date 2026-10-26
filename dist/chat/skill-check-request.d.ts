/**
 * Chat-driven Skill Check requests (Destroyed Faith).
 *
 * GM publishes one interactive ChatMessage from Rolls.
 * Players join / propose via socket → GM applies ChatMessage updates.
 * Approved players roll with compact controls (no second full Skill dialog).
 * Results update the same card automatically; GM may Close Check.
 */
import { type SkillCheckSkillRef } from '../rules/index.js';
import { type SkillCheckComparativeMeta, type SkillCheckRequestMode, type SkillCheckRequestPayload } from './skill-check-request-state.js';
export { SKILL_CHECK_REQUEST_SCHEMA, approvedAssignment, canActorJoinRequest, readyToFinalize, type SkillCheckComparativeMeta, type SkillCheckParticipant, type SkillCheckRequestMode, type SkillCheckRequestPayload, } from './skill-check-request-state.js';
export declare function readSkillCheckRequest(message: any): SkillCheckRequestPayload | null;
export declare function assignmentForActor(payload: SkillCheckRequestPayload, actorId: string): {
    skill: SkillCheckSkillRef;
    attributeKey: string;
    baseTn: number;
    taskDescription: string;
    mode: SkillCheckRequestMode;
    allowedSkills?: SkillCheckSkillRef[];
};
export declare function showSkillCheckRequestDialog(): Promise<void>;
export declare function createSkillCheckRequest(input: {
    title?: string;
    taskDescription: string;
    note: string;
    baseTn: number;
    mode?: SkillCheckRequestMode;
    showTn?: boolean;
    invitedActorIds?: string[];
    comparative?: SkillCheckComparativeMeta;
}): Promise<ChatMessage | null>;
/**
 * Execute an already-approved Skill Check without the large configuration dialog.
 */
export declare function executeApprovedSkillRoll(opts: {
    actor: any;
    payload: SkillCheckRequestPayload;
    messageId: string;
    paidRaises?: number;
    declareSkillCrit?: boolean;
}): Promise<void>;
/**
 * Sheet entry for an approved chat request: compact Paid Raises / Crit confirm only
 * (never the full Skill Check configuration dialog).
 */
export declare function openSkillCheckForRequest(actor: any, payload: SkillCheckRequestPayload, messageId: string): Promise<void>;
/** Kept for tests — consolidated HTML helper (no longer auto-published). */
export declare function buildConsolidatedResultsHtml(payload: SkillCheckRequestPayload): string;
export declare function findOpenSkillCheckRequestForActor(actorId: string, preferredSkillId?: string): {
    message: any;
    payload: SkillCheckRequestPayload;
} | null;
export declare function registerSkillCheckRequestHandlers(): void;
//# sourceMappingURL=skill-check-request.d.ts.map