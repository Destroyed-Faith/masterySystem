/**
 * Shared types for Mastery Powers
 */

export interface PowerLevel {
  level: number;
  type: string;
  range?: string;
  aoe?: string;
  duration?: string;
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
    tn?: number;
    damage?: string;
    damageType?: string;
    penetration?: number;
  };
}

export interface PowerDefinition {
  name: string;
  tree: string;
  powerType: 'active' | 'buff' | 'utility' | 'passive' | 'reaction' | 'movement';
  passiveCategory?: 'armor' | 'evade' | 'toHit' | 'damage' | 'roll' | 'save' | 'hitPoint' | 'healing' | 'awareness' | 'attribute';
  description: string;
  levels: PowerLevel[];
}

