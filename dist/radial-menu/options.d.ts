/**
 * Option Collection and Parsing for Radial Menu
 */
import type { RadialCombatOption, InnerSegment } from './types';
/**
 * True when activating spends an action: legacy `cost.action === true` or
 * string `attack` / `full` / `utility` (e.g. catalog active buffs).
 */
export declare function powerCostPaysAction(cost: {
    action?: unknown;
    actions?: unknown;
} | undefined): boolean;
/**
 * One radial entry per copy of each NSC attack row (Angriffe/Runde = copies).
 * Spent copies disappear until the next round.
 */
export declare function buildNpcAttackRadialOptions(actor: any): RadialCombatOption[];
/**
 * Map an option to one of the 4 inner segment IDs
 * This determines which inner quadrant (Buff/Move/Util/Atk) an option belongs to
 */
export declare function getSegmentIdForOption(option: RadialCombatOption): InnerSegment['id'];
/**
 * Get all combat options for an actor (all categories)
 * Collects all Powers and Maneuvers available to the actor
 * Builds movement segment with proper ordering: core maneuvers first, then powers, then other maneuvers
 */
export declare function getAllCombatOptionsForActor(actor: any): Promise<RadialCombatOption[]>;
//# sourceMappingURL=options.d.ts.map