/**
 * Ritual System — out-of-combat Skill Checks.
 *
 * Base Ritual TN = 4 × max(3, Task Level) (DF Guide 2026-10-23).
 * Final Ritual TN = Base + 4 × Paid Raises (one final TN; no partial named tier).
 * Stones Sealed by total Raises (Paid+Free): 0–1→1, 2–3→2, 4–8→3.
 * All 16 Core Rituals are universally available — see `src/rules/core-rituals.ts`.
 */
export type RitualSkillCategory = 'physical' | 'knowledge' | 'social' | 'survival';
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
/**
 * Base Ritual TN from Task Level (minimum 3 → TN 12).
 * The first argument is the Task Level / source level, not caster MR.
 */
export declare function calculateRitualTN(taskLevel: number, modifier?: number): number;
/** Universal Core Ritual catalogue (16). Prefer this over legacy RITUALS for new UI. */
export declare function listUniversalCoreRituals(): readonly import("../rules/core-rituals.js").CoreRitualDefinition[];
export declare function sealedStonesForRitualRaises(totalRaises: number): number;
export declare function calculateRitualRaiseTN(baseTn: number, declaredRaises: number): number;
export declare function ritualStoneCost(ritual: RitualDefinition, declaredRaises: number): number;
export declare function ritualMaxRaise(ritual: RitualDefinition): number;
export type RitualDeclaredOutcome = {
    success: boolean;
    appliedRaise: number;
    /** `raise0` kept for type compat; DF 2026 no longer awards partial named tiers. */
    kind: 'fail' | 'raise0' | 'full';
};
/**
 * One final Ritual TN: Base + 4×Paid Raises.
 * Missing the final TN fails the entire declared attempt (no partial named tier).
 */
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