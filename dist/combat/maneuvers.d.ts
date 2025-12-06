/**
 * Movement Maneuvers System for Mastery System
 *
 * Rules:
 * - Movement maneuvers use your entire Movement action
 * - Cannot be split with regular movement
 * - Each provides unique tactical benefits
 * - Dash, Disengage, Charge, Leap, etc.
 */
/**
 * Movement maneuver types
 */
export declare enum MovementManeuver {
    DASH = "dash",
    DISENGAGE = "disengage",
    CHARGE = "charge",
    LEAP = "leap",
    TELEPORT = "teleport",
    CLIMB = "climb",
    SWIM = "swim",
    FLY = "fly"
}
/**
 * Movement maneuver data
 */
export interface ManeuverData {
    type: MovementManeuver;
    name: string;
    description: string;
    effect: string;
    rollRequired: boolean;
    tn?: number;
    attribute?: string;
}
/**
 * Get all available maneuvers (basic ones always available)
 */
export declare function getAvailableManeuvers(actor: any): ManeuverData[];
/**
 * Check if actor has a Movement action available
 */
export declare function hasMovementAvailable(actor: any): boolean;
/**
 * Perform a movement maneuver
 */
export declare function performManeuver(actor: any, maneuverType: MovementManeuver, target?: any): Promise<void>;
/**
 * Check if actor has Dash active
 */
export declare function hasDashActive(actor: any): boolean;
/**
 * Get current speed (with modifiers)
 */
export declare function getCurrentSpeed(actor: any): number;
/**
 * Check if actor has Charge bonus vs specific target
 */
export declare function hasChargeBonusVs(actor: any, targetId: string): boolean;
/**
 * Clear maneuver flags at end of turn
 */
export declare function clearManeuverFlags(actor: any): Promise<void>;
//# sourceMappingURL=maneuvers.d.ts.map