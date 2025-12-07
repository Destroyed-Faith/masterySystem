/**
 * Power utilities for the Mastery System
 */
/**
 * Get all available powers for an actor
 */
export function getAvailablePowers(actor) {
    const items = actor.items || [];
    return items.filter((item) => item.type === 'power' ||
        item.type === 'spell' ||
        item.type === 'special');
}
/**
 * Check if a power can be used
 */
export function canUsePower(actor, power) {
    const system = actor.system;
    // Check action economy
    if (power.system?.cost?.actions) {
        const availableActions = system.resources?.actions?.value || 0;
        if (availableActions < power.system.cost.actions) {
            return false;
        }
    }
    // Check stone cost
    if (power.system?.cost?.stones) {
        const availableStones = system.stones?.current || 0;
        if (availableStones < power.system.cost.stones) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=powers.js.map