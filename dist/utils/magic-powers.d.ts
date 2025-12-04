/**
 * Magic Powers (Spell Schools) configuration for Mastery System
 * These are powers from the 6 Spell Schools (Mastery Spell Trees)
 */
export interface MagicPowerLevel {
    level: number;
    type: string;
    range: string;
    aoe?: string;
    duration: string;
    effect: string;
    special?: string;
}
export interface MagicPowerDefinition {
    name: string;
    school: string;
    description: string;
    levels: MagicPowerLevel[];
}
export declare const MAGIC_POWERS: Record<string, MagicPowerDefinition[]>;
/**
 * Get all magic powers for a specific school
 */
export declare function getMagicPowersBySchool(schoolName: string): MagicPowerDefinition[];
/**
 * Get a specific magic power
 */
export declare function getMagicPower(schoolName: string, powerName: string): MagicPowerDefinition | undefined;
/**
 * Get all magic powers across all schools
 */
export declare function getAllMagicPowers(): MagicPowerDefinition[];
//# sourceMappingURL=magic-powers.d.ts.map