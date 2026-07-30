/**
 * Shared roll-context builders for skill and attribute checks.
 * Used by Epic Mastery Roll and available for future sheet refactors.
 *
 * Builders return the BASE pool (attribute + skill full-/half-pool rule +
 * equipment flat penalties). Specials (Weaken / Soulburn / Disoriented),
 * the percentage Health / Encumbrance penalty, and the final Minimum Pool
 * (= Mastery Rank) are applied centrally by `masteryRoll` via
 * `finalizeRolledPool` (`applyPoolPenalties: true`), so previews and final
 * rolls share one calculation.
 */
import type { RollOptions } from './roll-handler.js';
export interface TnSpec {
    baseTN: number;
    raises: number;
}
export interface BuiltRollContext {
    rollOptions: Omit<RollOptions, 'skipChat'>;
    label: string;
    attributeKey: string;
    skillKey?: string;
}
/** Players Guide: full attribute pool when skill rating ≥ 2 × Mastery Rank. */
export declare function skillFullPoolThreshold(masteryRank: number): number;
export declare function isSkillFullPoolReady(skillRating: number, masteryRank: number): boolean;
export declare function buildDifficultyPresets(challengeMR: number): Record<string, number>;
export interface SkillRollPoolPreview {
    attributeKey: string;
    /** Compact sheet label, e.g. `8k2`. */
    rollLabel: string;
    diceLabel: string;
    tooltip: string;
    halfPool: boolean;
    fullPoolReady: boolean;
    numDice: number;
    keepDice: number;
    skillRating: number;
    poolThreshold: number;
    attributeValue: number;
    iconClass: string | null;
}
/** Skill rating below 2×MR: attribute dice = round(attr/2), minimum 1. */
export declare function reducedSkillAttributePool(attributeValue: number): number;
/** Sheet + dialog helper: dice pool label and tooltip for a skill attribute roll. */
export declare function buildSkillRollPoolPreview(actor: Actor, skillKey: string, attributeKey: string, skillRatingOverride?: number): SkillRollPoolPreview;
/**
 * Skill rolls: BASE attribute dice pool (attr + full-/half-pool rule +
 * equipment flat penalty). Pass `baseDice` to `masteryRoll` with
 * `applyPoolPenalties: true`; `numDice` / `finalizeNotes` are the fully
 * finalized preview values (same calculation the roll will use).
 */
export declare function getSkillRollDicePool(actor: Actor, skillKey: string, attributeKey: string, skillRatingOverride?: number): {
    numDice: number;
    baseDice: number;
    keepDice: number;
    halfPool: boolean;
    equipPenalty: number;
    finalizeNotes: string[];
};
export declare function buildSkillRollContext(actor: Actor, skillKey: string, attributeKey: string, tnSpec: TnSpec, stoneBonusRaises?: number): BuiltRollContext | null;
export declare function buildAttributeRollContext(actor: Actor, attributeKey: string, tnSpec: TnSpec, stoneBonusRaises?: number): BuiltRollContext | null;
//# sourceMappingURL=roll-context-build.d.ts.map