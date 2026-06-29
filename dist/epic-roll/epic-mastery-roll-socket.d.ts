/**
 * Epic Mastery Roll — socket transport.
 */
import type { EpicMasteryRollSession, EpicParticipantResult } from './epic-mastery-roll-types.js';
export declare const EPIC_ROLL_SOCKET = "system.mastery-system";
export declare function broadcastEpicMasteryRollStart(session: EpicMasteryRollSession): void;
export declare function broadcastEpicMasteryRollState(session: EpicMasteryRollSession): void;
export declare function broadcastEpicMasteryRollComplete(sessionId: string): void;
export declare function broadcastEpicMasteryRollCancel(sessionId: string): void;
export declare function emitEpicMasteryRollResult(sessionId: string, result: EpicParticipantResult, opts?: {
    staged?: boolean;
}): void;
export declare function registerEpicMasteryRollSocket(): void;
export declare function syncEpicMasteryRollApp(session: EpicMasteryRollSession): Promise<void>;
//# sourceMappingURL=epic-mastery-roll-socket.d.ts.map