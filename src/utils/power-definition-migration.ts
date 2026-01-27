/**
 * Migration utility for PowerDefinition to new structure
 */

import type { PowerDefinition, PowerLevelDefinition } from './powers/types.js';
import type { NewArtifactPowerData, PowerLevelRow, RangeSpec, AoeSpec, DurationSpec, EffectSpec, PowerSpecial, PowerCategory, PowerActionCost, PowerRollKind } from '../types/item.js';

/**
 * Parse special string to PowerSpecial array
 */
function parseSpecial(specialStr: string | undefined): PowerSpecial[] {
  if (!specialStr) return [];
  
  const specials: PowerSpecial[] = [];
  
  // Split by comma if multiple specials
  const parts = specialStr.split(',').map(s => s.trim());
  
  for (const part of parts) {
    // Try to parse "Bleeding(3)" format
    const match = part.match(/(\w+)\((\d+)\)/);
    if (match) {
      const key = match[1];
      const value = parseInt(match[2], 10);
      specials.push({
        key,
        value,
        raiseCost: value // Default: raiseCost = value
      });
    } else {
      // Try to parse "Prone(1)" or just "Prone"
      const simpleMatch = part.match(/(\w+)(?:\((\d+)\))?/);
      if (simpleMatch) {
        const key = simpleMatch[1];
        const value = simpleMatch[2] ? parseInt(simpleMatch[2], 10) : undefined;
        specials.push({
          key,
          value,
          raiseCost: value || 1 // Default to 1 if no value
        });
      } else {
        // Fallback: use whole string as key
        specials.push({
          key: part,
          raiseCost: 1
        });
      }
    }
  }
  
  return specials;
}

/**
 * Parse range string to RangeSpec
 */
function parseRangeFromString(rangeStr: string | undefined): RangeSpec {
  if (!rangeStr) return { kind: 'self' };
  
  const lower = rangeStr.toLowerCase();
  
  if (lower === 'self' || lower === '0 m' || lower === '0m') {
    return { kind: 'self' };
  }
  
  if (lower.includes('touch') || lower === 'melee') {
    return { kind: 'touch' };
  }
  
  // Try to extract meters
  const match = rangeStr.match(/(\d+)\s*m/i);
  if (match) {
    const meters = parseInt(match[1], 10);
    if (meters <= 8) {
      return { kind: 'distance', m: meters, note: 'below 8m counts as melee' };
    }
    return { kind: 'distance', m: meters };
  }
  
  return { kind: 'distance', m: 0, note: rangeStr };
}

/**
 * Parse AoE string to AoeSpec
 */
function parseAoeFromString(aoeStr: string | undefined): AoeSpec {
  if (!aoeStr || aoeStr === '' || aoeStr.toLowerCase() === 'none') {
    return { shape: 'none' };
  }
  
  const lower = aoeStr.toLowerCase();
  
  if (lower.includes('radius')) {
    const match = aoeStr.match(/(\d+)\s*m?\s*radius/i);
    return {
      shape: 'radius',
      radiusM: match ? parseInt(match[1], 10) : 5,
      note: aoeStr
    };
  }
  
  if (lower.includes('cone')) {
    const match = aoeStr.match(/(\d+)\s*m?\s*cone/i);
    return {
      shape: 'cone',
      lengthM: match ? parseInt(match[1], 10) : 10,
      angleDeg: 45,
      note: aoeStr
    };
  }
  
  if (lower.includes('line')) {
    const match = aoeStr.match(/(\d+)\s*m?\s*line/i);
    return {
      shape: 'line',
      lengthM: match ? parseInt(match[1], 10) : 10,
      widthM: 1,
      note: aoeStr
    };
  }
  
  if (lower.includes('weapon')) {
    return {
      shape: 'weapon',
      targets: 1,
      note: aoeStr
    };
  }
  
  if (lower.includes('aura')) {
    const match = aoeStr.match(/(\d+)\s*m?\s*aura/i);
    return {
      shape: 'aura',
      radiusM: match ? parseInt(match[1], 10) : 1,
      note: aoeStr
    };
  }
  
  return { shape: 'single', note: aoeStr };
}

/**
 * Parse duration string to DurationSpec
 */
function parseDurationFromString(durationStr: string | undefined, powerType: string): DurationSpec {
  if (!durationStr) {
    if (powerType === 'passive') {
      return { kind: 'rounds', rounds: 999, note: 'permanent' };
    }
    return { kind: 'instant' };
  }
  
  const lower = durationStr.toLowerCase();
  
  if (lower === 'instant') {
    return { kind: 'instant' };
  }
  
  if (lower.includes('round')) {
    const match = durationStr.match(/(\d+)\s*round/i);
    if (match) {
      return { kind: 'rounds', rounds: parseInt(match[1], 10) };
    }
    if (lower.includes('mastery') || lower.includes('mr')) {
      return { kind: 'masteryRankRounds', note: durationStr };
    }
    return { kind: 'rounds', rounds: 1, note: durationStr };
  }
  
  if (lower.includes('turn')) {
    return { kind: 'untilNextTurn', note: durationStr };
  }
  
  if (lower === 'permanent') {
    return { kind: 'rounds', rounds: 999, note: 'permanent' };
  }
  
  // Default based on power type
  if (powerType === 'buff') {
    return { kind: 'masteryRankRounds', note: durationStr };
  }
  
  if (powerType === 'utility') {
    return { kind: 'rounds', rounds: 1, note: durationStr };
  }
  
  return { kind: 'instant', note: durationStr };
}

/**
 * Parse effect string to EffectSpec
 */
function parseEffectFromString(effectStr: string, damageStr: string | undefined, healingStr: string | undefined): EffectSpec {
  const effect: EffectSpec = {
    text: effectStr || ''
  };
  
  if (damageStr) {
    // Extract dice from damage string (e.g., "+2d8" -> "2d8")
    const diceMatch = damageStr.match(/(\d+d\d+)/i);
    if (diceMatch) {
      effect.dice = diceMatch[1];
    }
    
    // If effect text doesn't already contain damage info, add it
    if (!effect.text.toLowerCase().includes('dmg') && !effect.text.toLowerCase().includes('damage')) {
      if (effect.text) {
        effect.text = `${effect.text} (+${diceMatch ? diceMatch[1] : damageStr} damage)`;
      } else {
        effect.text = `Weapon DMG +${diceMatch ? diceMatch[1] : damageStr}`;
      }
    }
  }
  
  if (healingStr) {
    const diceMatch = healingStr.match(/(\d+d\d+)/i);
    if (diceMatch) {
      if (!effect.text) {
        effect.text = `+${diceMatch[1]} Heal`;
      } else {
        effect.text = `${effect.text} (+${diceMatch[1]} heal)`;
      }
    }
  }
  
  return effect;
}

/**
 * Determine type string from level data
 */
function determineTypeFromLevel(level: PowerLevelDefinition, powerType: string): string {
  const typeLower = level.type?.toLowerCase() || '';
  
  if (typeLower.includes('melee')) return 'melee';
  if (typeLower.includes('ranged')) return 'ranged';
  if (typeLower.includes('utility')) return 'utility';
  if (typeLower.includes('buff')) return 'buff';
  if (typeLower.includes('reaction')) return 'reaction';
  if (typeLower.includes('passive')) return 'passive';
  if (typeLower.includes('movement')) return 'movement';
  
  // Heuristic based on range
  if (level.range) {
    const rangeMatch = level.range.match(/(\d+)\s*m/i);
    if (rangeMatch) {
      const meters = parseInt(rangeMatch[1], 10);
      return meters <= 8 ? 'melee' : 'ranged';
    }
    if (level.range.toLowerCase().includes('melee') || level.range.toLowerCase() === '0 m') {
      return 'melee';
    }
  }
  
  // Default based on power type
  if (powerType === 'active') return 'melee';
  if (powerType === 'utility') return 'utility';
  if (powerType === 'buff') return 'buff';
  if (powerType === 'reaction') return 'reaction';
  if (powerType === 'passive') return 'passive';
  if (powerType === 'movement') return 'movement';
  
  return 'melee';
}

/**
 * Convert PowerCategory
 */
function convertPowerTypeToCategory(powerType: string): PowerCategory {
  const map: Record<string, PowerCategory> = {
    'active': 'active',
    'buff': 'activeBuff',
    'utility': 'utility',
    'passive': 'passive',
    'reaction': 'reaction',
    'movement': 'movement'
  };
  return map[powerType] || 'active';
}

/**
 * Convert cost structure
 */
function convertCost(level: PowerLevelDefinition, powerType: string): NewArtifactPowerData['cost'] {
  const cost = level.cost || {};
  let action: PowerActionCost = 'attack';
  
  if (cost.reaction) {
    action = 'reaction';
  } else if (cost.movement) {
    action = 'movement';
  } else if (cost.action) {
    if (powerType === 'utility' || powerType === 'buff') {
      action = 'utility';
    } else {
      action = 'attack';
    }
  } else {
    action = 'utility';
  }
  
  return {
    action,
    stones: cost.stones || 0,
    charges: cost.charges || 0
  };
}

/**
 * Convert roll structure
 */
function convertRoll(level: PowerLevelDefinition): NewArtifactPowerData['roll'] {
  const roll = level.roll || {};
  let kind: PowerRollKind = 'none';
  
  if (roll.attribute) {
    if (roll.damage || roll.healing) {
      kind = 'attack';
    } else {
      kind = 'check';
    }
  }
  
  return {
    kind,
    attribute: roll.attribute || undefined
  };
}

/**
 * Convert PowerLevelDefinition to PowerLevelRow
 */
function convertLevelToRow(level: PowerLevelDefinition, powerType: string, lvl: 1 | 2 | 3 | 4): PowerLevelRow {
  return {
    lvl,
    type: determineTypeFromLevel(level, powerType),
    range: parseRangeFromString(level.range),
    aoe: parseAoeFromString(level.aoe),
    duration: parseDurationFromString(level.duration, powerType),
    effect: parseEffectFromString(level.effect, level.roll?.damage, level.roll?.healing),
    specials: parseSpecial(level.special)
  };
}

/**
 * Convert PowerDefinition to NewArtifactPowerData
 */
export function convertPowerDefinitionToNewStructure(power: PowerDefinition): NewArtifactPowerData {
  const category = convertPowerTypeToCategory(power.powerType);
  
  // Get base cost and roll from first level
  const firstLevel = power.levels[0];
  const baseCost = convertCost(firstLevel, power.powerType);
  const baseRoll = convertRoll(firstLevel);
  
  // Convert all levels
  const levels: Record<'1' | '2' | '3' | '4', PowerLevelRow> = {
    '1': convertLevelToRow(power.levels[0] || firstLevel, power.powerType, 1),
    '2': convertLevelToRow(power.levels[1] || firstLevel, power.powerType, 2),
    '3': convertLevelToRow(power.levels[2] || firstLevel, power.powerType, 3),
    '4': convertLevelToRow(power.levels[3] || firstLevel, power.powerType, 4)
  };
  
  // Add trigger for reactions if needed
  let trigger: string | undefined;
  if (category === 'reaction' && firstLevel.effect) {
    // Try to extract trigger from description or effect
    trigger = power.description || firstLevel.effect;
  }
  
  return {
    name: power.name,
    category,
    tags: [],
    rank: 1, // Default rank
    trigger,
    cost: baseCost,
    roll: baseRoll,
    levels
  };
}

