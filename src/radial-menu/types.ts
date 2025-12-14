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
  slot: CombatSlot;  // "attack" | "movement" | "utility" | "reaction"
  source: 'power' | 'maneuver';
  range?: number; // numeric range in meters
  rangeCategory?: RangeCategory; // Category of range (melee, ranged, self, area)
  meleeReachMeters?: number; // Optional override for melee reach in meters
  // Utility targeting fields
  rangeMeters?: number; // Max distance to center or target (for utilities)
  aoeShape?: AoEShape; // AoE shape: "none" | "radius" | "cone" | "line"
  aoeRadiusMeters?: number; // For radius utilities
  defaultTargetGroup?: TargetGroup; // "ally" / "enemy" / "creature" / "any"
  allowManualTargetSelection?: boolean; // Default true for Utilities
  item?: any;  // The item document if source is 'power'
  maneuver?: CombatManeuver;  // The maneuver definition if source is 'maneuver'
  powerType?: string; // e.g. "active" | "active-buff" | "movement" | "utility" | "reaction"
  tags?: string[];  // Tags for additional filtering (e.g. ["buff", "stance"])
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
export const MS_INNER_SEGMENTS: InnerSegment[] = [
  { id: 'movement', color: 0xffe066, label: 'Move' },
  { id: 'attack', color: 0xff6666, label: 'Atk' },
  { id: 'utility', color: 0x66aaff, label: 'Util' },
  { id: 'active-buff', color: 0xcc88ff, label: 'Buff' }
];

/**
 * Radial menu dimensions
 */
export const MS_INNER_RADIUS = 60;
export const MS_OUTER_RING_INNER = 80;  // Inner radius of outer ring (where wedges start)
export const MS_OUTER_RING_OUTER = 140;  // Outer radius of outer ring (where wedges end)

