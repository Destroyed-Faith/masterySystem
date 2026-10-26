/**
 * Start Skill workflows from the unified Rolls dialog.
 * Publishes one open chat-driven Skill Check request (players join & propose).
 * Group Ambush still publishes Comparative request with ambush flag for chat resolution.
 */
import type { RollsComparativeConfig, RollsSkillMode } from './rolls-skill-panel.js';
export interface RollsSkillStartInput {
    title?: string;
    taskDescription: string;
    note: string;
    showTn: boolean;
    mode: RollsSkillMode;
    /** Default Base TN for Standard checks. */
    baseTn: number;
    /** Optional audience restriction; empty = open join. */
    invitedActorIds: string[];
    comparative: RollsComparativeConfig;
}
export declare function startSkillWorkflowFromRolls(input: RollsSkillStartInput): Promise<{
    ok: boolean;
    error?: string;
    message?: ChatMessage | null;
}>;
//# sourceMappingURL=rolls-skill-start.d.ts.map