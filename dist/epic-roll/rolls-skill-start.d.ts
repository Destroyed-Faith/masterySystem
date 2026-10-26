/**
 * Start Skill workflows from the unified Rolls (epic-roll-config) dialog.
 * Standard → createSkillCheckRequest (DF Skill Check engine).
 * Comparative / Group Ambush → same dice engine + comparative resolution.
 */
import { type RollsAllowedApproach, type RollsComparativeConfig, type RollsParticipantSkillRow, type RollsSkillMode } from './rolls-skill-panel.js';
export interface RollsSkillStartInput {
    taskDescription: string;
    note: string;
    showTn: boolean;
    mode: RollsSkillMode;
    approaches: RollsAllowedApproach[];
    participantRows: RollsParticipantSkillRow[];
    allowPlayerSuggestions: boolean;
    comparative: RollsComparativeConfig;
    /** When true, skip auto-open of player overlays after create (unused). */
    skipOverlays?: boolean;
}
/** Ensure every selected actor has a participant row (from approaches or defaults). */
export declare function ensureParticipantRows(actorIds: string[], existing: RollsParticipantSkillRow[], approaches: RollsAllowedApproach[], fallbackTn: number): RollsParticipantSkillRow[];
export declare function startStandardSkillFromRolls(input: RollsSkillStartInput): Promise<ChatMessage | null>;
/**
 * Comparative Skill Check: open player Skill Check requests (no TN / no Raises),
 * then roll opposition and post a comparison card when players finish.
 * For GM-driven immediate compare (Group Ambush / quick opposition), use
 * `startComparativeImmediateFromRolls`.
 */
export declare function startComparativeSkillFromRolls(input: RollsSkillStartInput): Promise<ChatMessage | null>;
export declare function startGroupAmbushFromRolls(input: RollsSkillStartInput): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function startSkillWorkflowFromRolls(input: RollsSkillStartInput): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function approachSkillKeys(approaches: RollsAllowedApproach[]): string[];
export declare function resolveRankForRow(actor: any, row: RollsParticipantSkillRow): number;
//# sourceMappingURL=rolls-skill-start.d.ts.map