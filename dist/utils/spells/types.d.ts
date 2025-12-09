/**
 * Type definitions for Spells (Mastery Spell Trees)
 */
export interface SpellLevelDefinition {
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
        charged?: boolean;
    };
    roll?: {
        attribute?: string;
        damage?: string;
        damageType?: string;
        healing?: string;
        raises?: string;
    };
    raises?: string[];
}
export interface SpellDefinition {
    name: string;
    school: string;
    spellType: 'active' | 'utility' | 'movement' | 'buff';
    description: string;
    levels: SpellLevelDefinition[];
    raises?: string[];
}
//# sourceMappingURL=types.d.ts.map