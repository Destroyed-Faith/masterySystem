/**
 * Keep Ready / Sealed / Burned stone pools in sync across world actors and
 * unlinked token actors. Seals written via getActionEconomyActor often land on
 * the token while Safe Haven / sheet GM tools update the world prototype.
 */
import { STONE_POOL_ATTRIBUTE_KEYS, getActionEconomyActor } from '../combat/action-economy.js';
import { resolvedStonePoolMax, usesV099Stones } from '../progression/v099-rules.js';
const POOL_KEYS = [...STONE_POOL_ATTRIBUTE_KEYS, 'colorless'];
/** Pool capacity for Ready refill (matches Safe Haven / Actor.prepareBaseData). */
export function stonePoolReadyMax(system, attr, pool) {
    const storedMax = Math.max(0, Number(pool?.max) || 0);
    if (attr === 'colorless') {
        if (usesV099Stones(system)) {
            return Math.max(storedMax, Math.max(0, Math.floor(Number(system?.progression?.permanentColorless) || 0)));
        }
        return storedMax;
    }
    const attrValue = Math.max(0, Number(system?.attributes?.[attr]?.value) || 0);
    const resolved = resolvedStonePoolMax(system, attr, attrValue);
    const assigned = Math.max(0, Math.floor(Number(system?.progression?.stoneAssignments?.[attr]) || 0));
    return Math.max(resolved, storedMax, assigned);
}
function actorSyncKey(actor) {
    if (actor?.isToken) {
        const tid = String(actor?.token?.id ?? actor?.id ?? '');
        return `token:${tid}`;
    }
    return `world:${String(actor?.id ?? '')}`;
}
/**
 * Every document that may hold combat stone pool state for this character:
 * the given actor, its economy owner, the world prototype, and placed tokens.
 */
export function listStonePoolSyncActors(actor) {
    if (!actor)
        return [];
    const out = [];
    const seen = new Set();
    const add = (a) => {
        if (!a || a.type !== 'character')
            return;
        const key = actorSyncKey(a);
        if (!key.endsWith(':') && seen.has(key))
            return;
        if (seen.has(key))
            return;
        seen.add(key);
        out.push(a);
    };
    add(actor);
    try {
        add(getActionEconomyActor(actor));
    }
    catch {
        /* economy resolve optional */
    }
    let baseId = String(actor?.id ?? '');
    try {
        if (actor?.isToken) {
            baseId = String(actor?.token?.actorId ?? actor?.token?.document?.actorId ?? baseId);
        }
        else {
            const doc = actor?.token?.document;
            if (doc?.actorId)
                baseId = String(doc.actorId);
        }
    }
    catch {
        /* ignore */
    }
    try {
        const world = baseId ? globalThis.game?.actors?.get?.(baseId) : null;
        add(world);
    }
    catch {
        /* ignore */
    }
    try {
        const tokens = globalThis.canvas?.tokens?.placeables ?? [];
        for (const token of tokens) {
            const aid = String(token?.document?.actorId ?? '');
            if (!baseId || aid !== baseId)
                continue;
            add(token?.actor);
        }
    }
    catch {
        /* canvas optional */
    }
    return out;
}
/** Plain stonePools object with Sealed/Burned cleared (Word of Recall hold respected). */
export function buildReadyStonePoolsObject(system, sealHold) {
    const holdAttrs = {};
    for (const [attr, n] of Object.entries(sealHold?.attrCounts ?? {})) {
        const v = Math.max(0, Math.floor(Number(n) || 0));
        if (v > 0)
            holdAttrs[attr] = v;
    }
    const next = {};
    const existing = system?.stonePools ?? {};
    for (const attr of POOL_KEYS) {
        const poolData = existing[attr];
        if (poolData == null && attr === 'colorless')
            continue;
        const maxStones = stonePoolReadyMax(system, attr, poolData ?? {});
        const heldSealed = Math.min(holdAttrs[attr] ?? 0, maxStones);
        next[attr] = {
            max: maxStones,
            current: Math.max(0, maxStones - heldSealed),
            sustained: 0,
            sealed: heldSealed,
            burned: 0,
        };
    }
    return next;
}
/** Dotted-path updates for callers that prefer partial writes. */
export function buildReadyStonePoolUpdates(system, sealHold) {
    const pools = buildReadyStonePoolsObject(system, sealHold);
    const updates = {};
    for (const [attr, pool] of Object.entries(pools)) {
        updates[`system.stonePools.${attr}.max`] = pool.max;
        updates[`system.stonePools.${attr}.current`] = pool.current;
        updates[`system.stonePools.${attr}.sustained`] = pool.sustained;
        updates[`system.stonePools.${attr}.sealed`] = pool.sealed;
        updates[`system.stonePools.${attr}.burned`] = pool.burned;
    }
    return updates;
}
/**
 * Force every economy document for this character to Ready stone pools.
 * Uses a whole `system.stonePools` replace so Foundry cannot leave a nested
 * `sealed` field behind on a DataModel fragment.
 */
export async function forceReadyStonePoolsOnCharacter(actor, sealHold) {
    const targets = listStonePoolSyncActors(actor);
    let vitalityReady = 0;
    let vitalitySealed = 0;
    for (const target of targets) {
        const pools = buildReadyStonePoolsObject(target?.system, sealHold);
        try {
            await target.update?.({ 'system.stonePools': pools });
        }
        catch (err) {
            console.warn('Mastery System | forceReadyStonePools update failed for', target?.name, err);
            try {
                await target.update?.(buildReadyStonePoolUpdates(target?.system, sealHold));
            }
            catch (err2) {
                console.warn('Mastery System | forceReadyStonePools dotted fallback failed', err2);
            }
        }
        vitalityReady = Math.max(vitalityReady, Math.max(0, Math.floor(Number(target?.system?.stonePools?.vitality?.current) || 0)));
        vitalitySealed = Math.max(vitalitySealed, Math.max(0, Math.floor(Number(target?.system?.stonePools?.vitality?.sealed) || 0)));
    }
    return { actors: targets.length, vitalityReady, vitalitySealed };
}
//# sourceMappingURL=stone-pool-sync.js.map