/**
 * Melee Targeting – Foundry VTT v13 ONLY
 * - Hex-safe reach preview (via Grid Highlight Layer)
 * - Deterministic target clicking (token OR ring area)
 * - No per-target interactive overlays (avoids Pixi layer/eventMode pitfalls)
 * - Static import for attack execution (no dynamic import / 404)
 */
import type { RadialCombatOption } from "./token-radial-menu";
export declare function startMeleeTargeting(attackerToken: any, option: RadialCombatOption): void;
export declare function endMeleeTargeting(success: boolean): void;
export declare function isMeleeTargetingActive(): boolean;
//# sourceMappingURL=melee-targeting.d.ts.map