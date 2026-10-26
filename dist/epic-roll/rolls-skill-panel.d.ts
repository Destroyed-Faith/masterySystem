/**
 * Pure helpers for the unified Rolls dialog Skill panel (DF Skill System).
 * Does not mutate character Specialization data.
 */
import { type SkillCheckSkillRef } from '../rules/index.js';
export type RollsSkillMode = 'standard' | 'comparative';
export interface RollsAllowedApproach {
    id: string;
    /** Specialization id, or 'perception' / 'untrained'. */
    skillKey: string;
    label: string;
    suggestedAttribute: string;
    baseTn: number;
    note: string;
}
export interface RollsParticipantSkillRow {
    actorId: string;
    skillRef: SkillCheckSkillRef;
    attributeKey: string;
    baseTn: number;
    /** Approach id that populated this row (optional). */
    approachId?: string;
}
export interface RollsVirtualOpponent {
    name: string;
    skillName: string;
    poolDice: number;
    masteryRank: number;
    skillRank: number;
    attributeKey: string;
    allowSkillCrit: boolean;
}
export interface RollsComparativeConfig {
    source: 'npc' | 'virtual';
    npcActorId: string;
    npcSkillKey: string;
    npcAttributeKey: string;
    virtual: RollsVirtualOpponent;
    groupAmbush: boolean;
    ambushParticipantIds: string[];
    stealthSpecialistId: string;
}
export declare function newApproachId(): string;
export declare function emptyApproach(partial?: Partial<RollsAllowedApproach>): RollsAllowedApproach;
export declare function defaultVirtualOpponent(): RollsVirtualOpponent;
export declare function defaultComparativeConfig(): RollsComparativeConfig;
export declare function skillRefFromKey(key: string): SkillCheckSkillRef;
export declare function skillKeyFromRef(ref: SkillCheckSkillRef): string;
export declare function listActorSkillOptions(actor: any): Array<{
    key: string;
    label: string;
    rank: number;
}>;
export declare function resolveSkillRank(actor: any, ref: SkillCheckSkillRef): number;
export declare function attributePoolPreview(actor: any, attributeKey: string): {
    attributeValue: number;
    masteryRank: number;
    poolLabel: string;
};
export declare function participantSkillPreview(actor: any, row: RollsParticipantSkillRow): {
    skillLabel: string;
    rank: number;
    advantageLabel: string;
    critRemaining: number;
    critAllowance: number;
    poolLabel: string;
    attributeValue: number;
    masteryRank: number;
};
export declare function applyApproachToRow(approach: RollsAllowedApproach, actorId: string): RollsParticipantSkillRow;
export declare function taskLevelTnPresets(): Array<{
    level: number;
    tn: number;
    label: string;
}>;
export declare const ROLLS_ATTRIBUTES: ("wits" | "intellect" | "resolve" | "might" | "agility" | "vitality" | "influence")[];
export declare function equipmentPenaltyBreakdown(participants: any[]): {
    total: number;
    rows: Array<{
        actorId: string;
        name: string;
        penalty: number;
    }>;
};
export declare function groupAmbushPoolPreview(specialist: any, participants: any[], attributeKey: string): {
    ok: boolean;
    error: string | undefined;
    basePool: number;
    combinedPenalty: number;
    finalPool: number;
    keepDice: number;
    participantPenalties: {
        actorId: string;
        name: string;
        penalty: number;
    }[];
    skillAdvantageRerollMax: 0 | 3 | 2 | 1 | 5 | 4;
    skillRank: number;
    skillName: string;
    attributeKey: string;
    masteryRank: number;
};
/** Prefer Stealth Spec when present for ambush preview. */
export declare function resolveStealthRef(actor: any): SkillCheckSkillRef;
//# sourceMappingURL=rolls-skill-panel.d.ts.map