/**
 * Option Collection and Parsing for Radial Menu
 */
import type { RadialCombatOption, InnerSegment } from './types';
/** Attack-slot maneuvers the radial shows (Basic Attack is injected separately). */
export declare const RADIAL_ATTACK_MANEUVER_IDS: readonly string[];
/** Grapple family: Grapple reaches like a body (melee reach); escape / release target the partner. */
export declare const GRAPPLE_MANEUVER_IDS: readonly string[];
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