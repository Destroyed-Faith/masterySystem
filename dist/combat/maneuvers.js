/**
 * Movement Maneuvers System for Mastery System
 *
 * Rules:
 * - Movement maneuvers use your entire Movement action
 * - Cannot be split with regular movement
 * - Each provides unique tactical benefits
 * - Dash, Disengage, Charge, Leap, etc.
 */
/**
 * Movement maneuver types
 */
export var MovementManeuver;
(function (MovementManeuver) {
    MovementManeuver["DASH"] = "dash";
    MovementManeuver["DISENGAGE"] = "disengage";
    MovementManeuver["CHARGE"] = "charge";
    MovementManeuver["LEAP"] = "leap";
    MovementManeuver["TELEPORT"] = "teleport";
    MovementManeuver["CLIMB"] = "climb";
    MovementManeuver["SWIM"] = "swim";
    MovementManeuver["FLY"] = "fly";
})(MovementManeuver || (MovementManeuver = {}));
/**
 * Get all available maneuvers (basic ones always available)
 */
export function getAvailableManeuvers(actor) {
    const maneuvers = [
        {
            type: MovementManeuver.DASH,
            name: 'Dash',
            description: 'Move at double speed',
            effect: 'Move up to 2× your Speed this turn',
            rollRequired: false
        },
        {
            type: MovementManeuver.DISENGAGE,
            name: 'Disengage',
            description: 'Move without provoking opportunity attacks',
            effect: 'Move normally, but enemies cannot make opportunity attacks against you',
            rollRequired: false
        },
        {
            type: MovementManeuver.CHARGE,
            name: 'Charge',
            description: 'Move and attack with bonus',
            effect: 'Move up to your Speed toward an enemy, then make one attack with +1d8 damage',
            rollRequired: false
        },
        {
            type: MovementManeuver.LEAP,
            name: 'Leap',
            description: 'Jump over obstacles',
            effect: 'Make an Athletics check to jump over obstacles or gaps',
            rollRequired: true,
            tn: 12,
            attribute: 'might'
        },
        {
            type: MovementManeuver.CLIMB,
            name: 'Climb',
            description: 'Climb vertical surfaces',
            effect: 'Move at half speed while climbing. Athletics check for difficult surfaces.',
            rollRequired: false
        }
    ];
    // Check for special maneuvers from powers/items
    for (const item of actor.items) {
        if (item.type === 'special' && item.system.powerType === 'movement') {
            const maneuverType = item.system.movementType;
            if (maneuverType === 'teleport') {
                maneuvers.push({
                    type: MovementManeuver.TELEPORT,
                    name: item.name,
                    description: item.system.description || 'Teleport instantly',
                    effect: item.system.effect || 'Teleport to a location you can see',
                    rollRequired: false
                });
            }
            else if (maneuverType === 'fly') {
                maneuvers.push({
                    type: MovementManeuver.FLY,
                    name: item.name,
                    description: item.system.description || 'Fly through the air',
                    effect: item.system.effect || 'Gain flying movement',
                    rollRequired: false
                });
            }
        }
    }
    return maneuvers;
}
/**
 * Check if actor has a Movement action available
 */
export function hasMovementAvailable(actor) {
    const movement = actor.system.actions?.movement || { max: 1, used: 0 };
    return movement.used < movement.max;
}
/**
 * Perform a movement maneuver
 */
export async function performManeuver(actor, maneuverType, target) {
    if (!hasMovementAvailable(actor)) {
        ui.notifications?.error('No Movement action available!');
        return;
    }
    const maneuvers = getAvailableManeuvers(actor);
    const maneuver = maneuvers.find(m => m.type === maneuverType);
    if (!maneuver) {
        ui.notifications?.error(`Maneuver ${maneuverType} not available!`);
        return;
    }
    // Consume Movement action
    const { useAction } = await import('../combat/actions.js');
    await useAction(actor, 'movement', 1);
    // Handle specific maneuvers
    switch (maneuverType) {
        case MovementManeuver.DASH:
            await executeDash(actor);
            break;
        case MovementManeuver.DISENGAGE:
            await executeDisengage(actor);
            break;
        case MovementManeuver.CHARGE:
            await executeCharge(actor, target);
            break;
        case MovementManeuver.LEAP:
            await executeLeap(actor);
            break;
        case MovementManeuver.TELEPORT:
            await executeTeleport(actor);
            break;
        default:
            // Generic maneuver
            await executeGenericManeuver(actor, maneuver);
    }
}
/**
 * Execute Dash maneuver
 */
async function executeDash(actor) {
    const baseSpeed = actor.system.combat?.speed || 6;
    const dashSpeed = baseSpeed * 2;
    // Set flag for this turn
    await actor.setFlag('mastery-system', 'dashActive', true);
    await actor.setFlag('mastery-system', 'dashSpeed', dashSpeed);
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-maneuver">
        <h3>${actor.name} uses Dash!</h3>
        <p>Movement speed increased to <strong>${dashSpeed}m</strong> this turn.</p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info(`Dash: Speed increased to ${dashSpeed}m!`);
}
/**
 * Execute Disengage maneuver
 */
async function executeDisengage(actor) {
    // Set flag for this turn
    await actor.setFlag('mastery-system', 'disengageActive', true);
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-maneuver">
        <h3>${actor.name} uses Disengage!</h3>
        <p>Can move without provoking opportunity attacks this turn.</p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info('Disengage: No opportunity attacks this turn!');
}
/**
 * Execute Charge maneuver
 */
async function executeCharge(actor, target) {
    if (!target) {
        ui.notifications?.warn('Charge requires a target!');
        return;
    }
    // Set flag for bonus damage
    await actor.setFlag('mastery-system', 'chargeActive', true);
    await actor.setFlag('mastery-system', 'chargeTarget', target.id);
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-maneuver">
        <h3>${actor.name} charges at ${target.name}!</h3>
        <p>Move up to Speed toward target. Next attack against ${target.name} gets <strong>+1d8 damage</strong>.</p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info(`Charge: +1d8 damage on next attack vs ${target.name}!`);
}
/**
 * Execute Leap maneuver
 */
async function executeLeap(actor) {
    // This would normally require an Athletics check
    // For now, just mark it as used
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-maneuver">
        <h3>${actor.name} leaps!</h3>
        <p>Make an Athletics check (TN 12+) to jump over obstacles or gaps.</p>
        <p><em>GM determines distance and difficulty.</em></p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info('Leap: Make Athletics check as needed!');
}
/**
 * Execute Teleport maneuver
 */
async function executeTeleport(actor) {
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-maneuver">
        <h3>${actor.name} teleports!</h3>
        <p>Instantly move to a location you can see (within range).</p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info('Teleport: Move token to new location!');
}
/**
 * Execute generic maneuver
 */
async function executeGenericManeuver(actor, maneuver) {
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-maneuver">
        <h3>${actor.name} uses ${maneuver.name}!</h3>
        <p>${maneuver.effect}</p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info(`${maneuver.name} activated!`);
}
/**
 * Check if actor has Dash active
 */
export function hasDashActive(actor) {
    return actor.getFlag('mastery-system', 'dashActive') || false;
}
/**
 * Get current speed (with modifiers)
 */
export function getCurrentSpeed(actor) {
    const baseSpeed = actor.system.combat?.speed || 6;
    if (hasDashActive(actor)) {
        return actor.getFlag('mastery-system', 'dashSpeed') || (baseSpeed * 2);
    }
    // TODO: Check for Slowed condition
    return baseSpeed;
}
/**
 * Check if actor has Charge bonus vs specific target
 */
export function hasChargeBonusVs(actor, targetId) {
    const chargeActive = actor.getFlag('mastery-system', 'chargeActive');
    const chargeTarget = actor.getFlag('mastery-system', 'chargeTarget');
    return chargeActive && chargeTarget === targetId;
}
/**
 * Clear maneuver flags at end of turn
 */
export async function clearManeuverFlags(actor) {
    await actor.unsetFlag('mastery-system', 'dashActive');
    await actor.unsetFlag('mastery-system', 'dashSpeed');
    await actor.unsetFlag('mastery-system', 'disengageActive');
    await actor.unsetFlag('mastery-system', 'chargeActive');
    await actor.unsetFlag('mastery-system', 'chargeTarget');
}
//# sourceMappingURL=maneuvers.js.map