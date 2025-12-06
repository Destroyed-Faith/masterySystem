/**
 * Utilities Duration & Limit System for Mastery System
 *
 * Rules from rulebook (Lines 4705-4733):
 *
 * Utilities:
 * - Cost: 1 Attack Action
 * - Roll: Usually none, effect applies automatically
 * - Duration: Instant to 2-n rounds, then may be reactivated
 * - LIMIT: You cannot have the same Utility effect active twice
 *
 * This enforces the "same utility cannot be active twice" rule
 */
/**
 * Get active utilities for an actor
 */
export function getActiveUtilities(actor) {
    return actor.system.activeUtilities || [];
}
/**
 * Check if a utility is already active
 */
export function isUtilityActive(actor, utilityItemId) {
    const activeUtilities = getActiveUtilities(actor);
    return activeUtilities.some((util) => util.utilityItemId === utilityItemId);
}
/**
 * Activate a utility
 * Enforces the "cannot have same utility active twice" rule
 *
 * @param actor - The actor using the utility
 * @param utilityItem - The utility item
 * @param targetActor - Optional target actor
 * @returns Success status
 */
export async function activateUtility(actor, utilityItem, targetActor) {
    // Verify it's a utility
    if (utilityItem.type !== 'utility') {
        ui.notifications?.error(`${utilityItem.name} is not a Utility!`);
        return false;
    }
    // Check if already active
    if (isUtilityActive(actor, utilityItem.id)) {
        ui.notifications?.error(`${utilityItem.name} is already active! You cannot have the same Utility active twice.`);
        return false;
    }
    // Check if actor has action available
    const attackActions = actor.system.actions?.attack;
    if (!attackActions || attackActions.used >= attackActions.max) {
        ui.notifications?.error(`${actor.name} has no Attack Actions left!`);
        return false;
    }
    // Get utility details
    const system = utilityItem.system;
    const stoneCost = system.stoneCost || 0;
    const duration = system.duration || 0; // 0 = instant
    // Check stone cost
    const currentStones = actor.system.resources?.stones?.current || 0;
    if (stoneCost > 0 && currentStones < stoneCost) {
        ui.notifications?.error(`${actor.name} needs ${stoneCost} Stones to use ${utilityItem.name}!`);
        return false;
    }
    // Get current combat round
    const combat = game.combat;
    const currentRound = combat?.round || 1;
    // Create active utility entry
    const newUtility = {
        id: `utility-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        utilityItemId: utilityItem.id,
        utilityName: utilityItem.name,
        startRound: currentRound,
        duration: duration,
        endsOnRound: currentRound + duration,
        targetId: targetActor?.id
    };
    // Add to active utilities
    const activeUtilities = getActiveUtilities(actor);
    activeUtilities.push(newUtility);
    // Update actor
    await actor.update({
        'system.activeUtilities': activeUtilities,
        'system.actions.attack.used': attackActions.used + 1
    });
    // Spend stones if needed
    if (stoneCost > 0) {
        await actor.update({
            'system.resources.stones.current': currentStones - stoneCost
        });
    }
    // Create chat message
    let chatContent = `
    <div class="mastery-utility">
      <h3>Utility: ${utilityItem.name}</h3>
      <p><strong>${actor.name}</strong> uses 1 Attack Action</p>
      ${stoneCost > 0 ? `<p><em>Stone Cost: ${stoneCost}</em></p>` : ''}
      <p><strong>Duration:</strong> ${duration === 0 ? 'Instant' : `${duration} round${duration > 1 ? 's' : ''}`}</p>
      ${targetActor ? `<p><strong>Target:</strong> ${targetActor.name}</p>` : ''}
      <p><strong>Effect:</strong> ${system.description || 'Utility effect applied'}</p>
    </div>
  `;
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    console.log(`Mastery System | ${actor.name} activated Utility: ${utilityItem.name} (expires round ${newUtility.endsOnRound})`);
    return true;
}
/**
 * Decrement utility durations at the start of each round
 * Removes expired utilities
 */
export async function decrementUtilityDurations(actor) {
    const combat = game.combat;
    if (!combat)
        return;
    const currentRound = combat.round;
    const activeUtilities = getActiveUtilities(actor);
    // Filter out expired utilities
    const stillActive = activeUtilities.filter((util) => {
        // Instant utilities (duration 0) expire immediately after activation
        if (util.duration === 0) {
            return false;
        }
        // Check if expired
        if (currentRound > util.endsOnRound) {
            console.log(`Mastery System | ${util.utilityName} expired for ${actor.name}`);
            ChatMessage.create({
                user: game.user?.id,
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `
          <div class="mastery-utility-expired">
            <p><strong>${util.utilityName}</strong> has expired.</p>
          </div>
        `,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
            return false;
        }
        return true;
    });
    // Update actor if any utilities expired
    if (stillActive.length !== activeUtilities.length) {
        await actor.update({
            'system.activeUtilities': stillActive
        });
        ui.notifications?.info(`Some utilities expired for ${actor.name}`);
    }
}
/**
 * Remove a specific utility (for manual cancellation)
 */
export async function removeUtility(actor, utilityId) {
    const activeUtilities = getActiveUtilities(actor);
    const filtered = activeUtilities.filter((util) => util.id !== utilityId);
    await actor.update({
        'system.activeUtilities': filtered
    });
    console.log(`Mastery System | Utility removed for ${actor.name}`);
}
/**
 * Get utility status summary
 */
export function getUtilityStatusSummary(actor) {
    const activeUtilities = getActiveUtilities(actor);
    const combat = game.combat;
    const currentRound = combat?.round || 1;
    return activeUtilities.map((util) => {
        const remainingRounds = Math.max(0, util.endsOnRound - currentRound);
        return `${util.utilityName} (${remainingRounds} round${remainingRounds !== 1 ? 's' : ''} left)`;
    });
}
//# sourceMappingURL=utilities.js.map