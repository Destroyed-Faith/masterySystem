/**
 * Option Collection and Parsing for Radial Menu
 */
import type { RadialCombatOption, InnerSegment } from './types';
/**
 * Map an option to one of the 4 inner segment IDs
 * This determines which inner quadrant (Buff/Move/Util/Atk) an option belongs to
 */
export declare function getSegmentIdForOption(option: RadialCombatOption): InnerSegment['id'];
/**
 * Get all combat options for an actor (all categories)
 * Collects all Powers and Maneuvers available to the actor
 */
export declare function getAllCombatOptionsForActor(actor: any): Promise<RadialCombatOption[]>;
//# sourceMappingURL=options.d.ts.map