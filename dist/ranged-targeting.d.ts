/**
 * Ranged attack targeting (Foundry v13) — same interaction model as melee-targeting,
 * but uses option.range (meters) and fires masterySystem.rangedTargetSelected.
 *
 * Players Guide: flat maximum only. Any target within Max may be selected at full
 * pool; beyond Max the attack is not legal. Threatened Ranged applies separately
 * when enemies are in melee reach.
 *
 * Click model (v0.9.274+):
 * - Per-target stage hit-pads bound to a concrete token id (no coordinate guessing).
 * - Visual rings are non-interactive so they cannot steal clicks.
 * - Stage capture never auto-confirms a guessed nearby token; it only cancels
 *   empty clicks / warns out-of-range using client→canvas coordinates.
 */
import type { RadialCombatOption } from "./token-radial-menu";
export declare function startRangedTargeting(attackerToken: any, option: RadialCombatOption): void;
export declare function endRangedTargeting(success: boolean): void;
export declare function isRangedTargetingActive(): boolean;
//# sourceMappingURL=ranged-targeting.d.ts.map