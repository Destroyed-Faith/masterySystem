/**
 * Round-1 Surprise Priority ordering from explicit attacker→target edges.
 * Initiative Scores are never modified — only turn sequence.
 */
const SURPRISE_EDGES_FLAG = 'surpriseEdges';
const SURPRISE_ORDER_FLAG = 'surpriseOrderIds';
export function readSurpriseEdges(combat) {
    const raw = typeof combat?.getFlag === 'function'
        ? combat.getFlag('mastery-system', SURPRISE_EDGES_FLAG)
        : combat?.flags?.['mastery-system']?.[SURPRISE_EDGES_FLAG];
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((e) => ({
        attackerId: String(e?.attackerId || '').trim(),
        targetId: String(e?.targetId || '').trim(),
    }))
        .filter((e) => e.attackerId && e.targetId && e.attackerId !== e.targetId);
}
export function readSurpriseOrderIds(combat) {
    const raw = typeof combat?.getFlag === 'function'
        ? combat.getFlag('mastery-system', SURPRISE_ORDER_FLAG)
        : combat?.flags?.['mastery-system']?.[SURPRISE_ORDER_FLAG];
    if (!Array.isArray(raw))
        return [];
    return raw.map((id) => String(id || '').trim()).filter(Boolean);
}
/** Base initiative order without Surprise (higher initiative first). */
export function sortByInitiativeOnly(combatants) {
    return [...combatants].sort((a, b) => {
        const aDef = !!a.defeated;
        const bDef = !!b.defeated;
        if (aDef !== bDef)
            return aDef ? 1 : -1;
        if (a.initiative !== b.initiative)
            return b.initiative - a.initiative;
        const aMr = Math.floor(Number(a.masteryRank) || 0);
        const bMr = Math.floor(Number(b.masteryRank) || 0);
        if (aMr !== bMr)
            return bMr - aMr;
        const aAg = Math.floor(Number(a.agility) || 0);
        const bAg = Math.floor(Number(b.agility) || 0);
        if (aAg !== bAg)
            return bAg - aAg;
        const aD = Math.floor(Number(a.tieD8) || 0);
        const bD = Math.floor(Number(b.tieD8) || 0);
        if (aD !== bD)
            return bD - aD;
        return String(a.id).localeCompare(String(b.id));
    });
}
/**
 * Build Round-1 order: preserve initiative priority wherever compatible with
 * edges “attacker before target”. Detect cycles.
 */
export function buildSurpriseRound1Order(combatants, edges) {
    const active = combatants.filter((c) => c.id);
    const base = sortByInitiativeOnly(active);
    const living = base.filter((c) => !c.defeated);
    const defeatedIds = base.filter((c) => c.defeated).map((c) => c.id);
    const ids = new Set(living.map((c) => c.id));
    const baseIndex = new Map(living.map((c, i) => [c.id, i]));
    const relevant = edges.filter((e) => ids.has(e.attackerId) && ids.has(e.targetId));
    if (!relevant.length) {
        return { ok: true, orderIds: [...living.map((c) => c.id), ...defeatedIds] };
    }
    const preds = new Map();
    const succs = new Map();
    for (const id of ids) {
        preds.set(id, new Set());
        succs.set(id, new Set());
    }
    for (const e of relevant) {
        preds.get(e.targetId).add(e.attackerId);
        succs.get(e.attackerId).add(e.targetId);
    }
    const indeg = new Map();
    for (const id of ids)
        indeg.set(id, preds.get(id).size);
    const ready = living.filter((c) => (indeg.get(c.id) ?? 0) === 0).map((c) => c.id);
    const order = [];
    while (ready.length) {
        ready.sort((a, b) => (baseIndex.get(a) ?? 0) - (baseIndex.get(b) ?? 0));
        const next = ready.shift();
        order.push(next);
        for (const succ of succs.get(next) ?? []) {
            const n = (indeg.get(succ) ?? 0) - 1;
            indeg.set(succ, n);
            if (n === 0)
                ready.push(succ);
        }
    }
    if (order.length !== ids.size) {
        const remaining = [...ids].filter((id) => !order.includes(id));
        return {
            ok: false,
            error: 'Contradictory Surprise relationships form a cycle.',
            cycleIds: remaining,
        };
    }
    return { ok: true, orderIds: [...order, ...defeatedIds] };
}
export async function writeSurpriseEdges(combat, edges) {
    if (!combat?.setFlag)
        return;
    const cleaned = edges
        .map((e) => ({
        attackerId: String(e.attackerId || '').trim(),
        targetId: String(e.targetId || '').trim(),
    }))
        .filter((e) => e.attackerId && e.targetId && e.attackerId !== e.targetId);
    await combat.setFlag('mastery-system', SURPRISE_EDGES_FLAG, cleaned);
}
export async function writeSurpriseOrderIds(combat, orderIds) {
    if (!combat?.setFlag)
        return;
    await combat.setFlag('mastery-system', SURPRISE_ORDER_FLAG, orderIds.map(String));
}
export async function clearSurpriseOrderState(combat) {
    if (!combat)
        return;
    try {
        await combat.unsetFlag?.('mastery-system', SURPRISE_EDGES_FLAG);
    }
    catch {
        /* ignore */
    }
    try {
        await combat.unsetFlag?.('mastery-system', SURPRISE_ORDER_FLAG);
    }
    catch {
        /* ignore */
    }
}
/** Recalculate and persist Round-1 order from edges; returns result. */
export function computeSurpriseOrderForCombat(combat) {
    const bag = combat?.combatants;
    const list = bag?.contents
        ? bag.contents
        : typeof bag?.values === 'function'
            ? Array.from(bag.values())
            : Array.from(bag ?? []);
    const combatants = list.map((c) => ({
        id: String(c.id ?? ''),
        initiative: Number(c.initiative) || 0,
        defeated: !!c.defeated,
        masteryRank: Number(c.actor?.system?.masteryRank ?? c.actor?.system?.progression?.masteryRank) || 0,
        agility: Number(c.actor?.system?.attributes?.agility?.value ?? c.actor?.system?.attributes?.agility) || 0,
        tieD8: Number(c.getFlag?.('mastery-system', 'initiativeTieD8')) || 0,
    }));
    return buildSurpriseRound1Order(combatants, readSurpriseEdges(combat));
}
export async function applySurpriseOrderToCombat(combat) {
    const round = Math.max(1, Math.floor(Number(combat?.round) || 1));
    if (round > 1) {
        await clearSurpriseOrderState(combat);
        return { ok: true, orderIds: [] };
    }
    const result = computeSurpriseOrderForCombat(combat);
    if (!result.ok)
        return result;
    await writeSurpriseOrderIds(combat, result.orderIds);
    if (typeof combat.setupTurns === 'function') {
        await combat.setupTurns();
    }
    return result;
}
export async function addSurpriseEdges(combat, attackerIds, targetIds) {
    const existing = readSurpriseEdges(combat);
    const next = [...existing];
    const key = (a, t) => `${a}>${t}`;
    const have = new Set(next.map((e) => key(e.attackerId, e.targetId)));
    for (const a of attackerIds) {
        for (const t of targetIds) {
            const aid = String(a).trim();
            const tid = String(t).trim();
            if (!aid || !tid || aid === tid)
                continue;
            const k = key(aid, tid);
            if (have.has(k))
                continue;
            have.add(k);
            next.push({ attackerId: aid, targetId: tid });
        }
    }
    await writeSurpriseEdges(combat, next);
    return applySurpriseOrderToCombat(combat);
}
/** Clear actor surprisePriority flags after Round 1. */
export async function clearActorSurprisePriorityFlags(combat) {
    const bag = combat?.combatants;
    const list = bag?.contents
        ? bag.contents
        : typeof bag?.values === 'function'
            ? Array.from(bag.values())
            : Array.from(bag ?? []);
    for (const c of list) {
        const actor = c.actor;
        if (!actor?.unsetFlag)
            continue;
        try {
            if (actor.getFlag?.('mastery-system', 'surprisePriority')) {
                await actor.unsetFlag('mastery-system', 'surprisePriority');
            }
        }
        catch {
            /* ignore */
        }
    }
}
//# sourceMappingURL=surprise-order.js.map