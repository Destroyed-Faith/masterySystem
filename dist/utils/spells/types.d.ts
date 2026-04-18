/**
 * Shared types for Mastery Spell Schools
 */
import type { PowerMechanics } from '../../types/item';
export interface SpellLevelDefinition {
    /** Optional structured mechanics block — parsed by the aggregator and
     *  conditional engine. Same shape as power-level mechanics. */
    mechanics?: PowerMechanics;
    level: number;
    type: string;
    range?: string;
    aoe?: string;
    duration?: string;
    effect: string;
    special?: string;
    raises?: string;
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
//# sourceMappingURL=types.d.ts.map