/**
 * Post-creation skill redistribution (creation budget only).
 *
 * Allowed only when the character has finished creation and has never received
 * or spent progression XP. Same rules as character creation: 40 points total,
 * max 4 per skill.
 */
export declare function getCreationSkillBudget(): {
    total: number;
    maxPerSkill: number;
};
export declare function sumActorSkillPoints(system: any): number;
/** True when no progression XP was ever earned or spent (creation-only premise). */
export declare function actorHasNoProgressionXp(actor: any): boolean;
export declare function isSkillsRedistributing(actor: any): boolean;
export declare function canStartSkillsRedistribute(actor: any): {
    ok: boolean;
    reason?: string;
};
/**
 * Creation / redistribute ranks (PG "Skill Point Buy"): the 40 points are
 * distributed FREELY, +1 per point; any rank 0..maxPerSkill (4) is legal.
 */
export declare function isValidCreationSkillRank(raw: unknown, maxPerSkill?: number): boolean;
export declare function validateCreationSkillAllocation(system: any): {
    ok: boolean;
    reason?: string;
};
/** Zero skills, stash backup, enter redistribute mode. */
export declare function buildStartSkillsRedistributeUpdates(actor: any): Record<string, unknown>;
/** Restore backup and leave redistribute mode. */
export declare function buildCancelSkillsRedistributeUpdates(actor: any): Record<string, unknown>;
/**
 * Finish redistribution: require exact creation budget, clear mode flag,
 * refresh post-creation skill snapshot so later progression resets stay correct.
 */
export declare function buildFinishSkillsRedistributeUpdates(actor: any): {
    ok: boolean;
    reason?: string;
    updates?: Record<string, unknown>;
};
//# sourceMappingURL=skills-redistribute.d.ts.map