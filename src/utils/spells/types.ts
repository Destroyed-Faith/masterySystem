/**
 * Shared types for Mastery Spell Schools
 */

export interface SpellLevelDefinition {
  level: number;
  type: string; // "Active", "Utility", "Movement", "Buff", etc.
  range?: string;
  aoe?: string;
  duration?: string;
  effect: string;
  special?: string;
  raises?: string; // Description of available raises
  cost?: {
    action?: boolean;
    movement?: boolean;
    reaction?: boolean;
    charged?: boolean; // For charged spells
  };
  roll?: {
    attribute?: string;
    damage?: string;
    damageType?: string;
    healing?: string;
    tn?: number;
  };
}

export interface SpellDefinition {
  name: string;
  school: string;
  spellType: 'active' | 'utility' | 'movement' | 'buff';
  description: string;
  levels: SpellLevelDefinition[];
}

