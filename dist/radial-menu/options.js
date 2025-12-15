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
 * Builds movement segment with proper ordering: core maneuvers first, then powers, then other maneuvers
 */
export async function getAllCombatOptionsForActor(actor) {
    const options = [];
    if (!actor) {
        console.warn('Mastery System | getAllCombatOptionsForActor: No actor provided');
        return options;
    }
    // Import isActorProne helper
    let isActorProne = null;
    try {
        const actorHelpers = await import('../utils/actor-helpers.js');
        isActorProne = actorHelpers.isActorProne;
    }
    catch (error) {
        console.warn('Mastery System | Could not load actor helpers:', error);
    }
    // Get token for prone check
    const token = canvas.tokens?.placeables?.find((t) => t.actor?.id === actor.id);
    const isProne = isActorProne ? isActorProne(actor, token) : false;
    // Pre-load power definitions for range lookup
    let getPowerFn = null;
    try {
        const powerModule = await import('../utils/powers/index.js');
        getPowerFn = powerModule.getPower;
    }
    catch (error) {
        console.warn('Mastery System | Could not load power definitions module:', error);
    }
    // Get actor's speed for movement maneuvers
    const actorSpeed = actor.system?.combat?.speed || 6; // Default to 6m if not set
    // --- COLLECT ALL OPTIONS (separate by source) ---
    const movementPowers = [];
    const allManeuvers = [];
    const nonMovementOptions = [];
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
            let aoeStr = item.system?.aoe;
            if (!aoeStr && levelData && levelData.aoe) {
                aoeStr = levelData.aoe;
            }
            aoeShape = parseAoEShape(aoeStr);
            aoeRadiusMeters = parseAoERadius(aoeStr);
            rangeMeters = range;
            if ((!rangeStr || rangeStr.toLowerCase() === 'self' || range === 0) && aoeShape !== 'none') {
                rangeMeters = 0;
            }
        }
        // Get tags and cost information
        const tags = item.system?.tags || [];
        const cost = item.system?.cost || {};
        // Determine costs
        const costsMovement = powerType === 'movement' && cost.movement !== false; // Movement powers cost movement by default
        const costsAction = cost.action === true || cost.actions === true;
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
            tags: Array.isArray(tags) ? tags : [],
            costsMovement: costsMovement,
            costsAction: costsAction
        };
        // Add utility targeting fields if this is a utility
        if (slot === 'utility' || powerType === 'utility') {
            option.rangeMeters = rangeMeters;
            option.aoeShape = aoeShape;
            option.aoeRadiusMeters = aoeRadiusMeters;
            option.defaultTargetGroup = determineTargetGroup(option);
            option.allowManualTargetSelection = true;
        }
        // Separate movement powers from others
        if (slot === 'movement' || powerType === 'movement') {
            movementPowers.push(option);
        }
        else {
            nonMovementOptions.push(option);
        }
    }
    // --- MANEUVERS (generic combat maneuvers) ---
    const availableManeuvers = getAvailableManeuvers(actor);
    // Core movement maneuver IDs (must appear first in movement segment)
    const CORE_MOVEMENT_MANEUVER_IDS = ['move', 'dash', 'disengage', 'stand-up'];
    for (const maneuver of availableManeuvers) {
        // Filter out Multiattacks
        if (maneuver.tags?.includes('multiattack') || maneuver.id?.includes('multiattack')) {
            continue;
        }
        // Filter out specific movement maneuvers that should not appear in radial menu
        if (maneuver.id === 'charge' || maneuver.id === 'flee-you-fools' || maneuver.id === 'tactical-retreat') {
            continue;
        }
        // For attack slot: only allow Weapon Attack and the two main stances
        if (maneuver.slot === 'attack') {
            if (maneuver.id !== 'parry-stance' && maneuver.id !== 'dodge-stance') {
                continue;
            }
        }
        // Calculate maneuver range
        let maneuverRange = undefined;
        if (maneuver.id === 'move') {
            maneuverRange = actorSpeed;
        }
        else if (maneuver.slot === 'movement' && maneuver.tags?.includes('speed')) {
            if (maneuver.id === 'dash') {
                maneuverRange = actorSpeed * 2;
            }
            else if (maneuver.id === 'flee-you-fools') {
                maneuverRange = actorSpeed * 3;
            }
        }
        // Determine range category
        let maneuverRangeCategory = 'melee';
        if (maneuver.id === 'move' || maneuver.slot === 'movement') {
            maneuverRangeCategory = 'self';
        }
        else if (maneuver.slot === 'attack') {
            maneuverRangeCategory = 'melee';
        }
        // Determine costs
        const costsMovement = maneuver.slot === 'movement' && maneuver.id !== 'stand-up';
        const costsAction = maneuver.id === 'stand-up' || maneuver.slot === 'attack';
        // Filter stand-up: only show if prone
        if (maneuver.id === 'stand-up' && !isProne) {
            continue;
        }
        const maneuverOption = {
            id: maneuver.id,
            name: maneuver.name,
            description: maneuver.description || (maneuver.effect || ''),
            slot: maneuver.slot,
            source: 'maneuver',
            range: maneuverRange,
            rangeCategory: maneuverRangeCategory,
            maneuver: maneuver,
            tags: maneuver.tags || [],
            costsMovement: costsMovement,
            costsAction: costsAction
        };
        allManeuvers.push(maneuverOption);
    }
    // Add "Weapon Attack" if not present
    const hasWeaponAttack = allManeuvers.some(opt => opt.slot === 'attack' && (opt.id === 'weapon-attack' || opt.name.toLowerCase() === 'weapon attack'));
    if (!hasWeaponAttack) {
        allManeuvers.push({
            id: 'weapon-attack',
            name: 'Weapon Attack',
            description: 'Make a standard attack with your equipped weapon.',
            slot: 'attack',
            source: 'maneuver',
            range: undefined,
            rangeCategory: 'melee',
            maneuver: {
                id: 'weapon-attack',
                name: 'Weapon Attack',
                description: 'Make a standard attack with your equipped weapon.',
                slot: 'attack',
                category: 'combat-action',
                tags: ['attack', 'weapon'],
                effect: 'Make a standard attack with your equipped weapon. Roll attack dice against the target\'s Evade.'
            },
            tags: ['attack', 'weapon'],
            costsAction: true
        });
    }
    // --- BUILD MOVEMENT SEGMENT WITH PROPER ORDERING ---
    const movementOptions = [];
    // 1. Core movement maneuvers (in order: move, dash, disengage, stand-up if prone)
    for (const coreId of CORE_MOVEMENT_MANEUVER_IDS) {
        const coreManeuver = allManeuvers.find(m => m.id === coreId && m.slot === 'movement');
        if (coreManeuver) {
            movementOptions.push(coreManeuver);
        }
    }
    // 2. Movement powers (sorted by name or actor sheet order)
    const sortedMovementPowers = [...movementPowers].sort((a, b) => {
        // Try to preserve actor sheet order if available (by item sort)
        const aSort = a.item?.sort || 0;
        const bSort = b.item?.sort || 0;
        if (aSort !== bSort)
            return aSort - bSort;
        // Otherwise sort by name
        return a.name.localeCompare(b.name);
    });
    movementOptions.push(...sortedMovementPowers);
    // 3. Other movement maneuvers (excluding core ones)
    const otherMovementManeuvers = allManeuvers.filter(m => m.slot === 'movement' && !CORE_MOVEMENT_MANEUVER_IDS.includes(m.id));
    movementOptions.push(...otherMovementManeuvers);
    // Add all movement options to main options array
    options.push(...movementOptions);
    // Add all non-movement options
    options.push(...nonMovementOptions);
    // Add non-movement maneuvers
    const nonMovementManeuvers = allManeuvers.filter(m => m.slot !== 'movement');
    options.push(...nonMovementManeuvers);
    // Logging
    console.log(`Mastery System | Collected movement powers: ${movementPowers.length}`);
    console.log(`Mastery System | Movement segment final options: [${movementOptions.map(o => o.id).join(', ')}]`);
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