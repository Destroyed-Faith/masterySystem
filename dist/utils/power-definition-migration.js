/**
 * Migration utility for PowerDefinition to new structure
 */
import { normalizeAoeSpec, normalizePowerSpecial } from './power-spec-normalize.js';
/**
 * Parse special string to PowerSpecial array
 */
function parseSpecial(specialStr) {
    if (!specialStr)
        return [];
    const specials = [];
    // Split by comma if multiple specials
    const parts = specialStr.split(',').map(s => s.trim());
    for (const part of parts) {
        // Try to parse "Lacerate(3)" format
        const match = part.match(/(\w+)\((\d+)\)/);
        if (match) {
            const key = match[1];
            const value = parseInt(match[2], 10);
            specials.push({
                key,
                value,
                raiseCost: value // Default: raiseCost = value
            });
        }
        else {
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
            }
            else {
                // Fallback: use whole string as key
                specials.push({
                    key: part,
                    raiseCost: 1
                });
            }
        }
    }
    return specials.map((s) => normalizePowerSpecial(s)).filter(Boolean);
}
/**
 * Parse range string to RangeSpec
 */
function parseRangeFromString(rangeStr) {
    if (!rangeStr)
        return { kind: 'self' };
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
function parseAoeFromString(aoeStr) {
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
function parseDurationFromString(durationStr, powerType) {
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
function parseEffectFromString(effectStr, damageStr, healingStr) {
    const effect = {
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
            }
            else {
                effect.text = `Weapon DMG +${diceMatch ? diceMatch[1] : damageStr}`;
            }
        }
    }
    if (healingStr) {
        const diceMatch = healingStr.match(/(\d+d\d+)/i);
        if (diceMatch) {
            if (!effect.text) {
                effect.text = `+${diceMatch[1]} Heal`;
            }
            else {
                effect.text = `${effect.text} (+${diceMatch[1]} heal)`;
            }
        }
    }
    return effect;
}
/**
 * Determine type string from level data
 */
function determineTypeFromLevel(level, powerType) {
    const typeLower = level.type?.toLowerCase() || '';
    if (typeLower.includes('melee'))
        return 'melee';
    if (typeLower.includes('ranged'))
        return 'ranged';
    if (typeLower.includes('utility'))
        return 'utility';
    if (typeLower.includes('buff'))
        return 'buff';
    if (typeLower.includes('reaction'))
        return 'reaction';
    if (typeLower.includes('passive'))
        return 'passive';
    if (typeLower.includes('movement'))
        return 'movement';
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
    if (powerType === 'active')
        return 'melee';
    if (powerType === 'utility')
        return 'utility';
    if (powerType === 'buff')
        return 'buff';
    if (powerType === 'reaction')
        return 'reaction';
    if (powerType === 'passive')
        return 'passive';
    if (powerType === 'movement')
        return 'movement';
    return 'melee';
}
/**
 * Convert PowerCategory
 */
function convertPowerTypeToCategory(powerType) {
    const map = {
        'active': 'active',
        'buff': 'activeBuff',
        'utility': 'active', // Utility retired — legacy items fall back to active
        'passive': 'passive',
        'reaction': 'reaction',
        'movement': 'movement'
    };
    return map[powerType] || 'active';
}
/**
 * Convert cost structure
 */
function convertCost(level, powerType) {
    const cost = level.cost || {};
    let action = 'attack';
    if (cost.reaction) {
        action = 'reaction';
    }
    else if (cost.movement) {
        action = 'movement';
    }
    else if (cost.action) {
        // Utility action cost was retired; buffs/utilities default to an attack action.
        action = 'attack';
    }
    else {
        action = 'none';
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
function convertRoll(level) {
    const roll = level.roll || {};
    let kind = 'none';
    if (roll.attribute) {
        if (roll.damage || roll.healing) {
            kind = 'attack';
        }
        else {
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
function convertLevelToRow(level, powerType, lvl) {
    const aoeRaw = parseAoeFromString(level.aoe);
    const aoeNorm = normalizeAoeSpec(aoeRaw);
    return {
        lvl,
        type: determineTypeFromLevel(level, powerType),
        range: parseRangeFromString(level.range),
        aoe: aoeNorm ?? aoeRaw,
        duration: parseDurationFromString(level.duration, powerType),
        effect: parseEffectFromString(level.effect, level.roll?.damage, level.roll?.healing),
        specials: parseSpecial(level.special)
    };
}
/**
 * Convert PowerDefinition to NewArtifactPowerData
 */
export function convertPowerDefinitionToNewStructure(power) {
    const category = convertPowerTypeToCategory(power.powerType);
    // Get base cost and roll from first level
    const firstLevel = power.levels[0];
    const baseCost = convertCost(firstLevel, power.powerType);
    const baseRoll = convertRoll(firstLevel);
    // Convert all 16 levels, falling back to the last known level row for
    // ranks that the legacy definition didn't specify (max was 4).
    const levels = {};
    for (let i = 1; i <= 16; i++) {
        const src = power.levels[i - 1] || power.levels[Math.min(power.levels.length - 1, i - 1)] || firstLevel;
        levels[String(i)] = convertLevelToRow(src, power.powerType, i);
    }
    // Add trigger for reactions if needed
    let trigger;
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
//# sourceMappingURL=power-definition-migration.js.map