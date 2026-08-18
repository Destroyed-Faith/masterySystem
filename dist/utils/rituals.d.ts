/**
 * Ritual System — out-of-combat Skill Checks.
 *
 * Base Ritual TN = 8 × Ritual MR (target / creator / artifact / power / scene).
 * Player declares Raise Level before the roll.
 * Ritual Raise TN = Base + declared Raises × 4.
 * Fail below Base. Meet Base but miss Raise TN → Raise 0 only.
 * Meet Raise TN → declared level and all lower Raise effects.
 * Stones are Sealed on the attempt (success or failure) until Safe Haven Rest.
 * Any Stone color may pay the cost.
 */
export type RitualSkillCategory = 'physical' | 'knowledge' | 'social' | 'survival' | 'martial';
export interface RitualDefinition {
    id: string;
    name: string;
    description: string;
    stoneCost: number;
    /** Overrides stoneCost at a declared Raise (Seal Passage Raise 4 = 3). */
    stoneCostAtDeclaredRaise?: Partial<Record<number, number>>;
    allowedSkillCategories: RitualSkillCategory[];
    /** `raises[i]` = effect at Raise i (0–4). */
    raises: string[];
    maxRaise?: number;
    castingTime: string;
    duration: string;
    requirement?: string;
    danger?: string;
    limits?: string;
    specialCostNote?: string;
    /** @deprecated Kept for old callers. */
    attribute?: string;
}
export declare const RITUAL_CATEGORY_LABELS: Record<RitualSkillCategory, string>;
/** Raise 0-1 = 1 Stone, Raise 2-3 = 2, Raise 4 = 3. */
export declare const RITUAL_STONE_COST_BY_RAISE: readonly [1, 1, 2, 2, 3];
export declare function ritualCategoryLabels(ritual: RitualDefinition): string;
export declare const RITUAL_SKILLS_BY_CATEGORY: Record<RitualSkillCategory, readonly string[]>;
export declare function calculateRitualTN(ritualMR: number, modifier?: number): number;
export declare function calculateRitualRaiseTN(baseTn: number, declaredRaises: number): number;
export declare function ritualStoneCost(ritual: RitualDefinition, declaredRaises: number): number;
export declare function ritualMaxRaise(ritual: RitualDefinition): number;
export type RitualDeclaredOutcome = {
    success: boolean;
    appliedRaise: number;
    kind: 'fail' | 'raise0' | 'full';
};
/** Declared-raise resolution: fail / Raise 0 only / full declared level. */
export declare function resolveRitualDeclaredOutcome(opts: {
    rollTotal: number;
    baseTn: number;
    declaredRaises: number;
}): RitualDeclaredOutcome;
export declare function appliedRitualEffects(ritual: RitualDefinition, appliedRaise: number): string[];
export declare function eligibleSkillsForRitual(ritual: RitualDefinition): string[];
export declare const RITUALS: RitualDefinition[];
export declare function getRitualByName(name: string): RitualDefinition | undefined;
export declare function getRitualById(id: string): RitualDefinition | undefined;
//# sourceMappingURL=rituals.d.ts.map