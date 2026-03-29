/**
 * Ranged attack targeting (Foundry v13) — same interaction model as melee-targeting,
 * but uses option.range (meters) and fires masterySystem.rangedTargetSelected.
 */
import type { RadialCombatOption } from "./token-radial-menu";
export declare function startRangedTargeting(attackerToken: any, option: RadialCombatOption): void;
export declare function endRangedTargeting(success: boolean): void;
export declare function isRangedTargetingActive(): boolean;
//# sourceMappingURL=ranged-targeting.d.ts.map