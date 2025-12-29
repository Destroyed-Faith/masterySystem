/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */
/**
 * Check if a power is an active buff
 */
export function isActiveBuff(power) {
    if (!power || power.type !== 'power')
        return false;
    const powerType = power.system?.powerType;
    const cost = power.system?.cost;
    const range = power.system?.range;
    // Check if it's explicitly an active-buff or buff power that requires an action
    if ((powerType === 'active-buff' || powerType === 'buff') && cost?.action === true) {
        return true;
    }
    // Check tags for active-buff indicators
    const tags = power.system?.tags || [];
    if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
        if (cost?.action === true) {
            return true;
        }
    }
    // Check if power type is 'active' but has buff-like characteristics
    if (powerType === 'active' && cost?.action === true) {
        const nameLower = power.name?.toLowerCase() || '';
        const descLower = (power.system?.description || '').toLowerCase();
        if (nameLower.includes('buff') || descLower.includes('buff') ||
            nameLower.includes('stance') || descLower.includes('stance')) {
            return true;
        }
    }
    // Check if it's a utility that is Self-targeting (these are also active buffs)
    if (powerType === 'utility' && cost?.action === true) {
        const rangeStr = range?.toString().toLowerCase() || '';
        // If range is "Self" or 0, it's a self-buff utility
        if (rangeStr === 'self' || rangeStr === '0' || range === 0) {
            return true;
        }
        // Also check if it has buff-like tags or characteristics
        if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
            return true;
        }
        // Check name/description for buff indicators
        const nameLower = power.name?.toLowerCase() || '';
        const descLower = (power.system?.description || '').toLowerCase();
        if (nameLower.includes('buff') || descLower.includes('buff') ||
            nameLower.includes('stance') || descLower.includes('stance')) {
            return true;
        }
    }
    return false;
}
/**
 * Get mastery rank from actor
 */
function getMasteryRank(actor) {
    return actor.system?.mastery?.rank || 2;
}
/**
 * Get current combat round
 */
function getCurrentRound() {
    return game.combat?.round || 1;
}
/**
 * Activate an active buff power
 * Creates an ActiveEffect that lasts for Mastery Rank rounds
 */
export async function activateActiveBuff(actor, power) {
    if (!isActiveBuff(power)) {
        console.warn('Mastery System | activateActiveBuff called with non-buff power', power.name);
        return false;
    }
    const masteryRank = getMasteryRank(actor);
    const currentRound = getCurrentRound();
    // Calculate duration in rounds
    // Duration is "Mastery Rank rounds"
    // Foundry's ActiveEffect duration uses rounds/turns/seconds
    const duration = {
        startRound: currentRound,
        startTurn: game.combat?.turn || 0,
        rounds: masteryRank,
        turns: 0,
        seconds: null,
        combat: game.combat?.id || null
    };
    // Create ActiveEffect data - simplified structure for Foundry VTT
    const effectData = {
        name: power.name,
        icon: power.img || power.system?.img || 'icons/svg/aura.svg',
        // Store original power data in flags
        flags: {
            'mastery-system': {
                activeBuff: true,
                powerId: power.id,
                powerName: power.name,
                masteryRank: masteryRank,
                activatedRound: currentRound
            }
        },
        // Add description directly (not in system.description.value)
        description: power.system?.description || power.system?.effect || ''
    };
    // Add duration if in combat
    if (game.combat) {
        effectData.duration = duration;
    }
    else {
        // If not in combat, set a long duration so it doesn't expire immediately
        effectData.duration = {
            startRound: null,
            startTurn: null,
            rounds: masteryRank,
            turns: null,
            seconds: null,
            combat: null
        };
    }
    try {
        console.log('Mastery System | Creating ActiveEffect:', effectData);
        // Create the effect on the actor
        const created = await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        console.log('Mastery System | ActiveEffect created:', created);
        ui.notifications?.info(`Activated ${power.name} (Duration: ${masteryRank} rounds)`);
        return true;
    }
    catch (error) {
        console.error('Mastery System | Failed to activate active buff', error);
        ui.notifications?.error(`Failed to activate ${power.name}`);
        return false;
    }
}
/**
 * Get all active buffs on an actor
 */
export function getActiveBuffs(actor) {
    const effects = actor.effects;
    if (!effects)
        return [];
    return effects.filter((effect) => {
        const flags = effect.flags?.['mastery-system'];
        return flags?.activeBuff === true;
    });
}
/**
 * Check if a specific power is currently active as a buff
 */
export function isPowerActiveAsBuff(actor, powerId) {
    const activeBuffs = getActiveBuffs(actor);
    return activeBuffs.some((effect) => {
        const flags = effect.flags?.['mastery-system'];
        return flags?.powerId === powerId;
    });
}
//# sourceMappingURL=active-buffs.js.map