/**
 * Round-1 Surprise ordering: surprised combatants act last (among themselves
 * still sorted by initiative). Initiative Scores are never modified.
 */
const SURPRISED_IDS_FLAG = 'surprisedCombatantIds';
/** Legacy flag; still read for migration. */
const SURPRISE_EDGES_FLAG = 'surpriseEdges';
const SURPRISE_ORDER_FLAG = 'surpriseOrderIds';
function asIdList(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    const seen = new Set();
    for (const entry of raw) {
        const id = String(entry || '').trim();
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}
/** Migrate legacy attacker→target edges into a set of surprised (target) ids. */
export function surprisedIdsFromLegacyEdges(edges) {
    return asIdList(edges.map((e) => e.targetId));
}
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
export function readSurprisedCombatantIds(combat) {
    const raw = typeof combat?.getFlag === 'function'
        ? combat.getFlag('mastery-system', SURPRISED_IDS_FLAG)
        : combat?.flags?.['mastery-system']?.[SURPRISED_IDS_FLAG];
    const fromFlag = asIdList(raw);
    if (fromFlag.length)
        return fromFlag;
    // Migration: flatten legacy edges to surprised targets.
    return surprisedIdsFromLegacyEdges(readSurpriseEdges(combat));
}
export function isCombatantSurprised(combat, combatantId) {
    const id = String(combatantId || '').trim();
    if (!id)
        return false;
    return readSurprisedCombatantIds(combat).includes(id);
}
export function readSurpriseOrderIds(combat) {
    const raw = typeof combat?.getFlag === 'function'
        ? combat.getFlag('mastery-system', SURPRISE_ORDER_FLAG)
        : combat?.flags?.['mastery-system']?.[SURPRISE_ORDER_FLAG];
    return asIdList(raw);
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
 * Round-1 order: non-surprised by initiative, then surprised by initiative.
 * Accepts either a surprised-id list or (legacy) edges — edges are flattened to targets.
 */
export function buildSurpriseRound1Order(combatants, surprisedIdsOrEdges) {
    const active = combatants.filter((c) => c.id);
    const base = sortByInitiativeOnly(active);
    const living = base.filter((c) => !c.defeated);
    const defeatedIds = base.filter((c) => c.defeated).map((c) => c.id);
    let surprisedSet;
    if (Array.isArray(surprisedIdsOrEdges) &&
        surprisedIdsOrEdges.length > 0 &&
        typeof surprisedIdsOrEdges[0] === 'object' &&
        surprisedIdsOrEdges[0] != null &&
        'targetId' in surprisedIdsOrEdges[0]) {
        surprisedSet = new Set(surprisedIdsFromLegacyEdges(surprisedIdsOrEdges));
    }
    else {
        surprisedSet = new Set(asIdList(surprisedIdsOrEdges));
    }
    const front = living.filter((c) => !surprisedSet.has(c.id));
    const back = living.filter((c) => surprisedSet.has(c.id));
    return {
        ok: true,
        orderIds: [...front.map((c) => c.id), ...back.map((c) => c.id), ...defeatedIds],
    };
}
export async function writeSurprisedCombatantIds(combat, ids) {
    if (!combat?.setFlag)
        return;
    await combat.setFlag('mastery-system', SURPRISED_IDS_FLAG, asIdList(ids));
    // Drop legacy edges so migration does not re-add stale targets.
    try {
        await combat.unsetFlag?.('mastery-system', SURPRISE_EDGES_FLAG);
    }
    catch {
        /* ignore */
    }
}
export async function writeSurpriseOrderIds(combat, orderIds) {
    if (!combat?.setFlag)
        return;
    await combat.setFlag('mastery-system', SURPRISE_ORDER_FLAG, asIdList(orderIds));
}
export async function clearSurpriseOrderState(combat) {
    if (!combat)
        return;
    for (const key of [SURPRISED_IDS_FLAG, SURPRISE_EDGES_FLAG, SURPRISE_ORDER_FLAG]) {
        try {
            await combat.unsetFlag?.('mastery-system', key);
        }
        catch {
            /* ignore */
        }
    }
}
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
    return buildSurpriseRound1Order(combatants, readSurprisedCombatantIds(combat));
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
/** Mark combatants as surprised (Round 1: act last). Idempotent union. */
export async function markCombatantsSurprised(combat, combatantIds) {
    const next = asIdList([...readSurprisedCombatantIds(combat), ...combatantIds]);
    await writeSurprisedCombatantIds(combat, next);
    return applySurpriseOrderToCombat(combat);
}
/** Toggle one combatant’s surprised state for Round 1. */
export async function toggleSurprisedCombatant(combat, combatantId) {
    const id = String(combatantId || '').trim();
    if (!id)
        return { ok: false, error: 'Missing combatant', surprised: false };
    const current = new Set(readSurprisedCombatantIds(combat));
    if (current.has(id))
        current.delete(id);
    else
        current.add(id);
    await writeSurprisedCombatantIds(combat, [...current]);
    const result = await applySurpriseOrderToCombat(combat);
    return { ...result, surprised: current.has(id) };
}
/**
 * @deprecated Use markCombatantsSurprised(targetIds). Kept for callers that
 * still pass attacker/target pairs — only targets are marked surprised.
 */
export async function addSurpriseEdges(combat, _attackerIds, targetIds) {
    return markCombatantsSurprised(combat, targetIds);
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