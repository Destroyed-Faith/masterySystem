/**
 * Shared types for Mastery Powers
 */
export interface PowerLevelDefinition {
    level: number;
    type: string;
    range?: string;
    aoe?: string;
    duration: string;
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
//# sourceMappingURL=types.d.ts.map