/**
 * Types and Constants for Radial Menu
 */
import type { CombatSlot, CombatManeuver } from '../system/combat-maneuvers';
/**
 * Target group for utility powers
 */
export type TargetGroup = 'self' | 'ally' | 'enemy' | 'creature' | 'any';
/**
 * AoE shape for utility powers
 */
export type AoEShape = 'none' | 'radius' | 'cone' | 'line';
/**
 * Combat option interface for the radial menu
 */
export interface RadialCombatOption {
    id: string;
    name: string;
    description: string;
    slot: CombatSlot;
    source: 'power' | 'maneuver';
    range?: number;
    meleeReachMeters?: number;
    rangeMeters?: number;
    aoeShape?: AoEShape;
    aoeRadiusMeters?: number;
    defaultTargetGroup?: TargetGroup;
    allowManualTargetSelection?: boolean;
    item?: any;
    maneuver?: CombatManeuver;
    powerType?: string;
    tags?: string[];
    costsMovement?: boolean;
    costsAction?: boolean;
}
/**
 * Inner segment definition
 */
export interface InnerSegment {
    id: 'movement' | 'attack' | 'utility' | 'active-buff';
    color: number;
    label: string;
}
/**
 * Inner segments configuration
 */
export declare const MS_INNER_SEGMENTS: InnerSegment[];
/**
 * Radial menu dimensions
 */
export declare const MS_INNER_RADIUS = 60;
export declare const MS_OUTER_RING_INNER = 80;
export declare const MS_OUTER_RING_OUTER = 140;
/**
 * Check if grid is enabled on the current scene
 * @returns true if grid is enabled and not gridless
 */
export declare function hasGridEnabled(): boolean;
/**
 * Get the grid type of the current scene
 * @returns Grid type constant or null if no grid
 */
export declare function getGridType(): number | null;
/**
 * Get grid type name as string
 * @returns Human-readable grid type name
 */
export declare function getGridTypeName(): string;
//# sourceMappingURL=types.d.ts.map