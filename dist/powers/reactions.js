/**
 * Reaction Trigger System for Mastery System
 *
 * Rules:
 * - Reactions triggered by specific events (e.g., "when attacked", "when ally damaged")
 * - Cost 1 Reaction per round
 * - Resolve immediately after trigger event
 * - Usually a contest or check vs triggering effect
 */
/**
 * Reaction trigger types
 */
export var ReactionTrigger;
(function (ReactionTrigger) {
    ReactionTrigger["WHEN_ATTACKED"] = "whenAttacked";
    ReactionTrigger["WHEN_HIT"] = "whenHit";
    ReactionTrigger["WHEN_MISSED"] = "whenMissed";
    ReactionTrigger["WHEN_DAMAGED"] = "whenDamaged";
    ReactionTrigger["WHEN_ALLY_ATTACKED"] = "whenAllyAttacked";
    ReactionTrigger["WHEN_ALLY_DAMAGED"] = "whenAllyDamaged";
    ReactionTrigger["WHEN_ALLY_FAILS_SAVE"] = "whenAllyFailsSave";
    ReactionTrigger["WHEN_ENEMY_MOVES"] = "whenEnemyMoves";
    ReactionTrigger["WHEN_ENEMY_ENTERS_RANGE"] = "whenEnemyEntersRange";
    ReactionTrigger["WHEN_ENEMY_LEAVES_RANGE"] = "whenEnemyLeavesRange";
    ReactionTrigger["WHEN_SPELL_CAST"] = "whenSpellCast";
    ReactionTrigger["START_OF_TURN"] = "startOfTurn";
    ReactionTrigger["END_OF_TURN"] = "endOfTurn"; // At end of your turn
})(ReactionTrigger || (ReactionTrigger = {}));
/**
 * Get all available reactions for an actor
 */
export function getAvailableReactions(actor) {
    const reactions = [];
    // Find all items with reaction powers
    for (const item of actor.items) {
        if (item.type === 'special' && item.system.powerType === 'reaction') {
            const trigger = item.system.reactionTrigger || ReactionTrigger.WHEN_ATTACKED;
            const range = parseInt(item.system.range) || 0;
            reactions.push({
                id: item.id,
                name: item.name,
                trigger,
                range,
                description: item.system.description || '',
                rollType: item.system.reactionRollType || 'contested',
                attribute: item.system.roll?.attribute || 'might',
                tn: item.system.roll?.tn,
                effect: item.system.effect || '',
                sourceItem: item.id
            });
        }
    }
    return reactions;
}
/**
 * Check if actor has reactions available
 */
export function hasReactionAvailable(actor) {
    const reactions = actor.system.actions?.reaction || { max: 1, used: 0 };
    return reactions.used < reactions.max;
}
/**
 * Find reactions that match a trigger event
 */
export function findMatchingReactions(actor, event) {
    if (!hasReactionAvailable(actor)) {
        return [];
    }
    const availableReactions = getAvailableReactions(actor);
    return availableReactions.filter(reaction => {
        // Check trigger type matches
        if (reaction.trigger !== event.type) {
            return false;
        }
        // Check range if source is specified
        if (event.source && reaction.range > 0) {
            const distance = calculateDistance(actor, event.source);
            if (distance > reaction.range) {
                return false;
            }
        }
        return true;
    });
}
/**
 * Calculate distance between two actors (placeholder)
 * TODO: Implement proper grid distance calculation
 */
function calculateDistance(_actor1, _actor2) {
    // For now, return 0 (same space) - needs proper implementation with tokens
    return 0;
}
/**
 * Trigger reactions for an event
 * Shows dialog to player if multiple reactions available
 */
export async function triggerReactions(event) {
    const matchingReactions = findMatchingReactions(event.actor, event);
    if (matchingReactions.length === 0) {
        return;
    }
    // If only one reaction, ask if they want to use it
    if (matchingReactions.length === 1) {
        await promptUseReaction(event.actor, matchingReactions[0], event);
        return;
    }
    // Multiple reactions available - show selection dialog
    await promptSelectReaction(event.actor, matchingReactions, event);
}
/**
 * Prompt player to use a specific reaction
 */
async function promptUseReaction(actor, reaction, event) {
    return new Promise((resolve) => {
        const dialog = new Dialog({
            title: `Use Reaction: ${reaction.name}?`,
            content: `
        <div class="mastery-reaction-prompt">
          <p><strong>Trigger:</strong> ${getTriggerDescription(reaction.trigger)}</p>
          <p><strong>Effect:</strong> ${reaction.effect}</p>
          ${event.source ? `<p><strong>Target:</strong> ${event.source.name}</p>` : ''}
          <p class="warning">This will consume your Reaction for this round.</p>
        </div>
      `,
            buttons: {
                use: {
                    icon: '<i class="fas fa-bolt"></i>',
                    label: 'Use Reaction',
                    callback: async () => {
                        await executeReaction(actor, reaction, event);
                        resolve();
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Don\'t Use',
                    callback: () => resolve()
                }
            },
            default: 'use',
            close: () => resolve()
        }, {
            width: 400,
            classes: ['mastery-system', 'reaction-prompt']
        });
        dialog.render(true);
    });
}
/**
 * Prompt player to select from multiple reactions
 */
async function promptSelectReaction(actor, reactions, event) {
    return new Promise((resolve) => {
        const reactionList = reactions.map((r, idx) => `
      <div class="reaction-option" data-index="${idx}">
        <h4>${r.name}</h4>
        <p>${r.effect}</p>
      </div>
    `).join('');
        const dialog = new Dialog({
            title: 'Choose Reaction',
            content: `
        <div class="mastery-reaction-select">
          <p><strong>Trigger:</strong> ${getTriggerDescription(event.type)}</p>
          <div class="reaction-list">${reactionList}</div>
          <p class="warning">Choose which reaction to use (costs 1 Reaction).</p>
        </div>
      `,
            buttons: {
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Don\'t Use Any',
                    callback: () => resolve()
                }
            },
            render: (html) => {
                html.find('.reaction-option').on('click', async (e) => {
                    const index = parseInt(e.currentTarget.dataset.index || '0');
                    const reaction = reactions[index];
                    await executeReaction(actor, reaction, event);
                    dialog.close();
                    resolve();
                });
            },
            close: () => resolve()
        }, {
            width: 500,
            classes: ['mastery-system', 'reaction-select']
        });
        dialog.render(true);
    });
}
/**
 * Execute a reaction
 */
async function executeReaction(actor, reaction, event) {
    // Use the reaction (consume it)
    const { useAction } = await import('../combat/actions.js');
    await useAction(actor, 'reaction', 1);
    // Post chat message
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-reaction-used">
        <h3>${actor.name} uses ${reaction.name}!</h3>
        <p><strong>Trigger:</strong> ${getTriggerDescription(reaction.trigger)}</p>
        ${event.source ? `<p><strong>Target:</strong> ${event.source.name}</p>` : ''}
        <p>${reaction.effect}</p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    console.log(`Mastery System | ${actor.name} used reaction: ${reaction.name}`);
    // TODO: Execute actual mechanical effect based on reaction type
    ui.notifications?.info(`${reaction.name} activated! (Mechanical effects to be implemented)`);
}
/**
 * Get human-readable trigger description
 */
function getTriggerDescription(trigger) {
    const descriptions = {
        [ReactionTrigger.WHEN_ATTACKED]: 'When you are attacked',
        [ReactionTrigger.WHEN_HIT]: 'When an attack hits you',
        [ReactionTrigger.WHEN_MISSED]: 'When an attack misses you',
        [ReactionTrigger.WHEN_DAMAGED]: 'When you take damage',
        [ReactionTrigger.WHEN_ALLY_ATTACKED]: 'When an ally is attacked',
        [ReactionTrigger.WHEN_ALLY_DAMAGED]: 'When an ally is damaged',
        [ReactionTrigger.WHEN_ALLY_FAILS_SAVE]: 'When an ally fails a save',
        [ReactionTrigger.WHEN_ENEMY_MOVES]: 'When an enemy moves near you',
        [ReactionTrigger.WHEN_ENEMY_ENTERS_RANGE]: 'When an enemy enters your reach',
        [ReactionTrigger.WHEN_ENEMY_LEAVES_RANGE]: 'When an enemy leaves your reach',
        [ReactionTrigger.WHEN_SPELL_CAST]: 'When a spell is cast',
        [ReactionTrigger.START_OF_TURN]: 'At the start of your turn',
        [ReactionTrigger.END_OF_TURN]: 'At the end of your turn'
    };
    return descriptions[trigger] || 'Unknown trigger';
}
/**
 * Helper to trigger "when attacked" reactions
 * Call this from attack workflow before rolling
 */
export async function triggerWhenAttackedReactions(target, attacker) {
    await triggerReactions({
        type: ReactionTrigger.WHEN_ATTACKED,
        actor: target,
        source: attacker
    });
}
/**
 * Helper to trigger "when hit" reactions
 * Call this from attack workflow after hit is confirmed
 */
export async function triggerWhenHitReactions(target, attacker, attackResult) {
    await triggerReactions({
        type: ReactionTrigger.WHEN_HIT,
        actor: target,
        source: attacker,
        data: attackResult
    });
}
/**
 * Helper to trigger "when damaged" reactions
 * Call this from damage application
 */
export async function triggerWhenDamagedReactions(target, attacker, damage) {
    await triggerReactions({
        type: ReactionTrigger.WHEN_DAMAGED,
        actor: target,
        source: attacker,
        data: { damage }
    });
}
//# sourceMappingURL=reactions.js.map