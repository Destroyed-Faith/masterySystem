/**
 * Shared types for Mastery Powers
 * 
 * NOTE: These types are kept for backwards compatibility.
 * New code should use the types from ../types/item.ts (NewArtifactPowerData, etc.)
 */

// Legacy types (deprecated, use NewArtifactPowerData from ../types/item.ts)
export interface PowerLevelDefinition {
  level: number;
  type: string;
  range?: string;
  aoe?: string;
  duration?: string; // Optional - Passive powers don't have duration
  effect: string;
  special?: string;
  cost?: {
    action?: boolean;
    movement?: boolean;
    reaction?: boolean;
    stones?: number;
    charges?: number;
  };
  roll?: {
    attribute?: string;
    damage?: string;
    damageType?: string;
    healing?: string;
    raises?: string;
  };
}

export interface PowerDefinition {
  name: string;
  tree: string;
  powerType: 'active' | 'passive' | 'reaction' | 'movement' | 'utility' | 'buff';
  description: string;
  passiveCategory?: 'armor' | 'damage' | 'healing' | 'roll' | 'save' | 'utility';
  levels: PowerLevelDefinition[];
}

// Re-export new types for convenience
export type {
  NewArtifactPowerData,
  PowerLevelRow,
  RangeSpec,
  AoeSpec,
  AoeCenter,
  AoeTargetFilter,
  DurationSpec,
  EffectSpec,
  PowerSpecial,
  RaiseUpgrade,
  PowerCategory,
  PowerMechanics,
  PowerMechanicsHealing,
  PowerMechanicsModifySpecial,
  PowerMechanicsGrantNextHitEffect,
  ModifySpecialMode,
  PowerMechanicsTrigger,
} from '../../types/item.js';

