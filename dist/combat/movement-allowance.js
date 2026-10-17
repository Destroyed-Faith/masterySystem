/**
 * v0.9.9.5 Movement Reduction on the actual movement distance.
 *
 * Order: normal distance for this action (Dash doubles Speed first), then
 * Movement Enhancement once, then one halve. A second Movement Action is
 * halved from that same total, not from the already-halved remainder.
 * Forced movement and Reactions are not Movement Actions.
 */
import { halveMovementMeters, movementReductionActive } from '../stones/stone-combat-effects.js';
export function movementActionMeters(input) {
    if (input.kind === 'forced' || input.kind === 'reaction') {
        const raw = input.powerMeters != null ? input.powerMeters : input.speed;
        return { meters: Math.max(0, Number(raw) || 0), movementAction: false };
    }
    const speed = Math.max(0, Number(input.speed) || 0);
    const enhancement = Math.max(0, Number(input.enhancement) || 0);
    const printed = Math.max(0, Number(input.powerMeters) || 0);
    const base = input.kind === 'dash' ? speed * 2
        : input.kind === 'flee' ? speed * 4
            : input.kind === 'power' ? printed
                : speed;
    const total = base + enhancement;
    return {
        meters: input.reduced ? halveMovementMeters(total) : total,
        movementAction: true,
    };
}
export function enhancementMetersFromActor(actor) {
    const rs = actor?.getFlag?.('mastery-system', 'roundState') ?? actor?.flags?.['mastery-system']?.roundState;
    const shop = Math.max(0, Number(rs?.moveBonusMeters) || 0);
    const stone = Math.max(0, Number(rs?.stoneBonuses?.extraMoveMeters) || 0);
    return shop + stone;
}
export function classifyTokenMovement(tokenDoc) {
    const traversal = String(tokenDoc?.getFlag?.('mastery-system', 'movementTraversal') || '');
    if (traversal === 'forced')
        return 'forced';
    if (traversal === 'reaction')
        return 'reaction';
    const action = tokenDoc?.getFlag?.('mastery-system', 'currentAction') || {};
    const id = String(action.optionId || action.id || '').toLowerCase();
    const powerType = String(action.powerType || '').toLowerCase();
    if (id.includes('reposition') || powerType === 'reaction')
        return 'reaction';
    if (id === 'dash')
        return 'dash';
    if (id === 'disengage')
        return 'disengage';
    if (id === 'flee')
        return 'flee';
    if (powerType === 'movement' || id.startsWith('movement-') || traversal === 'teleport' || traversal === 'safe') {
        return 'power';
    }
    if (action.category === 'movement' || id === 'move')
        return 'move';
    return null;
}
function gridOf(tokenDoc) {
    const grid = tokenDoc?.parent?.grid ?? {};
    const size = Number(grid.size) || 100;
    const distance = Number(grid.distance) > 0 ? Number(grid.distance) : 1;
    return { size, distance };
}
export function sceneMeters(tokenDoc, dx, dy) {
    const { size, distance } = gridOf(tokenDoc);
    return (Math.hypot(dx, dy) / size) * distance;
}
/**
 * Mutates `change` so a Movement Action cannot land past its once-halved allowance.
 * Guided commits that are already inside the allowance are left untouched.
 * Forced movement and Reactions are not clamped and do not count as a Movement Action.
 */
export function applyMovementCapToTokenChange(tokenDoc, change, combat) {
    const fromX = Number(tokenDoc?.x) || 0;
    const fromY = Number(tokenDoc?.y) || 0;
    const toX = change?.x !== undefined ? Number(change.x) : fromX;
    const toY = change?.y !== undefined ? Number(change.y) : fromY;
    const movedMeters = sceneMeters(tokenDoc, toX - fromX, toY - fromY);
    const kind = classifyTokenMovement(tokenDoc);
    const idle = {
        clamped: false,
        allowedMeters: movedMeters,
        movedMeters,
        movementAction: false,
        feedback: '',
    };
    if (!kind)
        return idle;
    const actor = tokenDoc?.actor;
    const live = combat !== undefined ? combat : globalThis.game?.combat;
    const reduced = kind === 'forced' || kind === 'reaction' ? false : movementReductionActiveOn(actor, live);
    const action = tokenDoc?.getFlag?.('mastery-system', 'currentAction') || {};
    if (kind === 'power' && action.basisMeters == null) {
        return { ...idle, movementAction: true };
    }
    const speed = Number(actor?.system?.combat?.speed) || 0;
    const resolved = movementActionMeters({
        kind,
        speed,
        enhancement: enhancementMetersFromActor(actor),
        powerMeters: action.basisMeters != null ? Number(action.basisMeters) : undefined,
        reduced,
    });
    if (!resolved.movementAction) {
        return { ...idle, allowedMeters: resolved.meters, movementAction: false };
    }
    const allowed = resolved.meters;
    if (movedMeters <= allowed + 0.05) {
        return {
            clamped: false,
            allowedMeters: allowed,
            movedMeters,
            movementAction: true,
            feedback: '',
        };
    }
    if (!reduced && kind !== 'power' && kind !== 'flee') {
        return { clamped: false, allowedMeters: allowed, movedMeters, movementAction: true, feedback: '' };
    }
    const scale = allowed <= 0 || movedMeters <= 0 ? 0 : allowed / movedMeters;
    if (change) {
        change.x = fromX + (toX - fromX) * scale;
        change.y = fromY + (toY - fromY) * scale;
    }
    const feedback = reduced
        ? `Movement Reduction: this Movement Action stops at ${allowed} m ` +
            `(${halveSource(speed, kind, action, enhancementMetersFromActor(actor))} m halved). ` +
            'The Movement Action is still spent once.'
        : kind === 'flee'
            ? `Flee stops at ${allowed} m (4 × Speed).`
            : `This Movement Power stops at ${allowed} m.`;
    const ui = globalThis.ui;
    ui?.notifications?.warn?.(feedback);
    return {
        clamped: true,
        allowedMeters: allowed,
        movedMeters: allowed,
        movementAction: true,
        feedback,
    };
}
function movementReductionActiveOn(actor, combat) {
    if (combat) {
        const raw = actor?.getFlag?.('mastery-system', 'movementReduction');
        if (!raw || typeof raw !== 'object')
            return false;
        return String(raw.combatId ?? '') === String(combat.id ?? '')
            && Number(raw.round) === Number(combat.round);
    }
    return movementReductionActive(actor);
}
function halveSource(speed, kind, action, enhancement) {
    const printed = Number(action?.basisMeters) || 0;
    const base = kind === 'dash' ? speed * 2 : kind === 'flee' ? speed * 4 : kind === 'power' ? printed : speed;
    return base + enhancement;
}
//# sourceMappingURL=movement-allowance.js.map