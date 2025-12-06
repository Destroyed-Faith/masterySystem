/**
 * Conditions / Status Effects System for Mastery System
 * Handles applying, tracking, and removing conditions like Poisoned, Bleeding, Stunned, etc.
 */
/**
 * Apply a condition to an actor
 * Creates a condition item and attaches it to the actor
 *
 * @param target - The actor to apply condition to
 * @param conditionData - Condition configuration
 * @returns The created condition item
 */
export async function applyCondition(target, conditionData) {
    // Check if condition already exists
    const existingCondition = target.items.find((i) => i.type === 'condition' && i.name === conditionData.name);
    if (existingCondition) {
        // Stack or replace based on rules
        // For now, just update the value if higher
        if (existingCondition.system.value < conditionData.value) {
            await existingCondition.update({
                'system.value': conditionData.value,
                'system.duration.remaining': conditionData.duration.remaining
            });
            ui.notifications?.info(`${target.name}'s ${conditionData.name} increased to ${conditionData.value}!`);
            return existingCondition;
        }
        ui.notifications?.warn(`${target.name} already has ${conditionData.name}(${existingCondition.system.value})`);
        return existingCondition;
    }
    // Create new condition item
    const itemData = {
        name: conditionData.name,
        type: 'condition',
        system: {
            conditionType: conditionData.name.toLowerCase(),
            value: conditionData.value,
            diminishing: conditionData.diminishing,
            duration: conditionData.duration.type,
            durationRemaining: conditionData.duration.remaining || 0,
            effect: conditionData.effect,
            save: conditionData.save.type,
            saveTN: conditionData.save.tn,
            saveFrequency: conditionData.save.frequency
        }
    };
    const [condition] = await target.createEmbeddedDocuments('Item', [itemData]);
    // Post chat message
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: target }),
        content: `
      <div class="mastery-condition-applied">
        <div class="condition-header">
          <img src="${target.img}" alt="${target.name}" class="actor-portrait"/>
          <h3>${target.name} gains ${conditionData.name}(${conditionData.value})!</h3>
        </div>
        <div class="condition-details">
          <p><strong>Effect:</strong> ${conditionData.effect}</p>
          ${conditionData.duration.type === 'rounds' ? `<p><strong>Duration:</strong> ${conditionData.duration.remaining} rounds</p>` : ''}
          ${conditionData.save.frequency !== 'none' ? `<p><strong>Save:</strong> ${conditionData.save.type.charAt(0).toUpperCase() + conditionData.save.type.slice(1)} TN ${conditionData.save.tn} ${conditionData.save.frequency}</p>` : ''}
        </div>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        flags: {
            'mastery-system': {
                type: 'condition-applied',
                condition: conditionData.name,
                value: conditionData.value
            }
        }
    });
    console.log(`Mastery System | Applied ${conditionData.name}(${conditionData.value}) to ${target.name}`);
    return condition;
}
/**
 * Remove a condition from an actor
 *
 * @param target - The actor
 * @param conditionName - Name of condition to remove
 */
export async function removeCondition(target, conditionName) {
    const condition = target.items.find((i) => i.type === 'condition' && i.name === conditionName);
    if (!condition) {
        console.warn(`Mastery System | ${target.name} doesn't have ${conditionName}`);
        return;
    }
    await condition.delete();
    // Post chat message
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: target }),
        content: `
      <div class="mastery-condition-removed">
        <h3>${target.name} recovers from ${conditionName}!</h3>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    console.log(`Mastery System | Removed ${conditionName} from ${target.name}`);
}
/**
 * Update conditions at start of round (decrement duration, apply effects, etc.)
 * Called by combat hooks
 *
 * @param actor - The actor whose conditions to update
 */
export async function updateConditionsForRound(actor) {
    const conditions = actor.items.filter((i) => i.type === 'condition');
    for (const condition of conditions) {
        const system = condition.system;
        // Decrement duration if applicable
        if (system.duration === 'rounds' && system.durationRemaining > 0) {
            const newRemaining = system.durationRemaining - 1;
            if (newRemaining <= 0) {
                // Duration expired, remove condition
                await removeCondition(actor, condition.name);
                continue;
            }
            await condition.update({ 'system.durationRemaining': newRemaining });
        }
        // Diminish value if applicable
        if (system.diminishing && system.value > 0) {
            const newValue = system.value - 1;
            if (newValue <= 0) {
                // Condition faded away
                await removeCondition(actor, condition.name);
                continue;
            }
            await condition.update({ 'system.value': newValue });
            ui.notifications?.info(`${actor.name}'s ${condition.name} diminished to ${newValue}`);
        }
        // TODO: Trigger saving throw if required (saveFrequency === 'eachRound')
        // TODO: Apply ongoing effects (e.g., Bleeding damage, Poisoned damage)
    }
}
/**
 * Get all active conditions on an actor
 *
 * @param actor - The actor
 * @returns Array of condition items
 */
export function getActiveConditions(actor) {
    return actor.items.filter((i) => i.type === 'condition');
}
/**
 * Check if actor has a specific condition
 *
 * @param actor - The actor
 * @param conditionName - Name of condition
 * @returns True if actor has the condition
 */
export function hasCondition(actor, conditionName) {
    return actor.items.some((i) => i.type === 'condition' && i.name === conditionName);
}
/**
 * Calculate save TN based on attacker's Mastery Rank
 * Formula: 12 * Mastery Rank
 * M1 = 12, M2 = 24, M3 = 36, M4 = 48, etc.
 *
 * @param masteryRank - Attacker's Mastery Rank
 * @returns Save TN
 */
export function calculateSaveTN(masteryRank) {
    return 12 * masteryRank;
}
//# sourceMappingURL=conditions.js.map