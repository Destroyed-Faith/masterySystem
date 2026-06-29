/**
 * Epic Mastery Roll — shared types.
 */
import type { SaveCategory } from '../utils/saving-throws.js';
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
export type EpicParticipantStatus = 'pending' | 'rolled' | 'skipped';
export interface EpicParticipant {
    actorId: string;
    actorName: string;
    status: EpicParticipantStatus;
    img?: string;
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
export declare function countResolvedParticipants(session: EpicMasteryRollSession): number;
export declare function isSessionReadyToComplete(session: EpicMasteryRollSession): boolean;
export declare function mergeParticipantResult(session: EpicMasteryRollSession, result: EpicParticipantResult): EpicMasteryRollSession;
export declare function skipParticipantInSession(session: EpicMasteryRollSession, actorId: string): EpicMasteryRollSession;
export declare function rollLabelForConfig(roll: EpicRollConfig): string;
//# sourceMappingURL=epic-mastery-roll-types.d.ts.map