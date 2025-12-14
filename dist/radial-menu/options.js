/**
 * Option Collection and Parsing for Radial Menu
 */
import { getAvailableManeuvers } from '../system/combat-maneuvers.js';
/**
 * Parse range string (e.g., "8m", "12m", "Self") to numeric meters
 */
function parseRange(rangeStr) {
    if (!rangeStr)
        return undefined;
    // Handle "Self" or "0m" as 0
    if (rangeStr.toLowerCase() === 'self' || rangeStr === '0m') {
        return 0;
    }
    // Extract numeric value from strings like "8m", "12m", "24m"
    const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (match) {
        return parseFloat(match[1]);
    }
    return undefined;
}
/**
 * Map power type to combat slot
 */
function mapPowerTypeToSlot(powerType) {
    switch (powerType) {
        case 'movement':
            return 'movement';
        case 'reaction':
            return 'reaction';
        case 'utility':
            return 'utility';
        case 'active':
        case 'active-buff':
        case 'buff':
        default:
            return 'attack';
    }
}
/**
 * Parse AoE radius from string (e.g., "Radius 2m", "Radius 4m")
 */
function parseAoERadius(aoeStr) {
    if (!aoeStr)
        return undefined;
    const match = aoeStr.match(/radius\s*(\d+(?:\.\d+)?)\s*m/i);
    if (match) {
        return parseFloat(match[1]);
    }
    return undefined;
}
/**
 * Parse AoE shape from string
 */
function parseAoEShape(aoeStr) {
    if (!aoeStr)
        return 'none';
    const lower = aoeStr.toLowerCase();
    if (lower.includes('radius')) {
        return 'radius';
    }
    if (lower.includes('cone')) {
        return 'cone';
    }
    if (lower.includes('line')) {
        return 'line';
    }
    return 'none';
}
/**
 * Determine default target group from power description and type
 */
function determineTargetGroup(option) {
    // Check if explicitly set
    if (option.defaultTargetGroup) {
        return option.defaultTargetGroup;
    }
    // Check description for keywords
    const desc = (option.description || '').toLowerCase();
    const name = (option.name || '').toLowerCase();
    // Check for "allies" keywords
    if (desc.includes('allies') || desc.includes('ally') ||
        name.includes('bless') || name.includes('beacon') || name.includes('healing')) {
        return 'ally';
    }
    // Check for "enemies" keywords
    if (desc.includes('enemies') || desc.includes('enemy') || desc.includes('hostile')) {
        return 'enemy';
    }
    // Check for "creatures" or "all creatures"
    if (desc.includes('creatures') || desc.includes('all creatures') ||
        name.includes('feather fall')) {
        return 'creature';
    }
    // Default for utilities: ally
    if (option.slot === 'utility') {
        return 'ally';
    }
    return 'any';
}
/**
 * Determine range category from power/option data
 * @param rangeStr - Range string (e.g., "0m", "8m", "Self", "Self + Radius 5m")
 * @param powerType - Power type (e.g., "active", "movement")
 * @param levelData - Level data from power definition (optional)
 * @returns Range category
 */
function determineRangeCategory(rangeStr, powerType, levelData) {
    if (!rangeStr) {
        // Default based on power type
        if (powerType === 'movement') {
            return 'self';
        }
        return 'melee'; // Default for attacks
    }
    const rangeLower = rangeStr.toLowerCase();
    // Check for self-centered AoE
    if (rangeLower.includes('self') && (rangeLower.includes('radius') || rangeLower.includes('area'))) {
        return 'area';
    }
    // Check for "Self" or "0m" - melee
    if (rangeLower === 'self' || rangeLower === '0m' || rangeStr === '0') {
        return 'melee';
    }
    // Check level data type if available
    if (levelData && levelData.type) {
        const typeLower = levelData.type.toLowerCase();
        if (typeLower === 'melee') {
            return 'melee';
        }
        if (typeLower === 'ranged') {
            return 'ranged';
        }
    }
    // Parse numeric range
    const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (match) {
        const rangeMeters = parseFloat(match[1]);
        if (rangeMeters === 0) {
            return 'melee';
        }
        // For now, assume anything with range > 0 is ranged
        // TODO: Could check if it's actually a ranged attack vs melee with reach
        return 'ranged';
    }
    // Default fallback
    return 'melee';
}
/**
 * Map an option to one of the 4 inner segment IDs
 * This determines which inner quadrant (Buff/Move/Util/Atk) an option belongs to
 */
export function getSegmentIdForOption(option) {
    // Active Buff powers get their own segment
    // Check if it's a power with buff/active-buff type that requires an action
    if (option.source === 'power' && option.item) {
        const powerType = option.powerType || option.item.system?.powerType;
        const cost = option.item.system?.cost;
        // If it's explicitly an active-buff or buff power that requires an action, it's an active buff
        if ((powerType === 'active-buff' || powerType === 'buff') && cost?.action === true) {
            return 'active-buff';
        }
        // Check tags for active-buff indicators
        const tags = option.tags || [];
        if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
            if (cost?.action === true) {
                return 'active-buff';
            }
        }
        // Also check if power type is 'active' but has buff-like characteristics
        if (powerType === 'active' && option.slot === 'attack') {
            // Check if description or name suggests it's a buff
            const nameLower = option.name.toLowerCase();
            const descLower = (option.description || '').toLowerCase();
            if (nameLower.includes('buff') || descLower.includes('buff') ||
                nameLower.includes('stance') || descLower.includes('stance')) {
                return 'active-buff';
            }
        }
    }
    // Map by slot
    switch (option.slot) {
        case 'movement':
            return 'movement';
        case 'attack':
            return 'attack';
        case 'utility':
            return 'utility';
        case 'reaction':
            // Reactions go to utility segment
            return 'utility';
        default:
            // Default to attack for offensive actions
            return 'attack';
    }
}
/**
 * Get all combat options for an actor (all categories)
 * Collects all Powers and Maneuvers available to the actor
 */
export async function getAllCombatOptionsForActor(actor) {
    const options = [];
    if (!actor) {
        console.warn('Mastery System | getAllCombatOptionsForActor: No actor provided');
        return options;
    }
    // Pre-load power definitions for range lookup
    let getPowerFn = null;
    try {
        // Foundry resolves dynamic imports relative to the current file location
        // From dist/radial-menu/options.js to dist/utils/powers/index.js
        const powerModule = await import('../utils/powers/index.js');
        getPowerFn = powerModule.getPower;
    }
    catch (error) {
        console.warn('Mastery System | Could not load power definitions module:', error);
    }
    // --- POWERS (from Actor items) ---
    const items = actor.items || [];
    for (const item of items) {
        // Powers are stored as items with type "special"
        if (item.type !== 'special')
            continue;
        const powerType = item.system?.powerType;
        if (!powerType)
            continue;
        // Only include combat-usable powers
        // Include: movement, active, active-buff, buff, utility, reaction
        // Exclude: passive (these are not combat actions)
        if (!['movement', 'active', 'active-buff', 'buff', 'utility', 'reaction'].includes(powerType)) {
            continue;
        }
        // Map power type to slot
        const slot = mapPowerTypeToSlot(powerType);
        // Parse range from system.range (e.g., "8m", "12m", "Self")
        let rangeStr = item.system?.range;
        let range = parseRange(rangeStr);
        let levelData = undefined;
        // If range is missing or empty, try to get it from the power definition
        // This handles cases where the level was changed but range wasn't updated
        if ((!rangeStr || !range) && getPowerFn) {
            const treeName = item.system?.tree;
            const powerName = item.name;
            const level = item.system?.level || 1;
            if (treeName && powerName) {
                try {
                    const powerDef = getPowerFn(treeName, powerName);
                    if (powerDef && powerDef.levels) {
                        levelData = powerDef.levels.find((l) => l.level === level);
                        if (levelData && levelData.range) {
                            rangeStr = levelData.range;
                            range = parseRange(rangeStr);
                        }
                    }
                }
                catch (error) {
                    // If lookup fails, just use the existing range (or undefined)
                    console.warn('Mastery System | Could not lookup power definition for range:', error);
                }
            }
        }
        // Determine range category
        const rangeCategory = determineRangeCategory(rangeStr, powerType, levelData);
        // Parse AoE information for utilities
        let aoeShape = 'none';
        let aoeRadiusMeters = undefined;
        let rangeMeters = range;
        if (slot === 'utility' || powerType === 'utility') {
            // Get AoE from system or level data
            let aoeStr = item.system?.aoe;
            if (!aoeStr && levelData && levelData.aoe) {
                aoeStr = levelData.aoe;
            }
            aoeShape = parseAoEShape(aoeStr);
            aoeRadiusMeters = parseAoERadius(aoeStr);
            // For utilities, rangeMeters is the max distance to center
            rangeMeters = range;
            // If range is "Self" or 0 and has AoE, it's a self-aura
            if ((!rangeStr || rangeStr.toLowerCase() === 'self' || range === 0) && aoeShape !== 'none') {
                rangeMeters = 0; // Self-aura
            }
        }
        // Get tags if available
        const tags = item.system?.tags || [];
        const option = {
            id: item.id,
            name: item.name,
            description: item.system?.description || item.system?.effect || '',
            slot: slot,
            source: 'power',
            range: range,
            rangeCategory: rangeCategory,
            item: item,
            powerType: powerType,
            tags: Array.isArray(tags) ? tags : []
        };
        // Add utility targeting fields if this is a utility
        if (slot === 'utility' || powerType === 'utility') {
            option.rangeMeters = rangeMeters;
            option.aoeShape = aoeShape;
            option.aoeRadiusMeters = aoeRadiusMeters;
            option.defaultTargetGroup = determineTargetGroup(option);
            option.allowManualTargetSelection = true; // Default true for utilities
        }
        options.push(option);
    }
    // --- MANEUVERS (generic combat maneuvers) ---
    // Get available maneuvers for this actor (filters by requirements)
    const availableManeuvers = getAvailableManeuvers(actor);
    // Get actor's speed for movement maneuvers
    const actorSpeed = actor.system?.combat?.speed || 6; // Default to 6m if not set
    for (const maneuver of availableManeuvers) {
        // Filter out Multiattacks from the radial menu
        if (maneuver.tags?.includes('multiattack') || maneuver.id?.includes('multiattack')) {
            continue; // Skip Multiattack maneuvers
        }
        // For attack slot: only allow Weapon Attack and the two main stances (Parry Stance and Dodge Stance)
        if (maneuver.slot === 'attack') {
            // Only allow Parry Stance and Dodge Stance
            if (maneuver.id !== 'parry-stance' && maneuver.id !== 'dodge-stance') {
                // Check if it's a "Weapon Attack" - this might be a special case or we need to add it
                // For now, skip all other attack maneuvers except the two stances
                continue;
            }
        }
        // Maneuvers have their slot defined in the maneuver data
        // For "move" maneuver, use the actor's speed as range
        let maneuverRange = undefined;
        if (maneuver.id === 'move') {
            maneuverRange = actorSpeed;
        }
        // Other movement maneuvers might also benefit from speed-based range
        else if (maneuver.slot === 'movement' && maneuver.tags?.includes('speed')) {
            // For maneuvers that mention speed (like Dash), calculate based on speed
            if (maneuver.id === 'dash') {
                maneuverRange = actorSpeed * 2;
            }
            else if (maneuver.id === 'flee-you-fools') {
                maneuverRange = actorSpeed * 3;
            }
        }
        // Determine range category for maneuvers
        let maneuverRangeCategory = 'melee'; // Default
        if (maneuver.id === 'move' || maneuver.slot === 'movement') {
            maneuverRangeCategory = 'self';
        }
        else if (maneuver.slot === 'attack') {
            // Weapon Attack and melee stances are melee
            maneuverRangeCategory = 'melee';
        }
        options.push({
            id: maneuver.id,
            name: maneuver.name,
            description: maneuver.description || (maneuver.effect || ''),
            slot: maneuver.slot,
            source: 'maneuver',
            range: maneuverRange,
            rangeCategory: maneuverRangeCategory,
            maneuver: maneuver,
            tags: maneuver.tags || []
        });
    }
    // Add "Weapon Attack" as a standard attack option if not already present
    // Check if we already have a weapon attack option
    const hasWeaponAttack = options.some(opt => opt.slot === 'attack' && (opt.id === 'weapon-attack' || opt.name.toLowerCase() === 'weapon attack'));
    if (!hasWeaponAttack) {
        // Add Weapon Attack as a standard maneuver option
        options.push({
            id: 'weapon-attack',
            name: 'Weapon Attack',
            description: 'Make a standard attack with your equipped weapon.',
            slot: 'attack',
            source: 'maneuver',
            range: undefined,
            rangeCategory: 'melee', // Weapon Attack is melee
            maneuver: {
                id: 'weapon-attack',
                name: 'Weapon Attack',
                description: 'Make a standard attack with your equipped weapon.',
                slot: 'attack',
                category: 'combat-action',
                tags: ['attack', 'weapon'],
                effect: 'Make a standard attack with your equipped weapon. Roll attack dice against the target\'s Evade.'
            },
            tags: ['attack', 'weapon']
        });
    }
    console.log(`Mastery System | Collected ${options.length} combat options for actor:`, {
        powers: options.filter(o => o.source === 'power').length,
        maneuvers: options.filter(o => o.source === 'maneuver').length,
        bySegment: {
            movement: options.filter(o => getSegmentIdForOption(o) === 'movement').length,
            attack: options.filter(o => getSegmentIdForOption(o) === 'attack').length,
            utility: options.filter(o => getSegmentIdForOption(o) === 'utility').length,
            'active-buff': options.filter(o => getSegmentIdForOption(o) === 'active-buff').length
        }
    });
    return options;
}
//# sourceMappingURL=options.js.map