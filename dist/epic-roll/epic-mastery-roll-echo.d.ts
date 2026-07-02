/**
 * Epic Mastery Roll — Echo Card offers after a successful skill check.
 */
import type { EpicMasteryRollSession, EpicParticipantResult } from './epic-mastery-roll-types.js';
export interface EpicEchoCardOffer {
    cardId: string;
    cardName: string;
    optionId: string;
    optionLabel: string;
    description: string;
    skillKey: string;
    trigger: string;
}
export declare function getEpicEchoCardOffers(actor: Actor, skillKey: string): EpicEchoCardOffer[];
export declare function applyEchoCardToParticipantResult(result: EpicParticipantResult, echoKey: string, cardId: string, optionId: string): EpicParticipantResult | null;
export declare function applyEpicEchoCardToResult(session: EpicMasteryRollSession, actorId: string, cardId: string, optionId: string): Promise<EpicParticipantResult | null>;
//# sourceMappingURL=epic-mastery-roll-echo.d.ts.map