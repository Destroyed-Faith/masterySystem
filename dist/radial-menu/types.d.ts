/**
 * Types and Constants for Radial Menu
 */
import type { CombatSlot, CombatManeuver } from '../system/combat-maneuvers';
/**
 * Range category for combat options
 */
export type RangeCategory = 'melee' | 'ranged' | 'self' | 'area';
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
    rangeCategory?: RangeCategory;
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
//# sourceMappingURL=types.d.ts.map