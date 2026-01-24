/**
 * Magic Powers (Spell School Powers) Index
 *
 * This file provides access to magic powers organized by spell school.
 * Converts SpellDefinition to PowerDefinition format for compatibility.
 */
import type { PowerDefinition } from './powers/types.js';
/**
 * All magic powers from all spell schools
 */
export declare const ALL_MAGIC_POWERS: PowerDefinition[];
/**
 * Get all magic powers for a specific Spell School
 * @param schoolName - The name of the Spell School
 * @returns Array of PowerDefinition objects for that school
 */
export declare function getMagicPowersBySchool(schoolName: string): PowerDefinition[];
/**
 * Get a specific magic power by school and name
 * @param schoolName - The name of the Spell School
 * @param powerName - The name of the power
 * @returns PowerDefinition or undefined if not found
 */
export declare function getMagicPower(schoolName: string, powerName: string): PowerDefinition | undefined;
//# sourceMappingURL=magic-powers.d.ts.map