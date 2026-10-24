/**
 * NPC / Summon situational noncombat skill pools (DF Players Guide).
 * Not full PC Specializations — only a few scene pools: Nd8 keep MR.
 */
export declare const NPC_SITUATIONAL_SKILL_MAX_RANK = 8;
export interface NpcSituationalSkill {
    id: string;
    name: string;
    /** Dice in the pool (N in NkMR). */
    poolDice: number;
    /** 0 = no Raises; 1–8 for Paid/Free allowances. */
    skillRank: number;
    notes?: string;
}
export type NpcPoolPreset = 'capable' | 'specialist';
export declare function suggestNpcPool(masteryRank: number, preset: NpcPoolPreset): number;
export declare function newSituationalSkillId(): string;
export declare function readSituationalSkills(system: any): NpcSituationalSkill[];
export declare function findSituationalSkillById(skills: NpcSituationalSkill[], id: string | null | undefined): NpcSituationalSkill | null;
export declare function findSituationalSkillByName(skills: NpcSituationalSkill[], name: string): NpcSituationalSkill | null;
export declare function upsertSituationalSkill(skills: NpcSituationalSkill[], record: NpcSituationalSkill, replaceId?: string): NpcSituationalSkill[];
export declare function removeSituationalSkill(skills: NpcSituationalSkill[], id: string): NpcSituationalSkill[];
export declare function poolPreviewLabel(poolDice: number, masteryRank: number): string;
/** Stable id for the required NPC Perception situational entry. */
export declare const NPC_PERCEPTION_SKILL_ID = "nss-perception";
export declare function isNpcPerceptionSkill(skill: Pick<NpcSituationalSkill, 'id' | 'name'>): boolean;
/**
 * Every NPC/Summon must have Perception. If missing, append Capable-pool Perception.
 * Does not overwrite an existing Perception entry (name match or stable id).
 */
export declare function ensureNpcHasPerception(system: any, masteryRank?: number): {
    skills: NpcSituationalSkill[];
    added: boolean;
};
/**
 * Resolve an NPC Perception pool for combat gates.
 * 1) Situational skill named Perception
 * 2) null → caller may use legacy system.skills
 * Returns pool dice + skill rank when found.
 */
export declare function resolveNpcPerceptionSituational(system: any): {
    poolDice: number;
    skillRank: number;
    name: string;
} | null;
//# sourceMappingURL=npc-situational-skills.d.ts.map