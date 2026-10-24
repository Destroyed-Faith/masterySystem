/**
 * GM ordinary Skill Check request (DF 2026-10-24 GM-defined correction).
 * GM configures Task, Attribute, per-actor Skill, Base TN and targets.
 * Players only choose Paid Raises in the shared overlay.
 */
import { type SkillCheckSkillRef } from '../rules/index.js';
/** Bumped schema: Attribute + per-actor Skill assignment. */
declare const REQUEST_SCHEMA = "df-skill-check-request-gm-defined-2026-10-24";
export interface SkillCheckRequestPayload {
    schema: typeof REQUEST_SCHEMA;
    requestId: string;
    taskDescription: string;
    note: string;
    baseTn: number;
    attributeKey: string;
    /** Default when an actor has no per-actor override (e.g. global Perception). */
    defaultSkill: SkillCheckSkillRef;
    /** Per-recipient Specialization / Perception / Untrained mapping. */
    perActorSkill: Record<string, SkillCheckSkillRef>;
    /**
     * Optional GM-approved alternative methods (rare). When set, players may
     * pick only among these plus their assigned skill.
     */
    allowedSkills?: SkillCheckSkillRef[];
    targetActorIds: string[];
    responses: Record<string, {
        status: 'pending' | 'rolled' | 'skipped';
        paidRaises?: number;
        finalTn?: number;
        rollTotal?: number;
        success?: boolean;
        messageId?: string;
    }>;
    createdBy: string;
}
export declare function readSkillCheckRequest(message: any): SkillCheckRequestPayload | null;
export declare function assignmentForActor(payload: SkillCheckRequestPayload, actorId: string): {
    skill: SkillCheckSkillRef;
    attributeKey: string;
    baseTn: number;
    taskDescription: string;
    allowedSkills?: SkillCheckSkillRef[];
};
/** GM dialog to create a Skill Check request. */
export declare function showSkillCheckRequestDialog(): Promise<void>;
export declare function createSkillCheckRequest(input: {
    taskDescription: string;
    note: string;
    baseTn: number;
    attributeKey: string;
    defaultSkill: SkillCheckSkillRef;
    perActorSkill: Record<string, SkillCheckSkillRef>;
    targetActorIds: string[];
    allowedSkills?: SkillCheckSkillRef[];
}): Promise<ChatMessage | null>;
export declare function openSkillCheckForRequest(actor: any, payload: SkillCheckRequestPayload, messageId: string): Promise<void>;
/** Find an open GM request targeting this actor (optionally matching a Spec id). */
export declare function findOpenSkillCheckRequestForActor(actorId: string, preferredSkillId?: string): {
    message: any;
    payload: SkillCheckRequestPayload;
} | null;
export declare function registerSkillCheckRequestHandlers(): void;
export {};
//# sourceMappingURL=skill-check-request.d.ts.map