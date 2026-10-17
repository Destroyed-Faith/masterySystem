/**
 * Threat Zones (Movement v0.9.9.5).
 *
 * A Threat Zone is the area within a creature's current Melee Reach, measured
 * from the edge of its occupied footprint. Entry opens a Reaction window after
 * arrival. Exit opens one before departure. Teleport checks only the two
 * endpoints. Safe Movement and Disengage suppress those windows. Lacerate is a
 * separate Movement Event and is not suppressed.
 */
const GRID = { size: 100, distance: 1 };
export function tokenBox(token, grid = GRID) {
    const size = Number(grid.size) > 0 ? Number(grid.size) : 100;
    const dist = Number(grid.distance) > 0 ? Number(grid.distance) : 1;
    const left = (Number(token.x) / size) * dist;
    const top = (Number(token.y) / size) * dist;
    const width = Math.max(dist, (Number(token.width) > 0 ? Number(token.width) : 1) * dist);
    const height = Math.max(dist, (Number(token.height) > 0 ? Number(token.height) : 1) * dist);
    return { left, top, right: left + width, bottom: top + height };
}
/** Gap between footprint edges. Overlap is 0. */
export function edgeGap(a, b) {
    const dx = Math.max(0, a.left - b.right, b.left - a.right);
    const dy = Math.max(0, a.top - b.bottom, b.top - a.bottom);
    return Math.hypot(dx, dy);
}
export function insideThreat(gap, reachMeters) {
    return gap <= Math.max(0, reachMeters) + 0.001;
}
function areEnemies(a, b) {
    const da = Math.floor(Number(a) || 0);
    const db = Math.floor(Number(b) || 0);
    if (da === 0 || db === 0)
        return false;
    return da !== db;
}
function translated(box, dx, dy) {
    return { left: box.left + dx, top: box.top + dy, right: box.right + dx, bottom: box.bottom + dy };
}
function pathEnters(startInside, endInside, samplesInside) {
    return !startInside && (endInside || samplesInside);
}
export function planThreatZoneWindows(move, reactors, grid = GRID) {
    const from = tokenBox({ x: move.fromX, y: move.fromY, width: move.width, height: move.height }, grid);
    const to = tokenBox({ ...move, x: move.toX, y: move.toY }, grid);
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const movementEvent = Math.hypot(dx, dy) > 0.001;
    const windows = [];
    if (!movementEvent)
        return { windows, movementEvent };
    const steps = move.traversal === 'teleport' ? 0 : 8;
    for (const reactor of reactors) {
        if (String(reactor.id) === String(move.moverId))
            continue;
        if (!areEnemies(move.disposition, reactor.disposition))
            continue;
        const zone = tokenBox(reactor, grid);
        const reach = Math.max(0, Number(reactor.reachMeters) || 0);
        const startInside = insideThreat(edgeGap(from, zone), reach);
        const endInside = insideThreat(edgeGap(to, zone), reach);
        let sampleInside = false;
        for (let i = 1; i < steps; i += 1) {
            const t = i / steps;
            const mid = translated(from, dx * t, dy * t);
            if (insideThreat(edgeGap(mid, zone), reach)) {
                sampleInside = true;
                break;
            }
        }
        const entered = move.traversal === 'teleport' ? !startInside && endInside : pathEnters(startInside, endInside, sampleInside);
        const left = move.traversal === 'teleport'
            ? startInside && !endInside
            : (startInside && !endInside) || (!startInside && !endInside && sampleInside);
        const passThrough = !startInside && !endInside && sampleInside && move.traversal !== 'teleport';
        const push = (kind, when) => {
            let suppressed = false;
            let reason;
            if (move.protectedFromReactions) {
                suppressed = true;
                reason = 'protected-movement';
            }
            else if (Math.floor(Number(reactor.reactionsRemaining) || 0) <= 0) {
                suppressed = true;
                reason = 'no-reaction';
            }
            windows.push({ kind, reactorId: reactor.id, when, suppressed, reason, passThrough });
        };
        if (left)
            push('exit', 'before-update');
        if (entered && endInside)
            push('entry', 'after-update');
        else if (entered && passThrough)
            push('entry', 'before-update');
    }
    windows.sort((a, b) => {
        if (a.when !== b.when)
            return a.when === 'before-update' ? -1 : 1;
        if (a.kind !== b.kind)
            return a.kind === 'entry' ? -1 : 1;
        return a.reactorId.localeCompare(b.reactorId);
    });
    return { windows, movementEvent };
}
/** Melee Reach used for the Threat Zone: stored reach, else 2 m, plus Growth Form. */
export function currentMeleeReachMeters(actor) {
    const stored = Number(actor?.system?.combat?.meleeReachMeters);
    const base = Number.isFinite(stored) && stored > 0 ? stored : 2;
    let bonus = 0;
    try {
        const effects = actor?.effects;
        const list = Array.isArray(effects?.contents)
            ? effects.contents
            : typeof effects?.[Symbol.iterator] === 'function'
                ? Array.from(effects)
                : [];
        for (const effect of list) {
            const gf = effect?.flags?.['mastery-system']?.mechanics?.growthForm;
            bonus = Math.max(bonus, Math.max(0, Number(gf?.reachBonusM) || 0));
        }
    }
    catch {
        /* ignore */
    }
    const stone = Math.max(0, Math.floor(Number(actor?.getFlag?.('mastery-system', 'roundState')?.stoneBonuses?.meleeReachBonusM) || 0));
    return base + bonus + stone;
}
let opener = null;
export function setThreatZoneOpener(fn) {
    opener = fn;
}
async function reactorsFromScene(mover, sceneTokens) {
    const out = [];
    for (const token of sceneTokens) {
        const doc = token?.document ?? token;
        const id = String(doc?.id || '');
        if (!id || id === String(mover?.id || ''))
            continue;
        const actor = doc.actor ?? token?.actor;
        let remaining = Number(actor?.system?.combat?.reactionsRemaining);
        if (!Number.isFinite(remaining)) {
            try {
                const { getAvailableReactionActions } = await import('./action-economy.js');
                remaining = getAvailableReactionActions(actor, globalThis.game?.combat ?? null);
            }
            catch {
                remaining = 0;
            }
        }
        out.push({
            id,
            x: Number(doc.x) || 0,
            y: Number(doc.y) || 0,
            width: Number(doc.width) || 1,
            height: Number(doc.height) || 1,
            disposition: Number(doc.disposition ?? token?.disposition) || 0,
            reachMeters: currentMeleeReachMeters(actor),
            reactionsRemaining: Math.max(0, Math.floor(remaining) || 0),
        });
    }
    return out;
}
export async function resolveThreatZoneOnTokenChange(tokenDoc, change, when, sceneTokens = []) {
    const fromX = when === 'before-update' ? Number(tokenDoc?.x) : Number(tokenDoc?._source?.x ?? tokenDoc?.x);
    const fromY = when === 'before-update' ? Number(tokenDoc?.y) : Number(tokenDoc?._source?.y ?? tokenDoc?.y);
    const toX = change?.x !== undefined ? Number(change.x) : Number(tokenDoc?.x);
    const toY = change?.y !== undefined ? Number(change.y) : Number(tokenDoc?.y);
    const kind = String(tokenDoc?.getFlag?.('mastery-system', 'movementTraversal') || 'path');
    const protectedFromReactions = kind === 'safe' ||
        kind === 'disengage' ||
        kind === 'slip' ||
        !!tokenDoc?.actor?.getFlag?.('mastery-system', 'roundState')?.safeMovementThisTurn;
    const move = {
        moverId: String(tokenDoc?.id || ''),
        fromX,
        fromY,
        toX,
        toY,
        width: Number(tokenDoc?.width) || 1,
        height: Number(tokenDoc?.height) || 1,
        disposition: Number(tokenDoc?.disposition) || 0,
        traversal: kind === 'teleport' ? 'teleport' : 'path',
        protectedFromReactions,
    };
    const reactors = await reactorsFromScene(tokenDoc, sceneTokens);
    const plan = planThreatZoneWindows(move, reactors);
    for (const window of plan.windows) {
        if (window.when !== when || window.suppressed)
            continue;
        const reactor = reactors.find((r) => r.id === window.reactorId);
        if (!reactor)
            continue;
        if (opener)
            await opener(window, reactor);
        else
            await openLiveThreatWindow(tokenDoc, window, reactor, sceneTokens);
    }
    return plan;
}
async function openLiveThreatWindow(moverDoc, window, reactor, sceneTokens) {
    const moverActor = moverDoc?.actor;
    const reactorToken = sceneTokens.find((token) => String((token?.document ?? token)?.id || '') === reactor.id);
    const reactorActor = reactorToken?.actor ?? reactorToken?.document?.actor;
    const combat = globalThis.game?.combat ?? null;
    if (!moverActor || !reactorActor || !combat)
        return;
    try {
        const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');
        await runInteractiveReactionWindow({
            defender: reactorActor,
            attacker: moverActor,
            combat,
            rawDamage: 0,
            hit: false,
            phase: 'opportunity',
            movementThreat: window.kind,
            opportunityEnemyTokenIds: [reactor.id],
            silentIfEmpty: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | Threat Zone reaction window failed', err);
    }
}
//# sourceMappingURL=threat-zone.js.map