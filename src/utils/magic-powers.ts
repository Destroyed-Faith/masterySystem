/**
 * Magic Powers (Spell School Powers) Index
 * 
 * This file provides access to magic powers organized by spell school.
 * Converts SpellDefinition to PowerDefinition format for compatibility.
 */

import type { PowerDefinition, PowerLevelDefinition } from './powers/types.js';
import type { SpellDefinition, SpellLevelDefinition } from './spells/types.js';
import { PYROMANCY_SPELLS } from './spells/pyromancy.js';
import { MALEFIC_ARTS_SPELLS } from './spells/malefic-arts.js';
import { OLD_PACT_SPELLS } from './spells/old-pact.js';
import { THORN_WHISPER_SPELLS } from './spells/thorn-whisper.js';
import { BREACH_BREAK_SPELLS } from './spells/breach-break.js';
import { AEGIS_BENEDICTIONS_SPELLS } from './spells/aegis-benedictions.js';
import { BOUND_MIND_SPELLS } from './spells/bound-mind.js';

/**
 * Convert SpellLevelDefinition to PowerLevelDefinition
 */
function convertSpellLevelToPowerLevel(spellLevel: SpellLevelDefinition): PowerLevelDefinition {
  const powerLevel: PowerLevelDefinition = {
    level: spellLevel.level,
    type: spellLevel.type,
    range: spellLevel.range,
    aoe: spellLevel.aoe,
    duration: spellLevel.duration,
    effect: spellLevel.effect,
    special: spellLevel.special,
    cost: spellLevel.cost ? {
      action: spellLevel.cost.action,
      movement: spellLevel.cost.movement,
      reaction: spellLevel.cost.reaction,
      charges: spellLevel.cost.charged ? 1 : 0,
      stones: 0
    } : undefined,
    roll: spellLevel.roll
  };
  
  // Add raises to effect if present
  if (spellLevel.raises) {
    powerLevel.effect = powerLevel.effect + (powerLevel.effect ? ' | ' : '') + `Raises: ${spellLevel.raises}`;
  }
  
  return powerLevel;
}

/**
 * Convert SpellDefinition to PowerDefinition
 */
function convertSpellToPower(spell: SpellDefinition): PowerDefinition {
  // Map spellType to powerType
  let powerType: PowerDefinition['powerType'] = 'active';
  if (spell.spellType === 'utility') {
    powerType = 'utility';
  } else if (spell.spellType === 'movement') {
    powerType = 'movement';
  } else if (spell.spellType === 'buff') {
    powerType = 'buff';
  }
  
  return {
    name: spell.name,
    tree: spell.school, // Convert school to tree
    powerType: powerType,
    description: spell.description,
    levels: spell.levels.map(convertSpellLevelToPowerLevel)
  };
}

/**
 * All magic powers from all spell schools
 */
export const ALL_MAGIC_POWERS: PowerDefinition[] = [
  ...PYROMANCY_SPELLS.map(convertSpellToPower),
  ...MALEFIC_ARTS_SPELLS.map(convertSpellToPower),
  ...OLD_PACT_SPELLS.map(convertSpellToPower),
  ...THORN_WHISPER_SPELLS.map(convertSpellToPower),
  ...BREACH_BREAK_SPELLS.map(convertSpellToPower),
  ...AEGIS_BENEDICTIONS_SPELLS.map(convertSpellToPower),
  ...BOUND_MIND_SPELLS.map(convertSpellToPower)
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
