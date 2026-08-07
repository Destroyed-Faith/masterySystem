/**
 * Ranged attack targeting (Foundry v13) — same interaction model as melee-targeting,
 * but uses option.range (meters) and fires masterySystem.rangedTargetSelected.
 *
 * Players Guide: Short band ("Min" on NPC sheet) is the gifted full-pool range —
 * NOT a hard minimum. Any target within Long (max) may be selected. Closer than
 * Short still works at full Short pool; Threatened Ranged applies separately when
 * enemies are in melee reach.
 */
import type { RadialCombatOption } from "./token-radial-menu";
export declare function startRangedTargeting(attackerToken: any, option: RadialCombatOption): void;
export declare function endRangedTargeting(success: boolean): void;
export declare function isRangedTargetingActive(): boolean;
//# sourceMappingURL=ranged-targeting.d.ts.map