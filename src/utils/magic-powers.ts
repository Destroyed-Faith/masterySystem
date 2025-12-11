/**
 * Magic Powers (Spell School Powers) Index
 * 
 * This file provides access to magic powers organized by spell school.
 * Similar structure to mastery powers but for spell schools.
 */

import type { PowerDefinition } from './powers/types.js';

/**
 * All magic powers from all spell schools
 * This will be populated as spell definitions are added
 */
export const ALL_MAGIC_POWERS: PowerDefinition[] = [
  // TODO: Add spell definitions here as they are created
  // Example structure:
  // {
  //   name: 'Fireball',
  //   tree: 'Pyromancy',
  //   powerType: 'active',
  //   description: 'A ball of fire that explodes on impact',
  //   levels: [
  //     {
  //       level: 1,
  //       type: 'Ranged',
  //       range: '30m',
  //       aoe: '5m radius',
  //       effect: 'Deal 2d6 Fire damage',
  //       special: 'Ignite 1'
  //     }
  //   ]
  // }
];

/**
 * Get all magic powers for a specific Spell School
 * @param schoolName - The name of the Spell School
 * @returns Array of PowerDefinition objects for that school
 */
export function getMagicPowersBySchool(schoolName: string): PowerDefinition[] {
  return ALL_MAGIC_POWERS.filter(power => power.tree === schoolName);
}

/**
 * Get a specific magic power by school and name
 * @param schoolName - The name of the Spell School
 * @param powerName - The name of the power
 * @returns PowerDefinition or undefined if not found
 */
export function getMagicPower(schoolName: string, powerName: string): PowerDefinition | undefined {
  return ALL_MAGIC_POWERS.find(
    power => power.tree === schoolName && power.name === powerName
  );
}

