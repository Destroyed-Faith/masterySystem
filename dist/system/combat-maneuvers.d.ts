/**
 * Combat Maneuvers System for Mastery System
 *
 * Defines all generic Combat Maneuvers available to all characters.
 * These are separate from Powers (which come from Mastery Trees).
 *
 * Categories:
 * - Movement Maneuvers: Use Movement slot
 * - Defensive Reactions: Use Reaction slot, defensive in nature
 * - Support Reactions: Use Reaction slot, help allies
 * - Tactical Reactions: Use Reaction slot, tactical/opportunity attacks
 * - Combat Actions/Stances: Use Action slot, provide ongoing benefits
 * - Advanced Specials: Modify Attack actions (Multiattack, Autofire, etc.)
 */
/**
 * Combat slot types - which turn resource the maneuver consumes
 */
export type CombatSlot = "attack" | "movement" | "utility" | "reaction";
/**
 * Maneuver category - fine-grained subtype for organization
 */
export type ManeuverCategory = "movement" | "defensive-reaction" | "support-reaction" | "tactical-reaction" | "combat-action" | "advanced-special";
/**
 * Requirements for using a maneuver
 */
export interface ManeuverRequirements {
    requiresShield?: boolean;
    requiresMeleeWeapon?: boolean;
    requiresReach?: boolean;
    requiresTwoHanded?: boolean;
    requiresRangedWeapon?: boolean;
    requiresFreeHand?: boolean;
    requiresProne?: boolean;
    requiresStanding?: boolean;
    minAttribute?: {
        attribute: string;
        value: number;
    };
}
/**
 * Combat Maneuver definition
 */
export interface CombatManeuver {
    id: string;
    name: string;
    description: string;
    slot: CombatSlot;
    category: ManeuverCategory;
    tags: string[];
    requirements?: ManeuverRequirements;
    effect?: string;
    cost?: {
        stones?: number;
        charges?: number;
    };
}
/**
 * All available Combat Maneuvers
 *
 * NOTE: These are based on common RPG patterns and the categories described.
 * Update with exact names/descriptions from the Players Guide when available.
 */
export declare const COMBAT_MANEUVERS: CombatManeuver[];
/**
 * Get all maneuvers available to an actor
 * Filters based on requirements and actor capabilities
 */
export declare function getAvailableManeuvers(actor: any): CombatManeuver[];
/**
 * Get maneuvers by slot type
 */
export declare function getManeuversBySlot(slot: CombatSlot, actor?: any): CombatManeuver[];
/**
 * Get maneuvers by category
 */
export declare function getManeuversByCategory(category: ManeuverCategory, actor?: any): CombatManeuver[];
/**
 * Get a specific maneuver by ID
 */
export declare function getManeuverById(id: string): CombatManeuver | undefined;
/**
 * Get all maneuvers grouped by slot for display
 */
export declare function getManeuversBySlotGrouped(actor?: any): Record<CombatSlot, CombatManeuver[]>;
//# sourceMappingURL=combat-maneuvers.d.ts.map