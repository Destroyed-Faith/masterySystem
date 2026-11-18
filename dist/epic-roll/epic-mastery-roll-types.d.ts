/**
 * Epic Mastery Roll — shared types.
 */
import type { MasteryRollResult } from '../types/index.js';
/** Dialog modes. `skill` publishes a chat Training Check and never opens a session. */
export type EpicRollKind = 'skill' | 'attribute' | 'fear';
export interface EpicTnConfig {
    challengeMR: number;
    baseTN: number;
    raises: number;
}
export interface EpicAttributeRollConfig {
    kind: 'attribute';
    attributeKey: string;
}
/** Resolve k1 Fear Check — graded bands 8 / 16. No Skill Points / Raises / TN picker. */
export interface EpicFearRollConfig {
    kind: 'fear';
}
export type EpicRollConfig = EpicAttributeRollConfig | EpicFearRollConfig;
export type EpicParticipantStatus = 'pending' | 'awaiting_spend' | 'rolled' | 'skipped';
export interface EpicParticipant {
    actorId: string;
    actorName: string;
    status: EpicParticipantStatus;
    img?: string;
}
/** Serializable roll payload kept while the player decides on a reroll. */
export interface EpicRollPayload {
    rollResult: MasteryRollResult;
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
    /** True while the owner may still reroll before locking in. */
    awaitingConfirm?: boolean;
    /** Attribute used for this check — needed to reroll the same pool. */
    attributeKey?: string;
    raiseTn?: number;
    /** Already spent a Reroll Point on this Epic Roll. */
    rerolled?: boolean;
    rollPayload?: EpicRollPayload;
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
/** Player-facing name for a group roll of this kind. */
export declare function defaultRollTitleForKind(kind: EpicRollKind): string;
export declare function rollLabelForConfig(roll: EpicRollConfig): string;
export declare function participantResultFromRoll(actorId: string, actorName: string, label: string, rollResult: MasteryRollResult, payload: EpicRollPayload, opts?: {
    attributeKey?: string;
    awaitingConfirm?: boolean;
    rerolled?: boolean;
}): EpicParticipantResult;
//# sourceMappingURL=epic-mastery-roll-types.d.ts.map