/**
 * Group Ambush — one Stealth roll for the party vs observer Perception.
 *
 * Specialist rolls Attribute k MR with Skill Advantage / optional Skill Crit.
 * Pool is reduced by the *combined* Physical Skill penalties of every
 * participating character (armor + shields), including the specialist.
 */
export interface GroupAmbushPoolPlan {
    ok: boolean;
    error?: string;
    attributeKey: string;
    attributeValue: number;
    masteryRank: number;
    basePool: number;
    combinedPenalty: number;
    participantPenalties: Array<{
        actorId: string;
        name: string;
        penalty: number;
    }>;
    finalPool: number;
    keepDice: number;
    skillRank: number;
    skillAdvantageRerollMax: 0 | 1 | 2 | 3 | 4 | 5;
    skillCritTrackId: string;
    skillName: string;
}
export declare function sumGroupPhysicalSkillPenalties(participants: any[]): {
    total: number;
    rows: Array<{
        actorId: string;
        name: string;
        penalty: number;
    }>;
};
/**
 * Plan the group's single Stealth pool.
 * `attributeKey` defaults to Agility (typical Stealth); callers may override.
 */
export declare function planGroupAmbushStealthPool(opts: {
    specialist: any;
    participants: any[];
    attributeKey?: string;
}): GroupAmbushPoolPlan;
export interface GroupAmbushRollResult {
    ok: boolean;
    error?: string;
    plan?: GroupAmbushPoolPlan;
    stealthTotal?: number;
    observerResults?: Array<{
        observerId: string;
        observerName: string;
        perceptionTotal: number;
        stealthWins: boolean;
    }>;
}
/**
 * Execute Group Ambush: one Stealth roll, then compare vs each observer Perception total.
 * Observer Perception totals are provided by the caller (already rolled or GM-entered)
 * to avoid forcing UI in unit tests — live UI can roll Perception per observer.
 */
export declare function executeGroupAmbushStealthRoll(opts: {
    specialist: any;
    participants: any[];
    attributeKey?: string;
    declareSkillCrit?: boolean;
    /** Precomputed Perception totals keyed by observer actor id. */
    observerPerceptionTotals: Array<{
        observer: any;
        perceptionTotal: number;
    }>;
    skipChat?: boolean;
}): Promise<GroupAmbushRollResult>;
//# sourceMappingURL=group-ambush.d.ts.map