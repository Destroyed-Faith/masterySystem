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
  slot: CombatSlot;  // "attack" | "movement" | "utility" | "reaction"
  source: 'power' | 'maneuver' | 'npc-attack';
  /** Set when source is npc-attack */
  npcAttackIndex?: number;
  /** Phase index for phased bosses; null/undefined = use actor system.npcActivePhaseIndex */
  npcPhaseIndex?: number | null;
  range?: number; // numeric range in meters (always set for all options)
  meleeReachMeters?: number; // Optional override for melee reach in meters
  /** Optional minimum range in meters (e.g. NPC ranged attacks). */
  rangeMinMeters?: number;
  // Utility targeting fields
  rangeMeters?: number; // Max distance to center or target (for utilities)
  aoeShape?: AoEShape; // AoE shape: "none" | "radius" | "cone" | "line"
  aoeRadiusMeters?: number; // For radius utilities
  defaultTargetGroup?: TargetGroup; // "ally" / "enemy" / "creature" / "any"
  allowManualTargetSelection?: boolean; // Default true for Utilities
  /** Hex placement UX: utility (blue) vs hostile zone (orange). */
  aoePlacementProfile?: 'utility' | 'hostile-zone';
  /** Definition duration string for persistent zones (table tracking). */
  zoneDurationNote?: string;
  item?: any;  // The item document if source is 'power'
  /** Force a specific weapon item (by id) for this attack, e.g. an artifact natural weapon (Bite). */
  forcedWeaponItemId?: string;
  maneuver?: CombatManeuver;  // The maneuver definition if source is 'maneuver'
  powerType?: string; // e.g. "active" | "active-buff" | "movement" | "utility" | "reaction"
  tags?: string[];  // Tags for additional filtering (e.g. ["buff", "stance"])
  /** Artifact level-progression metadata (set for artifact-derived options). */
  artifactRowSpecial?: string; // The row's `special` column (e.g. "Growth Form").
  artifactRowLevel?: number;   // The row's artifact level (1..10).
  /** Active-as-Spell metadata propagated from artifact progression picks. */
  artifactIsSpell?: boolean;
  artifactCastingAttribute?: string;
  artifactSpellResolution?: 'spellAttack';
  artifactPowerTemplateId?: string;
  artifactChosenSpecialKey?: string;
  costsMovement?: boolean; // Whether this option consumes Movement resource
  costsAction?: boolean; // Whether this option consumes Attack Action resource
  /** Melee attack power with a radius AoE: one pick applies the attack to every hostile in reach. */
  burstMeleeAoE?: boolean;
  burstMeleeRadiusMeters?: number;
  /** NSC-Angriff: Split wie mechanics.splitAttack (zwei Karten). */
  npcSplitAttack?: boolean;
  /** NSC-Angriff: Spell — Casting TN = 8 × MR (+ Spell Resistance), nicht Evade. */
  npcIsSpell?: boolean;
  /** NSC-Angriff: Anzahl Radial-Kopien dieser Power (1–5). */
  npcAttacksPerRound?: number;
  /**
   * Stable usage key shared by all radial copies of one NPC attack row
   * (e.g. `npc-attack-root-0`). Used for per-round spend tracking.
   */
  npcAttackUsageKey?: string;
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
  { id: 'utility', color: 0x66aaff, label: 'MAN.' },
  { id: 'active-buff', color: 0xcc88ff, label: 'Buff' }
];

/**
 * Radial menu dimensions
 */
export const MS_INNER_RADIUS = 60;
export const MS_OUTER_RING_INNER = 80;  // Inner radius of outer ring (where wedges start)
export const MS_OUTER_RING_OUTER = 140;  // Outer radius of outer ring (where wedges end)

/**
 * Check if grid is enabled on the current scene
 * @returns true if grid is enabled and not gridless
 */
export function hasGridEnabled(): boolean {
  return canvas.grid !== null && canvas.grid !== undefined && canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS;
}

/**
 * Get the grid type of the current scene
 * @returns Grid type constant or null if no grid
 */
export function getGridType(): number | null {
  return canvas.grid?.type ?? null;
}

/**
 * Get grid type name as string
 * @returns Human-readable grid type name
 */
export function getGridTypeName(): string {
  const gridType = getGridType();
  if (gridType === null) return 'None';
  if (gridType === CONST.GRID_TYPES.GRIDLESS) return 'Gridless';
  if (gridType === CONST.GRID_TYPES.SQUARE) return 'Square';
  if (gridType === CONST.GRID_TYPES.HEXAGONAL) return 'Hexagonal';
  return `Unknown (${gridType})`;
}

