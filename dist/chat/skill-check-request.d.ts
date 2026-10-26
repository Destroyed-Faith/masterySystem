/**
 * Chat-driven Skill Check requests (Destroyed Faith).
 *
 * GM publishes one interactive ChatMessage from Rolls.
 * Players join voluntarily, propose Skill + Attribute.
 * GM approves / modifies / rejects inline.
 * Approved players roll via the existing Skill Check engine.
 * GM finalizes → one consolidated results card.
 */
import { type SkillCheckSkillRef } from '../rules/index.js';
import { type SkillCheckComparativeMeta, type SkillCheckRequestMode, type SkillCheckRequestPayload } from './skill-check-request-state.js';
export { SKILL_CHECK_REQUEST_SCHEMA, approvedAssignment, canActorJoinRequest, readyToFinalize, type SkillCheckComparativeMeta, type SkillCheckParticipant, type SkillCheckRequestMode, type SkillCheckRequestPayload, } from './skill-check-request-state.js';
export declare function readSkillCheckRequest(message: any): SkillCheckRequestPayload | null;
/**
 * Authoritative assignment for an approved (or rolled) participant.
 * Used by the roll dialog / sheet entry points.
 */
export declare function assignmentForActor(payload: SkillCheckRequestPayload, actorId: string): {
    skill: SkillCheckSkillRef;
    attributeKey: string;
    baseTn: number;
    taskDescription: string;
    mode: SkillCheckRequestMode;
    allowedSkills?: SkillCheckSkillRef[];
};
/** Competing standalone dialog retired → open Rolls. */
export declare function showSkillCheckRequestDialog(): Promise<void>;
export declare function createSkillCheckRequest(input: {
    title?: string;
    taskDescription: string;
    note: string;
    baseTn: number;
    mode?: SkillCheckRequestMode;
    showTn?: boolean;
    /** Optional audience restriction; empty = open join. */
    invitedActorIds?: string[];
    comparative?: SkillCheckComparativeMeta;
}): Promise<ChatMessage | null>;
export declare function openSkillCheckForRequest(actor: any, payload: SkillCheckRequestPayload, messageId: string): Promise<void>;
export declare function buildConsolidatedResultsHtml(payload: SkillCheckRequestPayload): string;
/** Find an open approved request for this actor (sheet entry). */
export declare function findOpenSkillCheckRequestForActor(actorId: string, preferredSkillId?: string): {
    message: any;
    payload: SkillCheckRequestPayload;
} | null;
export declare function registerSkillCheckRequestHandlers(): void;
//# sourceMappingURL=skill-check-request.d.ts.map