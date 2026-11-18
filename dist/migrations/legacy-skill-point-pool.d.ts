/**
 * Legacy Skill Point pool — retired.
 *
 * DF Professions replaced creation Skill Points. Migration-only: the
 * legacy-cleanup migration converts leftover unspent points to Free XP and
 * removes `system.skillPoints`.
 */
export interface SkillPointPool {
    unspent: number;
    placed: Record<string, number>;
}
/** Raw leftover Skill Points still stored on an actor (pre-retirement). */
export declare function readLegacySkillPointResidue(system: any): SkillPointPool;
/**
 * Convert leftover unspent Skill Points to Free XP and clear the pool.
 * Placed ranks stay on Skills; only the obsolete currency is removed.
 */
export declare function planSkillPointRetirement(system: any): {
    needed: boolean;
    convertedXp: number;
    updates: Record<string, unknown>;
};
//# sourceMappingURL=legacy-skill-point-pool.d.ts.map