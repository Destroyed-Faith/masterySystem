/**
 * Melee Targeting – Foundry VTT v13 ONLY
 * - Draws reach highlight area (hex highlight on grid, circle on gridless)
 * - Shows interactive overlay for each valid target within reach
 * - When user clicks any valid target (token OR ring/overlay area), fires hook with attacker/target ids + option, then ends targeting
 * - Does NOT create chat messages, roll dice, or execute attacks directly
 */
import type { RadialCombatOption } from "./token-radial-menu";
export declare function startMeleeTargeting(attackerToken: any, option: RadialCombatOption): void;
export declare function endMeleeTargeting(success: boolean): void;
export declare function isMeleeTargetingActive(): boolean;
//# sourceMappingURL=melee-targeting.d.ts.map