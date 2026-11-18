/**
 * Shared roll-context builders for attribute checks (Epic Mastery Roll).
 * Training Checks use `executeSkillCheck` (sheets/skill-check-execute.ts).
 *
 * Builders return the BASE attribute pool. Specials (Weaken / Soulburn / Disoriented),
 * the percentage Health / Encumbrance penalty are applied centrally by `masteryRoll` via
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
}
/**
 * Opposed Skill Rolls: the setup roll's Final Result is the opposing TN.
 * Raises are not added on top of a fixed Mastery Rank TN.
 */
export declare function buildOpposedSkillTn(setupFinalResult: number, _unusedRaises?: number): number;
export declare function buildDifficultyPresets(challengeMR: number): Record<string, number>;
/** Attribute pool size from `system.attributes.<key>.value` (or a bare number). */
export declare function readAttributePoolValue(system: any, attributeKey: string): number;
export declare function buildAttributeRollContext(actor: Actor, attributeKey: string, tnSpec: TnSpec, stoneBonusRaises?: number): BuiltRollContext | null;
//# sourceMappingURL=roll-context-build.d.ts.map