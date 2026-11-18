/**
 * Epic Mastery Roll — participant roll execution.
 */
import { masteryRoll } from '../dice/roll-handler.js';
import type { EpicMasteryRollSession, EpicParticipantResult } from './epic-mastery-roll-types.js';
export interface EpicRollBuiltContext {
    label: string;
    attributeKey?: string;
    isSkillRoll: boolean;
    baseModifier: number;
    raiseTn: number;
    rollOptions: Parameters<typeof masteryRoll>[0];
}
export declare function shouldStageEpicFailure(opts: {
    success: boolean;
    hasRerollPoint: boolean;
    alreadyRerolled: boolean;
}): boolean;
export declare function buildEpicRollContext(session: EpicMasteryRollSession, actor: Actor, attributeKeyOverride?: string): Promise<EpicRollBuiltContext | null>;
export declare function actorEpicRerollPoints(actor: Actor | null | undefined): {
    current: number;
    maximum: number;
};
export declare function canSpendEpicRerollPoint(actor: Actor | null | undefined): boolean;
export declare function executeEpicParticipantRoll(session: EpicMasteryRollSession, actorId: string, attributeKeyOverride?: string, opts?: {
    reroll?: boolean;
}): Promise<EpicParticipantResult | null>;
export declare function submitEpicParticipantResult(sessionId: string, result: EpicParticipantResult, opts?: {
    staged?: boolean;
}): Promise<void>;
export declare function performEpicParticipantRoll(session: EpicMasteryRollSession, actorId: string, attributeKeyOverride?: string): Promise<EpicParticipantResult | null>;
export declare function performEpicParticipantReroll(session: EpicMasteryRollSession, actorId: string): Promise<EpicParticipantResult | null>;
export declare function finalizeEpicParticipantResult(session: EpicMasteryRollSession, result: EpicParticipantResult): Promise<void>;
export declare function confirmEpicRollWithoutSpend(session: EpicMasteryRollSession, actorId: string): Promise<void>;
//# sourceMappingURL=epic-mastery-roll-roll.d.ts.map