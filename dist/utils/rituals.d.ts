/**
 * Rituals configuration for Mastery System
 */
export interface RitualDefinition {
    name: string;
    description: string;
    type: string;
    cost: string;
    duration: string;
    requirement?: string;
    roll: string;
    raises: Array<{
        level: string;
        effect: string;
    }>;
    danger?: string;
}
export declare const RITUALS: RitualDefinition[];
/**
 * Get all rituals
 */
export declare function getAllRituals(): RitualDefinition[];
/**
 * Get ritual by name
 */
export declare function getRitual(name: string): RitualDefinition | undefined;
//# sourceMappingURL=rituals.d.ts.map