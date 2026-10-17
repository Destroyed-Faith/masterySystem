/**
 * Blocks ordinary token drags from bypassing guided Flee / Movement Power commits.
 * Resolver writes must pass `masteryAuthorizedMove: true` in the update options.
 */
export const MASTERY_AUTHORIZED_MOVE = 'masteryAuthorizedMove';
export function isMasteryAuthorizedMove(options) {
    return options?.[MASTERY_AUTHORIZED_MOVE] === true;
}
export function isResolverBoundMovementAction(action) {
    if (!action)
        return false;
    const id = String(action.optionId || '').toLowerCase();
    if (id === 'flee')
        return true;
    if (String(action.powerType || '').toLowerCase() === 'movement')
        return true;
    if (id.startsWith('movement-'))
        return true;
    return false;
}
/**
 * Pure gate used by `preUpdateToken`. Returns whether the position change may proceed.
 */
export function gateTokenMovementUpdate(input) {
    if (input.change?.x === undefined && input.change?.y === undefined) {
        return { allow: true, reason: 'no-position' };
    }
    if (!input.isLocalUser)
        return { allow: true, reason: 'remote' };
    if (!input.combatStarted)
        return { allow: true, reason: 'out-of-combat' };
    const authorized = isMasteryAuthorizedMove(input.options);
    if (authorized)
        return { allow: true, reason: 'authorized' };
    const traversal = String(input.traversal || '');
    if (traversal === 'forced' || traversal === 'reaction') {
        return { allow: true, reason: 'forced-or-reaction' };
    }
    if (input.guidedActive) {
        return {
            allow: false,
            reason: 'Guided movement is active — click a destination or cancel with Esc. Dragging is blocked.',
        };
    }
    if (isResolverBoundMovementAction(input.currentAction)) {
        return {
            allow: false,
            reason: 'Flee and Movement Powers must use guided movement. Dragging is blocked.',
        };
    }
    return { allow: true, reason: 'ordinary' };
}
//# sourceMappingURL=token-move-gate.js.map