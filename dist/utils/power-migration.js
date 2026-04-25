/**
 * Power Data Migration Utilities
 * Migrates old power structure to new structure
 */
import { normalizeAoeSpec, normalizePowerSpecial } from './power-spec-normalize.js';
/**
 * Check if a power uses the new structure
 */
export function isNewPowerStructure(power) {
    return power && typeof power === 'object' && 'category' in power && 'levels' in power && typeof power.levels === 'object' && !Array.isArray(power.levels);
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
        'utility': 'active', // Utility retired — legacy items fall back to active
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
    const cost = {};
    if (oldCost.reaction) {
        cost.action = 'reaction';
    }
    else if (oldCost.movement) {
        cost.action = 'movement';
    }
    else if (oldCost.action) {
        if (powerType === 'utility' || powerType === 'buff') {
            cost.action = 'none'; // Utility powers don't cost attack actions
        }
        else {
            cost.action = 'attack';
        }
    }
    else {
        cost.action = 'none';
    }
    if (oldCost.stones) {
        cost.stones = oldCost.stones;
    }
    if (oldCost.charges) {
        cost.charges = oldCost.charges;
    }
    return cost;
}
/**
 * Convert old roll structure to new roll structure
 * NOTE: This is only used for item-level PowerData, not EmbeddedPowerData
 */
function convertRoll(oldRoll) {
    // This function is kept for backwards compatibility with item-level PowerData
    // EmbeddedPowerData doesn't have a roll field - dice goes in effect.dice
    return {
        kind: 'none',
        attribute: oldRoll?.attribute || undefined,
        vs: oldRoll?.tn > 0 ? `tn:${oldRoll.tn}` : undefined
    };
}
/**
 * Parse range string to RangeSpec or null
 */
function parseRange(rangeStr) {
    if (!rangeStr || rangeStr.trim() === '' || rangeStr === '—' || rangeStr === '-') {
        return null;
    }
    const lower = rangeStr.toLowerCase().trim();
    if (lower === 'self' || lower === '0m') {
        return { kind: 'self' };
    }
    if (lower.includes('touch')) {
        return { kind: 'touch' };
    }
    if (lower.includes('melee')) {
        return { kind: 'melee' };
    }
    // Try to extract meters
    const match = rangeStr.match(/(\d+)m?/i);
    if (match) {
        const meters = parseInt(match[1], 10);
        if (meters <= 8) {
            return { kind: 'melee', m: meters };
        }
        return { kind: 'distance', m: meters };
    }
    return { kind: 'distance', m: 0, note: rangeStr };
}
/**
 * Parse AoE string to AoeSpec or null
 */
function parseAoe(aoeStr) {
    const finish = (raw) => normalizeAoeSpec(raw) ?? raw;
    if (!aoeStr || aoeStr === '' || aoeStr.toLowerCase() === 'none') {
        return null;
    }
    const lower = aoeStr.toLowerCase();
    if (lower.includes('radius')) {
        const match = aoeStr.match(/(\d+)m?\s*radius/i);
        return finish({
            shape: 'radius',
            m: match ? parseInt(match[1], 10) : 5,
            note: aoeStr
        });
    }
    if (lower.includes('cone')) {
        const match = aoeStr.match(/(\d+)m?\s*cone/i);
        return finish({
            shape: 'cone',
            m: match ? parseInt(match[1], 10) : 10,
            note: aoeStr
        });
    }
    if (lower.includes('line')) {
        const match = aoeStr.match(/(\d+)m?\s*line/i);
        return finish({
            shape: 'line',
            m: match ? parseInt(match[1], 10) : 10,
            note: aoeStr
        });
    }
    if (lower.includes('burst')) {
        const match = aoeStr.match(/(\d+)m?\s*burst/i);
        return finish({
            shape: 'burst',
            m: match ? parseInt(match[1], 10) : 5,
            note: aoeStr
        });
    }
    const match = aoeStr.match(/(\d+)m?/i);
    return finish({
        shape: 'radius',
        m: match ? parseInt(match[1], 10) : 5,
        note: aoeStr
    });
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
            return { kind: 'masteryRounds', note: durationStr };
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
        return { kind: 'masteryRounds', note: durationStr };
    }
    if (lower.includes('scene')) {
        return { kind: 'scene', note: durationStr };
    }
    if (lower === 'permanent') {
        return { kind: 'scene', note: 'permanent' };
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
 * Generate a unique ID for a power
 */
function generatePowerId() {
    return foundry.utils.randomID();
}
/**
 * Migrate old ArtifactPowerData to EmbeddedPowerData
 */
export function migrateArtifactPower(oldPower) {
    const category = convertPowerTypeToCategory(oldPower.powerType);
    // Create level 1 row
    const level1 = {
        type: determineType(oldPower.powerType, oldPower.tags || [], oldPower.range || ''),
        range: parseRange(oldPower.range || ''),
        aoe: parseAoe(oldPower.aoe || ''),
        duration: parseDuration(oldPower.duration || 'instant', oldPower.powerType),
        effect: parseEffect(oldPower.effect || '', oldPower.roll?.damage || '', oldPower.roll?.healing || ''),
        specials: (oldPower.specials || []).map((spec) => {
            // Try to parse "Push(2)" format
            const match = spec.match(/(\w+)\((\d+)\)/);
            if (match) {
                return normalizePowerSpecial({
                    key: match[1],
                    rank: parseInt(match[2], 10)
                });
            }
            return normalizePowerSpecial({ key: spec });
        })
    };
    // Clone level 1 for levels 2-4, ensuring nulls are used instead of undefined
    const cloneLevel = () => ({
        type: level1.type,
        range: level1.range === null ? null : { ...level1.range },
        aoe: level1.aoe === null ? null : { ...level1.aoe },
        duration: { ...level1.duration },
        effect: { ...level1.effect },
        specials: level1.specials.map(s => ({ ...s }))
    });
    const newPower = {
        id: generatePowerId(),
        name: oldPower.name,
        category,
        tags: oldPower.tags || [],
        cost: convertCost(oldPower.cost || {}, oldPower.powerType),
        levels: (() => {
            const out = {};
            out['1'] = level1;
            const keys = [
                '2', '3', '4', '5', '6', '7', '8',
                '9', '10', '11', '12', '13', '14', '15', '16',
            ];
            for (const k of keys)
                out[k] = cloneLevel();
            return out;
        })(),
    };
    // Add trigger for reactions
    if (category === 'reaction' && oldPower.requirements?.other) {
        newPower.trigger = oldPower.requirements.other;
    }
    // Handle charged tag
    if (oldPower.tags?.includes('charged')) {
        if (!newPower.cost.charges || newPower.cost.charges < 1) {
            newPower.cost.charges = 1;
        }
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
                return normalizePowerSpecial({
                    key: match[1],
                    value: parseInt(match[2], 10),
                    raiseCost: parseInt(match[2], 10)
                });
            }
            return normalizePowerSpecial({ key: spec, raiseCost: 1 });
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
        levels: (() => {
            const out = {};
            for (let i = 1; i <= 16; i++) {
                out[String(i)] = i === 1 ? level1 : { ...level1, lvl: i };
            }
            return out;
        })(),
    };
}
//# sourceMappingURL=power-migration.js.map