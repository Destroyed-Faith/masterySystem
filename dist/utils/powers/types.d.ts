/**
 * Shared types for Mastery Powers
 *
 * NOTE: These types are kept for backwards compatibility.
 * New code should use the types from ../types/item.ts (NewArtifactPowerData, etc.)
 */
export interface PowerLevelDefinition {
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
export type { NewArtifactPowerData, PowerLevelRow, RangeSpec, AoeSpec, DurationSpec, EffectSpec, PowerSpecial, RaiseUpgrade, PowerCategory } from '../../types/item.js';
//# sourceMappingURL=types.d.ts.map