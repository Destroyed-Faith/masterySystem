/**
 * Epic Mastery Roll — GM-authoritative session manager.
 */
import { type EpicMasteryRollSession, type EpicMasteryRollStartConfig, type EpicParticipantResult } from './epic-mastery-roll-types.js';
export declare function getActiveEpicMasteryRollSession(): EpicMasteryRollSession | null;
export declare function startEpicMasteryRollSession(config: EpicMasteryRollStartConfig): Promise<EpicMasteryRollSession | null>;
export declare function applyEpicMasteryRollSessionState(session: EpicMasteryRollSession): void;
export declare function ingestEpicMasteryRollResult(sessionId: string, result: EpicParticipantResult, opts?: {
    staged?: boolean;
}): Promise<void>;
export declare function skipEpicMasteryRollParticipant(actorId: string): Promise<void>;
/** GM closes the cinematic overlay for everyone (X button). Rolls stay recorded; summary posts when all are done. */
export declare function cancelEpicMasteryRollSession(): Promise<void>;
export declare function clearEpicMasteryRollSessionLocal(sessionId?: string): void;
//# sourceMappingURL=epic-mastery-roll-session.d.ts.map