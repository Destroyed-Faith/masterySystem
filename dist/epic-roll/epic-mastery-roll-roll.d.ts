/**
 * Epic Mastery Roll — participant roll execution (no session side-effects).
 */
import type { EpicMasteryRollSession, EpicParticipantResult } from './epic-mastery-roll-types.js';
export declare function pickSkillAttribute(actor: Actor, skillKey: string): Promise<string | null>;
export declare function executeEpicParticipantRoll(session: EpicMasteryRollSession, actorId: string, attributeKeyOverride?: string): Promise<EpicParticipantResult | null>;
export declare function submitEpicParticipantResult(sessionId: string, result: EpicParticipantResult): Promise<void>;
export declare function performEpicParticipantRoll(session: EpicMasteryRollSession, actorId: string, attributeKeyOverride?: string): Promise<EpicParticipantResult | null>;
//# sourceMappingURL=epic-mastery-roll-roll.d.ts.map