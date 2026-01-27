/**
 * Power Data Migration Utilities
 * Migrates old power structure to new structure
 */
/**
 * Check if a power uses the new structure
 */
export function isNewPowerStructure(power) {
    return power && typeof power === 'object' && 'category' in power && 'levels' in power;
}
/**
 * Check if a power uses the old structure
 */
export function isOldPowerStructure(power) {
    return power && typeof power === 'object' && 'powerType' in power && !('category' in power);
}
/**
 * Convert old powerType to new category
 */
function convertPowerTypeToCategory(powerType) {
    const map = {
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
 * Convert old cost structure to new cost structure
 */
function convertCost(oldCost, powerType) {
    let action = 'attack';
    if (oldCost.reaction) {
        action = 'reaction';
    }
    else if (oldCost.movement) {
        action = 'movement';
    }
    else if (oldCost.action) {
        if (powerType === 'utility' || powerType === 'buff') {
            action = 'utility';
        }
        else {
            action = 'attack';
        }
    }
    else {
        action = 'utility';
    }
    return {
        action,
        stones: oldCost.stones || 0,
        charges: oldCost.charges || 0,
        note: undefined
    };
}
/**
 * Convert old roll structure to new roll structure
 */
function convertRoll(oldRoll) {
    let kind = 'none';
    if (oldRoll.attribute) {
        if (oldRoll.tn > 0) {
            kind = 'contest';
        }
        else if (oldRoll.damage || oldRoll.healing) {
            kind = 'attack';
        }
        else {
            kind = 'check';
        }
    }
    return {
        kind,
        attribute: oldRoll.attribute || undefined,
        vs: oldRoll.tn > 0 ? `tn:${oldRoll.tn}` : undefined
    };
}
/**
 * Parse range string to RangeSpec
 */
function parseRange(rangeStr) {
    const lower = rangeStr.toLowerCase();
    if (lower === 'self' || lower === '0m' || rangeStr === '') {
        return { kind: 'self' };
    }
    if (lower.includes('touch')) {
        return { kind: 'touch' };
    }
    // Try to extract meters
    const match = rangeStr.match(/(\d+)m?/i);
    if (match) {
        const meters = parseInt(match[1], 10);
        if (meters <= 8) {
            return { kind: 'distance', m: meters, note: meters <= 8 ? 'below 8m counts as melee' : undefined };
        }
        return { kind: 'distance', m: meters };
    }
    return { kind: 'distance', m: 0, note: rangeStr };
}
/**
 * Parse AoE string to AoeSpec
 */
function parseAoe(aoeStr) {
    if (!aoeStr || aoeStr === '' || aoeStr.toLowerCase() === 'none') {
        return { shape: 'none' };
    }
    const lower = aoeStr.toLowerCase();
    if (lower.includes('radius')) {
        const match = aoeStr.match(/(\d+)m?\s*radius/i);
        return {
            shape: 'radius',
            radiusM: match ? parseInt(match[1], 10) : 5,
            note: aoeStr
        };
    }
    if (lower.includes('cone')) {
        const match = aoeStr.match(/(\d+)m?\s*cone/i);
        return {
            shape: 'cone',
            lengthM: match ? parseInt(match[1], 10) : 10,
            angleDeg: 45,
            note: aoeStr
        };
    }
    if (lower.includes('line')) {
        const match = aoeStr.match(/(\d+)m?\s*line/i);
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
            note: aoeStr
        };
    }
    if (lower.includes('aura')) {
        const match = aoeStr.match(/(\d+)m?\s*aura/i);
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
function parseDuration(durationStr, powerType) {
    const lower = durationStr.toLowerCase();
    if (lower === 'instant' || lower === '') {
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
    if (powerType === 'activeBuff' || powerType === 'buff') {
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
function parseEffect(effectStr, damageStr, healingStr) {
    const effect = {
        text: effectStr || ''
    };
    if (damageStr) {
        effect.dice = damageStr;
        if (!effect.text) {
            effect.text = `Weapon DMG +${damageStr}`;
        }
        else if (!effect.text.includes(damageStr)) {
            effect.text = `${effect.text} (+${damageStr} damage)`;
        }
    }
    if (healingStr) {
        if (!effect.text) {
            effect.text = `+${healingStr} Heal`;
        }
        else {
            effect.text = `${effect.text} (+${healingStr} heal)`;
        }
    }
    return effect;
}
/**
 * Determine type string from power data
 */
function determineType(powerType, tags, rangeStr) {
    if (tags.includes('melee'))
        return 'melee';
    if (tags.includes('ranged'))
        return 'ranged';
    if (powerType === 'utility')
        return 'utility';
    if (powerType === 'buff' || powerType === 'activeBuff')
        return 'buff';
    if (powerType === 'reaction')
        return 'reaction';
    if (powerType === 'passive')
        return 'passive';
    if (powerType === 'movement')
        return 'movement';
    // Heuristic: range <= 8m => melee, else ranged
    const rangeMatch = rangeStr.match(/(\d+)m?/i);
    if (rangeMatch) {
        const meters = parseInt(rangeMatch[1], 10);
        return meters <= 8 ? 'melee' : 'ranged';
    }
    return 'ranged'; // default
}
/**
 * Migrate old ArtifactPowerData to NewArtifactPowerData
 */
export function migrateArtifactPower(oldPower) {
    const category = convertPowerTypeToCategory(oldPower.powerType);
    const rank = oldPower.level || 1;
    // Create level 1 row
    const level1 = {
        lvl: 1,
        type: determineType(oldPower.powerType, oldPower.tags || [], oldPower.range || ''),
        range: parseRange(oldPower.range || ''),
        aoe: parseAoe(oldPower.aoe || ''),
        duration: parseDuration(oldPower.duration || 'instant', oldPower.powerType),
        effect: parseEffect(oldPower.effect || '', oldPower.roll?.damage || '', oldPower.roll?.healing || ''),
        specials: (oldPower.specials || []).map((spec) => {
            // Try to parse "Push(2)" format
            const match = spec.match(/(\w+)\((\d+)\)/);
            if (match) {
                return {
                    key: match[1],
                    value: parseInt(match[2], 10),
                    raiseCost: parseInt(match[2], 10)
                };
            }
            // Fallback: use whole string as key
            return {
                key: spec,
                raiseCost: 1
            };
        })
    };
    // For reactions, add trigger if available
    if (category === 'reaction' && oldPower.requirements?.other) {
        level1.trigger = oldPower.requirements.other;
    }
    const newPower = {
        name: oldPower.name,
        category,
        tags: oldPower.tags || [],
        rank,
        cost: convertCost(oldPower.cost || {}, oldPower.powerType),
        roll: convertRoll(oldPower.roll || {}),
        levels: {
            '1': level1,
            '2': { ...level1, lvl: 2 },
            '3': { ...level1, lvl: 3 },
            '4': { ...level1, lvl: 4 }
        }
    };
    // Add trigger for reactions
    if (category === 'reaction' && oldPower.requirements?.other) {
        newPower.trigger = oldPower.requirements.other;
    }
    // Handle charged tag
    if (oldPower.tags?.includes('charged')) {
        newPower.cost.charges = 1;
    }
    return newPower;
}
/**
 * Migrate old PowerData (item-level) to new structure
 * This is called during Item.prepareData()
 */
export function migratePowerData(oldPower) {
    // If already migrated, return as-is
    if (oldPower.category && oldPower.levels) {
        return oldPower;
    }
    // If no old structure, return as-is
    if (!oldPower.powerType) {
        return oldPower;
    }
    // Migrate
    const category = convertPowerTypeToCategory(oldPower.powerType);
    const rank = oldPower.level || 1;
    const level1 = {
        lvl: 1,
        type: determineType(oldPower.powerType, oldPower.tags || [], oldPower.range || ''),
        range: parseRange(oldPower.range || ''),
        aoe: parseAoe(oldPower.aoe || ''),
        duration: parseDuration(oldPower.duration || 'instant', oldPower.powerType),
        effect: parseEffect(oldPower.effect || '', oldPower.roll?.damage || '', oldPower.roll?.healing || ''),
        specials: (oldPower.specials || []).map((spec) => {
            const match = spec.match(/(\w+)\((\d+)\)/);
            if (match) {
                return {
                    key: match[1],
                    value: parseInt(match[2], 10),
                    raiseCost: parseInt(match[2], 10)
                };
            }
            return {
                key: spec,
                raiseCost: 1
            };
        })
    };
    // Add trigger for reactions
    if (category === 'reaction' && oldPower.requirements?.other) {
        level1.trigger = oldPower.requirements.other;
    }
    // Merge new structure into old
    return {
        ...oldPower,
        category,
        rank,
        trigger: category === 'reaction' ? oldPower.requirements?.other : undefined,
        newCost: convertCost(oldPower.cost || {}, oldPower.powerType),
        newRoll: convertRoll(oldPower.roll || {}),
        levels: {
            '1': level1,
            '2': { ...level1, lvl: 2 },
            '3': { ...level1, lvl: 3 },
            '4': { ...level1, lvl: 4 }
        }
    };
}
//# sourceMappingURL=power-migration.js.map