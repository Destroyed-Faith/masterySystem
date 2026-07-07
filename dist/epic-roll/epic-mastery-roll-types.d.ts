/**
 * Epic Mastery Roll — shared types.
 */
import type { SaveCategory } from '../utils/saving-throws.js';
import type { MasteryRollResult } from '../types/index.js';
export type EpicRollKind = 'skill' | 'attribute' | 'save';
export interface EpicTnConfig {
    challengeMR: number;
    baseTN: number;
    raises: number;
}
export interface EpicSkillRollConfig {
    kind: 'skill';
    skillKey: string;
}
export interface EpicAttributeRollConfig {
    kind: 'attribute';
    attributeKey: string;
}
export interface EpicSaveRollConfig {
    kind: 'save';
    saveType: SaveCategory;
}
export type EpicRollConfig = EpicSkillRollConfig | EpicAttributeRollConfig | EpicSaveRollConfig;
export type EpicParticipantStatus = 'pending' | 'awaiting_spend' | 'rolled' | 'skipped';
export interface EpicParticipant {
    actorId: string;
    actorName: string;
    status: EpicParticipantStatus;
    img?: string;
}
/** Serializable roll payload kept while the player chooses skill spend. */
export interface EpicRollPayload {
    rollResult: MasteryRollResult;
    skillKey?: string;
    isSkillRoll: boolean;
    baseModifier: number;
    raiseTn?: number;
}
export interface EpicParticipantResult {
    actorId: string;
    actorName: string;
    label: string;
    total: number;
    normalTn: number;
    success: boolean;
    raises: number;
    diceSummary: string;
    skipped?: boolean;
    /** True while the owner may still spend skill points before locking in. */
    awaitingConfirm?: boolean;
    skillKey?: string;
    skillSpent?: number;
    raiseTn?: number;
    rollPayload?: EpicRollPayload;
    echoCardUsed?: {
        cardId: string;
        optionId: string;
        cardName: string;
        optionLabel: string;
    };
    /** Persisted dice breakdown for overlay / summary after rollPayload is cleared. */
    diceFaces?: EpicDiceFace[];
}
export interface EpicMasteryRollSession {
    id: string;
    title: string;
    flavor: string;
    showTn: boolean;
    tn: EpicTnConfig;
    roll: EpicRollConfig;
    participants: EpicParticipant[];
    results: Record<string, EpicParticipantResult>;
    status: 'active' | 'complete' | 'cancelled';
    /** Band tint hue (0–360). */
    bandHue?: number;
}
export interface EpicMasteryRollPreset {
    title: string;
    flavor: string;
    showTn: boolean;
    tn: EpicTnConfig;
    roll: EpicRollConfig;
    actorIds: string[];
}
export interface EpicMasteryRollStartConfig {
    title: string;
    flavor: string;
    showTn: boolean;
    tn: EpicTnConfig;
    roll: EpicRollConfig;
    actorIds: string[];
}
export declare function formatDiceSummary(kept: number[]): string;
export interface EpicDiceFace {
    value: number;
    label: string;
    kept: boolean;
    exploded: boolean;
}
export declare function buildEpicDiceFaces(rollResult: MasteryRollResult & {
    keptIndices?: number[];
}): EpicDiceFace[];
/** Full pool display: all dice with kept totals for chat / overlay. */
export declare function formatEpicRollDiceSummary(rollResult: MasteryRollResult & {
    keptIndices?: number[];
}): string;
export declare function countResolvedParticipants(session: EpicMasteryRollSession): number;
export declare function isSessionReadyToComplete(session: EpicMasteryRollSession): boolean;
export declare function mergeParticipantResult(session: EpicMasteryRollSession, result: EpicParticipantResult, opts?: {
    staged?: boolean;
}): EpicMasteryRollSession;
export declare function skipParticipantInSession(session: EpicMasteryRollSession, actorId: string): EpicMasteryRollSession;
export declare function rollLabelForConfig(roll: EpicRollConfig): string;
export declare function participantResultFromRoll(actorId: string, actorName: string, label: string, rollResult: MasteryRollResult, payload: EpicRollPayload, opts?: {
    skillKey?: string;
    awaitingConfirm?: boolean;
    skillSpent?: number;
}): EpicParticipantResult;
//# sourceMappingURL=epic-mastery-roll-types.d.ts.map